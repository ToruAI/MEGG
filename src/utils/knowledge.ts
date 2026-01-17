/**
 * Knowledge parsing and summarization utilities
 */

import type { KnowledgeEntry, ParsedKnowledge, EntryType } from '../types.js';
import { estimateTokens } from './tokens.js';

/**
 * Parses a knowledge.md file into structured entries.
 */
export function parseKnowledge(content: string): ParsedKnowledge {
  const entries: KnowledgeEntry[] = [];

  // Split by entry separator (---)
  const blocks = content.split(/\n---\n/).filter(b => b.trim());

  for (const block of blocks) {
    // Skip frontmatter block
    if (block.trim().startsWith('---') || block.includes('created:') && block.includes('type:')) {
      continue;
    }

    // Skip header block (# Knowledge)
    if (block.trim().startsWith('# Knowledge') && block.trim().split('\n').length <= 2) {
      continue;
    }

    const entry = parseEntry(block);
    if (entry) {
      entries.push(entry);
    }
  }

  // Extract unique topics
  const allTopics = entries.flatMap(e => e.topics);
  const topics = [...new Set(allTopics)].sort();

  // Find date range
  const dates = entries.map(e => e.date).filter(Boolean).sort();

  return {
    entries,
    tokens: estimateTokens(content),
    topics,
    oldestEntry: dates[0],
    newestEntry: dates[dates.length - 1],
  };
}

/**
 * Parses a single entry block.
 */
function parseEntry(block: string): KnowledgeEntry | null {
  const lines = block.trim().split('\n');
  if (lines.length < 2) return null;

  // Parse header: ## YYYY-MM-DD - Title or ## Title
  const headerMatch = lines[0].match(/^##\s+(?:(\d{4}-\d{2}-\d{2})\s*-?\s*)?(.+)$/);
  if (!headerMatch) return null;

  const date = headerMatch[1] || '';
  const title = headerMatch[2].trim();

  // Parse metadata lines
  let type: EntryType = 'context';
  let topics: string[] = [];
  let contentStart = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('**Type:**')) {
      const typeMatch = line.match(/\*\*Type:\*\*\s*(\w+)/);
      if (typeMatch) {
        type = typeMatch[1].toLowerCase() as EntryType;
      }
      contentStart = i + 1;
    } else if (line.startsWith('**Topics:**')) {
      const topicsMatch = line.match(/\*\*Topics:\*\*\s*(.+)/);
      if (topicsMatch) {
        topics = topicsMatch[1].split(',').map(t => t.trim().toLowerCase());
      }
      contentStart = i + 1;
    } else if (line.trim() && !line.startsWith('**')) {
      // First non-metadata line starts content
      contentStart = i;
      break;
    }
  }

  const content = lines.slice(contentStart).join('\n').trim();

  return {
    date,
    title,
    type,
    topics,
    content,
    raw: block,
  };
}

/**
 * Generates a summary of knowledge entries.
 */
export function generateSummary(parsed: ParsedKnowledge): string {
  const { entries, tokens, topics } = parsed;

  let summary = `# Knowledge Summary\n\n`;
  summary += `**Status:** ${tokens} tokens, ${entries.length} entries\n`;
  summary += `**Topics:** ${topics.join(', ')}\n\n`;

  // Group by type
  const byType = new Map<EntryType, KnowledgeEntry[]>();
  for (const entry of entries) {
    const list = byType.get(entry.type) || [];
    list.push(entry);
    byType.set(entry.type, list);
  }

  // Decisions (most important)
  const decisions = byType.get('decision') || [];
  if (decisions.length > 0) {
    summary += `## Key Decisions (${decisions.length})\n`;
    for (const d of decisions.slice(0, 10)) {
      summary += `- **${d.title}** (${d.date || 'no date'})\n`;
    }
    if (decisions.length > 10) {
      summary += `- ... and ${decisions.length - 10} more\n`;
    }
    summary += '\n';
  }

  // Patterns
  const patterns = byType.get('pattern') || [];
  if (patterns.length > 0) {
    summary += `## Patterns (${patterns.length})\n`;
    for (const p of patterns.slice(0, 5)) {
      summary += `- ${p.title}\n`;
    }
    if (patterns.length > 5) {
      summary += `- ... and ${patterns.length - 5} more\n`;
    }
    summary += '\n';
  }

  // Gotchas (important for avoiding issues)
  const gotchas = byType.get('gotcha') || [];
  if (gotchas.length > 0) {
    summary += `## Gotchas (${gotchas.length})\n`;
    for (const g of gotchas) {
      summary += `- ⚠️ ${g.title}\n`;
    }
    summary += '\n';
  }

  // Recent entries
  const recent = [...entries]
    .filter(e => e.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (recent.length > 0) {
    summary += `## Recent Activity\n`;
    for (const r of recent) {
      summary += `- [${r.date}] ${r.title} (${r.type})\n`;
    }
    summary += '\n';
  }

  summary += `\n*Use \`context(path, "topic")\` to load specific topic details.*`;

  return summary;
}

/**
 * Filters knowledge entries by topic.
 */
export function filterByTopic(parsed: ParsedKnowledge, topic: string): KnowledgeEntry[] {
  const normalizedTopic = topic.toLowerCase();
  return parsed.entries.filter(e =>
    e.topics.some(t => t.includes(normalizedTopic)) ||
    e.title.toLowerCase().includes(normalizedTopic) ||
    e.content.toLowerCase().includes(normalizedTopic)
  );
}

/**
 * Formats entries back to markdown.
 */
export function entriesToMarkdown(entries: KnowledgeEntry[]): string {
  return entries.map(e => e.raw).join('\n\n---\n\n');
}

/**
 * Finds duplicate/similar topics for consolidation.
 */
export function findDuplicateTopics(entries: KnowledgeEntry[]): Array<{ topic: string; entries: KnowledgeEntry[] }> {
  const byTopic = new Map<string, KnowledgeEntry[]>();

  for (const entry of entries) {
    for (const topic of entry.topics) {
      const list = byTopic.get(topic) || [];
      list.push(entry);
      byTopic.set(topic, list);
    }
  }

  // Find topics with 3+ entries (consolidation candidates)
  const duplicates: Array<{ topic: string; entries: KnowledgeEntry[] }> = [];
  for (const [topic, topicEntries] of byTopic) {
    if (topicEntries.length >= 3) {
      duplicates.push({ topic, entries: topicEntries });
    }
  }

  return duplicates.sort((a, b) => b.entries.length - a.entries.length);
}

/**
 * Finds stale entries (older than threshold).
 */
export function findStaleEntries(entries: KnowledgeEntry[], daysThreshold: number = 90): KnowledgeEntry[] {
  const threshold = Date.now() - (daysThreshold * 24 * 60 * 60 * 1000);

  return entries.filter(e => {
    if (!e.date) return false;
    const entryDate = new Date(e.date).getTime();
    return entryDate < threshold;
  });
}
