/**
 * context() - Load context chain, knowledge, and state
 *
 * This is the main workhorse command. It:
 * 1. Walks up to find all ancestor .megg directories
 * 2. Loads the info.md chain
 * 3. Loads knowledge.md (full, summary, or blocked based on size)
 * 4. Loads state.md if present and not expired
 * 5. Discovers siblings and children
 * 6. Returns formatted context for Claude
 */

import path from 'path';
import fs from 'fs/promises';
import type {
  ContextResult,
  DomainInfo,
  KnowledgeResult,
  SessionStartOutput,
  MeggFile,
  StateResult,
} from '../types.js';
import { exists, readFile } from '../utils/files.js';
import {
  findAncestorMegg,
  findSiblingMegg,
  findChildMegg,
  getDomainName,
  KNOWLEDGE_FILE_NAME,
  INFO_FILE_NAME,
  STATE_FILE_NAME,
} from '../utils/paths.js';
import { estimateTokens } from '../utils/tokens.js';
import { parseKnowledge, generateSummary, filterByTopic, entriesToMarkdown } from '../utils/knowledge.js';
import { readState } from './state.js';

// Thresholds
const FULL_LOAD_THRESHOLD = 8000;    // Load full if under this
const SUMMARY_THRESHOLD = 16000;      // Show summary if under this
// Above SUMMARY_THRESHOLD = blocked

const STALE_INFO_DAYS = 30;  // Warn if info.md not updated in this many days

/**
 * Parse `updated` timestamp from info.md frontmatter.
 * Returns null if not found or unparseable.
 */
