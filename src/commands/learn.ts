/**
 * learn() - Add knowledge entries
 *
 * Appends new entries to knowledge.md in the nearest .megg directory.
 * Entries have a structured format with type, topics, and content.
 */

import path from 'path';
import type { LearnInput, LearnResult, EntryType } from '../types.js';
import { exists, readFile, writeFile, getTimestamp } from '../utils/files.js';
import { findNearestMegg, KNOWLEDGE_FILE_NAME } from '../utils/paths.js';
import { touchFrontmatter } from '../utils/format.js';
import { estimateTokens } from '../utils/tokens.js';

// Warning threshold
const WARNING_THRESHOLD = 12000;

/**
 * Main learn command - adds a knowledge entry.
 */
export async function learn(input: LearnInput): Promise<LearnResult> {
  const { title, type, topics, content, path: targetPath } = input;

  // 1. Find nearest .megg directory
  const searchPath = targetPath || process.cwd();
  const meggDir = await findNearestMegg(searchPath);

  if (!meggDir) {
    return {
      success: false,
      error: `No .megg directory found. Run 'megg init' first.`,
    };
  }

  const knowledgePath = path.join(meggDir, KNOWLEDGE_FILE_NAME);

  // 2. Create knowledge.md if it doesn't exist
  if (!await exists(knowledgePath)) {
    const now = getTimestamp();
    const initialContent = `---
created: ${now}
updated: ${now}
type: knowledge
---

# Knowledge

`;
    await writeFile(knowledgePath, initialContent);
  }

  // 3. Format the new entry
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const formattedEntry = formatLearnEntry(date, title, type, topics, content);

  // 4. Append to file
  let existingContent = await readFile(knowledgePath);
  existingContent = touchFrontmatter(existingContent);
  const newContent = existingContent + formattedEntry;
  await writeFile(knowledgePath, newContent);

  // 5. Check size and warn if approaching limit
  const tokens = estimateTokens(newContent);
  let warning: string | undefined;

  if (tokens > WARNING_THRESHOLD) {
    warning = `Knowledge is ${tokens} tokens. Consider running maintain() soon.`;
  }

  return {
    success: true,
    path: knowledgePath,
    warning,
  };
}

/**
 * Formats a knowledge entry for appending.
 */
function formatLearnEntry(
  date: string,
  title: string,
  type: EntryType,
  topics: string[],
  content: string
): string {
  const topicsStr = topics.map(t => t.toLowerCase().trim()).join(', ');

  return `
---

## ${date} - ${title}
**Type:** ${type}
**Topics:** ${topicsStr}

${content.trim()}
`;
}

/**
 * Interactive learn - prompts for entry details.
 * Used by CLI when called without full arguments.
 */
export interface LearnPromptResult {
  title: string;
  type: EntryType;
  topics: string[];
  content: string;
}

/**
 * Validates entry type.
 */
export function isValidEntryType(type: string): type is EntryType {
  return ['decision', 'pattern', 'gotcha', 'context'].includes(type);
}

/**
 * CLI-friendly learn command.
 */
export async function learnCommand(
  title: string,
  type: string,
  topics: string,
  content: string,
  targetPath?: string
): Promise<string> {
  // Validate type
  if (!isValidEntryType(type)) {
    return `Error: Invalid type "${type}". Must be one of: decision, pattern, gotcha, context`;
  }

  // Parse topics
  const topicsList = topics.split(',').map(t => t.trim()).filter(Boolean);

  if (topicsList.length === 0) {
    return 'Error: At least one topic is required.';
  }

  const result = await learn({
    title,
    type,
    topics: topicsList,
    content,
    path: targetPath,
  });

  if (!result.success) {
    return `Error: ${result.error}`;
  }

  let output = `✓ Added entry "${title}" to ${result.path}`;
  if (result.warning) {
    output += `\n\n⚠️ ${result.warning}`;
  }

  return output;
}

/**
 * Quick learn - for simple entries without all metadata.
 */
export async function quickLearn(
  content: string,
  type: EntryType = 'context',
  targetPath?: string
): Promise<LearnResult> {
  // Extract title from first line or first sentence
  const firstLine = content.split('\n')[0].trim();
  const title = firstLine.length > 60
    ? firstLine.substring(0, 57) + '...'
    : firstLine;

  // Extract topics from content (words that look like tags)
  const topicMatches = content.match(/#(\w+)/g) || [];
  const topics = topicMatches.map(t => t.replace('#', '').toLowerCase());

  // If no hashtags found, use type as topic
  if (topics.length === 0) {
    topics.push(type);
  }

  return learn({
    title,
    type,
    topics,
    content,
    path: targetPath,
  });
}
