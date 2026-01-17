/**
 * maintain() - Cleanup and consolidate knowledge
 *
 * Analyzes knowledge files for:
 * - Bloat (too many tokens)
 * - Staleness (old entries)
 * - Duplicates (similar topics)
 *
 * Returns a report with suggested actions.
 */

import path from 'path';
import type {
  MaintenanceReport,
  MaintenanceIssue,
  MaintenanceAction,
} from '../types.js';
import { exists, readFile } from '../utils/files.js';
import { findAllMegg, getDomainName, KNOWLEDGE_FILE_NAME } from '../utils/paths.js';
import { estimateTokens, formatTokenCount } from '../utils/tokens.js';
import {
  parseKnowledge,
  findDuplicateTopics,
  findStaleEntries,
} from '../utils/knowledge.js';
import { DEFAULT_CONFIG } from '../types.js';

/**
 * Main maintain command - analyzes all .megg directories.
 */
export async function maintain(targetPath?: string): Promise<MaintenanceReport> {
  const root = targetPath || process.cwd();

  // Find all .megg directories
  const allMegg = await findAllMegg(root);

  const issues: MaintenanceIssue[] = [];
  const actions: MaintenanceAction[] = [];
  let totalTokens = 0;
  let totalEntries = 0;

  for (const meggDir of allMegg) {
    const knowledgePath = path.join(meggDir, KNOWLEDGE_FILE_NAME);

    if (!await exists(knowledgePath)) continue;

    try {
      const content = await readFile(knowledgePath);
      const tokens = estimateTokens(content);
      const parsed = parseKnowledge(content);

      totalTokens += tokens;
      totalEntries += parsed.entries.length;

      const domain = getDomainName(meggDir);

      // Check for bloat
      if (tokens > DEFAULT_CONFIG.summaryThreshold!) {
        issues.push({
          path: meggDir,
          problem: 'bloated',
          details: `${formatTokenCount(tokens)} tokens, ${parsed.entries.length} entries`,
          suggestedAction: 'Consolidate similar entries or archive old ones',
        });

        // Find consolidation candidates
        const duplicateTopics = findDuplicateTopics(parsed.entries);
        if (duplicateTopics.length > 0) {
          const topGroups = duplicateTopics.slice(0, 3);
          for (const group of topGroups) {
            actions.push({
              type: 'consolidate',
              target: knowledgePath,
              preview: `Merge ${group.entries.length} entries about "${group.topic}"`,
              entries: group.entries.map(e => e.title),
            });
          }
        }

        // Suggest summarization if very large
        if (tokens > DEFAULT_CONFIG.blockThreshold!) {
          actions.push({
            type: 'summarize',
            target: knowledgePath,
            preview: `Summarize from ${formatTokenCount(tokens)} to ~${formatTokenCount(DEFAULT_CONFIG.maxKnowledgeTokens!)} tokens`,
          });
        }
      }

      // Check for stale entries
      const staleEntries = findStaleEntries(parsed.entries, DEFAULT_CONFIG.stalenessDays);
      if (staleEntries.length > 0) {
        issues.push({
          path: meggDir,
          problem: 'stale',
          details: `${staleEntries.length} entries older than ${DEFAULT_CONFIG.stalenessDays} days`,
          suggestedAction: 'Review and archive if no longer relevant',
        });

        actions.push({
          type: 'archive',
          target: knowledgePath,
          preview: `Archive ${staleEntries.length} old entries`,
          entries: staleEntries.map(e => `${e.date} - ${e.title}`),
        });
      }

      // Check for duplicate topics (even if not bloated)
      const duplicates = findDuplicateTopics(parsed.entries);
      if (duplicates.length > 0 && !issues.some(i => i.path === meggDir && i.problem === 'bloated')) {
        const totalDuplicateEntries = duplicates.reduce((sum, d) => sum + d.entries.length, 0);
        if (totalDuplicateEntries > 5) {
          issues.push({
            path: meggDir,
            problem: 'duplicates',
            details: `${duplicates.length} topics with 3+ entries each`,
            suggestedAction: 'Consider consolidating related entries',
          });
        }
      }
    } catch (err) {
      // Skip files we can't read
    }
  }

  return {
    scanned: allMegg.length,
    totalTokens,
    totalEntries,
    issues,
    actions,
  };
}

/**
 * Formats maintenance report for display.
 */
export function formatMaintenanceReport(report: MaintenanceReport): string {
  let output = '# Maintenance Report\n\n';

  // Overview
  output += '## Overview\n\n';
  output += `- **Scanned:** ${report.scanned} .megg directories\n`;
  output += `- **Total tokens:** ${formatTokenCount(report.totalTokens)}\n`;
  output += `- **Total entries:** ${report.totalEntries}\n\n`;

  // Health status
  if (report.issues.length === 0) {
    output += '✅ **All knowledge files are healthy!**\n\n';
    return output;
  }

  // Issues
  output += '## Issues Found\n\n';

  for (const issue of report.issues) {
    const emoji = issue.problem === 'bloated' ? '🔴' :
                  issue.problem === 'stale' ? '🟡' : '🟠';
    output += `### ${emoji} ${getDomainName(issue.path)}\n\n`;
    output += `**Problem:** ${issue.problem}\n`;
    output += `**Details:** ${issue.details}\n`;
    output += `**Suggested:** ${issue.suggestedAction}\n\n`;
  }

  // Actions
  if (report.actions.length > 0) {
    output += '## Suggested Actions\n\n';

    for (let i = 0; i < report.actions.length; i++) {
      const action = report.actions[i];
      const domain = getDomainName(path.dirname(action.target));

      output += `${i + 1}. **${action.type}** in ${domain}\n`;
      output += `   ${action.preview}\n`;

      if (action.entries && action.entries.length > 0) {
        const shown = action.entries.slice(0, 3);
        for (const entry of shown) {
          output += `   - ${entry}\n`;
        }
        if (action.entries.length > 3) {
          output += `   - ... and ${action.entries.length - 3} more\n`;
        }
      }
      output += '\n';
    }
  }

  output += '---\n\n';
  output += '*Review issues and apply changes manually or with agent assistance.*';

  return output;
}

/**
 * CLI-friendly maintain command.
 */
export async function maintainCommand(targetPath?: string): Promise<string> {
  const report = await maintain(targetPath);
  return formatMaintenanceReport(report);
}