function parseUpdatedDate(infoContent: string): Date | null {
  const match = infoContent.match(/^updated:\s*(.+)$/m);
  if (!match) return null;
  const d = new Date(match[1].trim());
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns stale warning string if info.md is older than STALE_INFO_DAYS, else null.
 */
function getStaleWarning(infoContent: string, domain: string): string | undefined {
  const updated = parseUpdatedDate(infoContent);
  if (!updated) return undefined;
  const daysSince = Math.floor((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince < STALE_INFO_DAYS) return undefined;
  return `⚠️  ${domain}/info.md last updated ${daysSince} days ago — still current? Run: megg init --update`;
}

/**
 * Main context command - gathers all relevant context for a path.
 */
export async function context(targetPath?: string, topic?: string): Promise<ContextResult> {
  const cwd = targetPath || process.cwd();

  // 1. Find ancestor .megg directories (walk up)
  const ancestorMegg = await findAncestorMegg(cwd);

  // 2. Load info chain
  const chain: DomainInfo[] = [];
  for (const meggPath of ancestorMegg) {
    const infoPath = path.join(meggPath, INFO_FILE_NAME);
    try {
      const info = await readFile(infoPath);
      const domain = getDomainName(meggPath);
      chain.push({
        domain,
        path: path.dirname(meggPath),
        meggPath,
        info,
        staleWarning: getStaleWarning(info, domain),
      });
    } catch {
      // Skip if can't read
    }
  }

  // 3. Load knowledge (from deepest/target .megg)
  let knowledge: KnowledgeResult | null = null;
  const targetMegg = ancestorMegg[ancestorMegg.length - 1];

  if (targetMegg) {
    const knowledgePath = path.join(targetMegg, KNOWLEDGE_FILE_NAME);

    if (await exists(knowledgePath)) {
      try {
        const content = await readFile(knowledgePath);
        const tokens = estimateTokens(content);
        const parsed = parseKnowledge(content);

        // If topic filter requested, filter entries
        if (topic) {
          const filtered = filterByTopic(parsed, topic);
          const filteredContent = entriesToMarkdown(filtered);
          const filteredTokens = estimateTokens(filteredContent);

          knowledge = {
            content: filtered.length > 0
              ? filteredContent
              : `No entries found for topic: "${topic}"`,
            mode: 'full',
            tokens: filteredTokens,
            entries: filtered.length,
            topics: parsed.topics,
          };
        } else if (tokens <= FULL_LOAD_THRESHOLD) {
          // FULL MODE
          knowledge = {
            content,
            mode: 'full',
            tokens,
            entries: parsed.entries.length,
            topics: parsed.topics,
          };
        } else if (tokens <= SUMMARY_THRESHOLD) {
          // SUMMARY MODE
          knowledge = {
            content: generateSummary(parsed),
            mode: 'summary',
            tokens,
            entries: parsed.entries.length,
            topics: parsed.topics,
            warning: `Knowledge is ${tokens} tokens. Showing summary. Use context(path, "topic") for specific topics.`,
          };
        } else {
          // BLOCKED - too big
          knowledge = {
            content: `⚠️ Knowledge is bloated (${tokens} tokens, ${parsed.entries.length} entries).\n\nRun \`maintain()\` to consolidate before continuing.\n\nTopics available: ${parsed.topics.join(', ')}`,
            mode: 'blocked',
            tokens,
            entries: parsed.entries.length,
            topics: parsed.topics,
            warning: 'Knowledge exceeds 16k tokens. Maintenance required.',
          };
        }
      } catch (err) {
        // Failed to read knowledge
      }
    }
  }

  // 4. Load state (from deepest/target .megg, if not expired)
  let state: StateResult | null = null;
  if (targetMegg) {
    const stateResult = await readState(path.dirname(targetMegg));
    if (stateResult && !stateResult.expired) {
      state = stateResult;
    }
  }

  // 5. Discover siblings and children
  const siblings = await findSiblingMegg(cwd);
  const children = await findChildMegg(cwd);

  // 6. Discover all files in current .megg directory
  const files: MeggFile[] = [];
  if (targetMegg) {
    try {
      const entries = await fs.readdir(targetMegg, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const filePath = path.join(targetMegg, entry.name);
          const isLoaded = entry.name === INFO_FILE_NAME ||
            (entry.name === KNOWLEDGE_FILE_NAME && knowledge !== null) ||
            (entry.name === STATE_FILE_NAME && state !== null);
          files.push({
            name: entry.name,
            path: filePath,
            loaded: isLoaded,
          });
        }
      }
    } catch {
      // Skip if can't read directory
    }
  }

  return {
    chain,
    knowledge,
    state,
    siblings,
    children,
    files,
  };
}

/**
 * Formats context result for human-readable output.
 */
export function formatContextForDisplay(result: ContextResult): string {
  let out = '';

  // Chain summary
  if (result.chain.length > 0) {
    out += '## Domain Chain\n\n';
    for (const item of result.chain) {
      const firstLine = item.info.split('\n').find(l => l.startsWith('#'))?.replace(/^#+\s*/, '') || item.domain;
      out += `- **${item.domain}**: ${firstLine}\n`;
    }
    out += '\n';
  }

  // Stale warnings (any level in chain)
  const staleWarnings = result.chain.filter(c => c.staleWarning).map(c => c.staleWarning!);
  if (staleWarnings.length > 0) {
    out += staleWarnings.join('\n') + '\n\n';
  }

  // Current context (deepest level info.md)
  const deepest = result.chain[result.chain.length - 1];
  if (deepest) {
    out += `## Current Context: ${deepest.domain}\n\n`;
    out += deepest.info + '\n\n';
  }

  // Knowledge
  if (result.knowledge) {
    out += `## Knowledge (${result.knowledge.mode})\n\n`;
    if (result.knowledge.warning) {
      out += `> ⚠️ ${result.knowledge.warning}\n\n`;
    }
    out += result.knowledge.content + '\n\n';
  }

  // State (session handoff)
  if (result.state) {
    out += `## Session State\n\n`;
    out += `*Last updated: ${result.state.updated}*\n\n`;
    out += result.state.content + '\n\n';
  }

  // Files in .megg
  if (result.files.length > 0) {
    const notLoaded = result.files.filter(f => !f.loaded);
    if (notLoaded.length > 0) {
      out += `## Available Files (not loaded)\n\n`;
      out += notLoaded.map(f => `- ${f.name}`).join('\n') + '\n\n';
    }
  }

  // Navigation
  if (result.siblings.length > 0) {
    out += `## Other Domains\n\n`;
    out += result.siblings.map(s => `- ${s}`).join('\n') + '\n\n';
  }

  if (result.children.length > 0) {
    out += `## Subdomains\n\n`;
    out += result.children.map(c => `- ${c}`).join('\n') + '\n\n';
  }

  return out.trim();
}

/**
 * Formats context for Claude Code SessionStart hook.
 * Returns JSON that can be output to stdout.
 */
export function formatForSessionStartHook(result: ContextResult): SessionStartOutput {
  const contextText = formatContextForDisplay(result);

  // Build a status message showing actual files loaded
  const loadedFiles: string[] = [];

  for (const c of result.chain) {
    loadedFiles.push(path.join(c.meggPath, 'info.md'));
  }

  if (result.knowledge && result.chain.length > 0) {
    const knowledgePath = path.join(
      result.chain[result.chain.length - 1].meggPath,
      'knowledge.md'
    );
    loadedFiles.push(`${knowledgePath} (${result.knowledge.mode}, ${result.knowledge.tokens} tokens)`);
  }

  if (result.state && result.chain.length > 0) {
    loadedFiles.push(`${result.state.path} (state, ${result.state.tokens} tokens)`);
  }

  // Find files that are available but not loaded
  const availableFiles = result.files.filter(f => !f.loaded);

  let statusMessage: string;
  if (loadedFiles.length === 0) {
    statusMessage = 'MEGG: no .megg found';
  } else {
    statusMessage = 'MEGG loaded:\n' + loadedFiles.map(f => `  ${f}`).join('\n');
    if (availableFiles.length > 0) {
      statusMessage += '\nAvailable (not loaded):\n' + availableFiles.map(f => `  ${f.path}`).join('\n');
    }
    statusMessage += '\n\nGood teams remember what works. Agent asks before saving. If worth remembering, just do it manually. Learning patterns evolve over time.';
  }

  return {
    systemMessage: statusMessage,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: contextText,
    },
  };
}

/**
 * CLI-friendly context command that returns JSON or formatted text.
 */
export async function contextCommand(
  targetPath?: string,
  options?: { topic?: string; json?: boolean }
): Promise<string> {
  const result = await context(targetPath, options?.topic);

  if (options?.json) {
    // For hook integration - return JSON for SessionStart
    return JSON.stringify(formatForSessionStartHook(result), null, 2);
  }

  return formatContextForDisplay(result);
}
