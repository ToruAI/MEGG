/**
 * state() - Ephemeral session state for cross-session handoff
 *
 * Unlike knowledge (permanent wisdom), state is:
 * - Overwritten each session
 * - Auto-expires (48h or when status=done)
 * - Hard token limit (2k)
 *
 * Usage:
 * - state() - read current state
 * - state({ content }) - write/overwrite state
 * - state({ status: 'done' }) - clear state
 */

import path from 'path';
import fs from 'fs/promises';
import type { StateResult, StateInput, StateCommandResult, StateStatus } from '../types.js';
import { exists, readFile, writeFile, getTimestamp } from '../utils/files.js';
import { findNearestMegg, STATE_FILE_NAME } from '../utils/paths.js';
import { estimateTokens } from '../utils/tokens.js';

// Constants
const STATE_TOKEN_LIMIT = 2000;
const STALENESS_HOURS = 48;

/**
 * Parses state.md frontmatter and content.
 */
export function parseState(content: string): { status: StateStatus; updated: string; body: string } | null {
  if (!content.startsWith('---\n')) {
    return null;
  }

  const endIndex = content.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return null;
  }

  const frontmatter = content.slice(4, endIndex);
  const body = content.slice(endIndex + 5).trim();

  // Parse frontmatter fields
  let status: StateStatus = 'active';
  let updated = '';

  for (const line of frontmatter.split('\n')) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();

    if (key === 'status' && (value === 'active' || value === 'done')) {
      status = value;
    } else if (key === 'updated') {
      updated = value;
    }
  }

  return { status, updated, body };
}

/**
 * Checks if state is expired (>48h old or status=done).
 */
export function isStateExpired(updated: string, status: StateStatus): boolean {
  if (status === 'done') {
    return true;
  }

  if (!updated) {
    return true;
  }

  const updatedDate = new Date(updated);
  const now = new Date();
  const hoursDiff = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60);

  return hoursDiff > STALENESS_HOURS;
}

/**
 * Creates state.md content with frontmatter.
 */
export function createStateContent(body: string, status: StateStatus = 'active'): string {
  const now = getTimestamp();
  return [
    '---',
    `updated: ${now}`,
    `status: ${status}`,
    '---',
    '',
    body,
  ].join('\n');
}

/**
 * Truncates content to fit within token limit.
 * Returns { content, truncated }.
 */
export function truncateToLimit(content: string, limit: number): { content: string; truncated: boolean } {
  const tokens = estimateTokens(content);
  if (tokens <= limit) {
    return { content, truncated: false };
  }

  // Approximate character limit (4 chars per token)
  const charLimit = limit * 4;
  const truncated = content.slice(0, charLimit);

  // Try to truncate at a natural boundary (newline or space)
  const lastNewline = truncated.lastIndexOf('\n');
  const lastSpace = truncated.lastIndexOf(' ');
  const breakPoint = Math.max(lastNewline, lastSpace);

  const finalContent = breakPoint > charLimit * 0.8
    ? truncated.slice(0, breakPoint)
    : truncated;

  return { content: finalContent, truncated: true };
}

/**
 * Reads current state from nearest .megg.
 */
export async function readState(targetPath?: string): Promise<StateResult | null> {
  const cwd = targetPath || process.cwd();
  const meggPath = await findNearestMegg(cwd);

  if (!meggPath) {
    return null;
  }

  const statePath = path.join(meggPath, STATE_FILE_NAME);

  if (!(await exists(statePath))) {
    return null;
  }

  const content = await readFile(statePath);
  const parsed = parseState(content);

  if (!parsed) {
    return null;
  }

  const tokens = estimateTokens(parsed.body);
  const expired = isStateExpired(parsed.updated, parsed.status);

  return {
    content: parsed.body,
    status: parsed.status,
    updated: parsed.updated,
    tokens,
    expired,
    path: statePath,
  };
}

/**
 * Writes state to nearest .megg.
 */
export async function writeState(
  content: string,
  targetPath?: string
): Promise<StateCommandResult> {
  const cwd = targetPath || process.cwd();
  const meggPath = await findNearestMegg(cwd);

  if (!meggPath) {
    return {
      success: false,
      error: 'No .megg directory found. Run init() first.',
    };
  }

  // Truncate if needed
  const { content: finalContent, truncated } = truncateToLimit(content, STATE_TOKEN_LIMIT);

  const stateContent = createStateContent(finalContent);
  const statePath = path.join(meggPath, STATE_FILE_NAME);

  await writeFile(statePath, stateContent);

  const tokens = estimateTokens(finalContent);

  return {
    success: true,
    state: {
      content: finalContent,
      status: 'active',
      updated: getTimestamp(),
      tokens,
      expired: false,
      path: statePath,
    },
    warning: truncated
      ? `Content truncated to fit ${STATE_TOKEN_LIMIT} token limit.`
      : undefined,
  };
}

/**
 * Clears state by marking as done.
 */
export async function clearState(targetPath?: string): Promise<StateCommandResult> {
  const cwd = targetPath || process.cwd();
  const meggPath = await findNearestMegg(cwd);

  if (!meggPath) {
    return {
      success: false,
      error: 'No .megg directory found.',
    };
  }

  const statePath = path.join(meggPath, STATE_FILE_NAME);

  if (!(await exists(statePath))) {
    return {
      success: true,
      warning: 'No state file to clear.',
    };
  }

  // Delete the file instead of marking as done
  await fs.unlink(statePath);

  return {
    success: true,
  };
}

/**
 * Main state command - read, write, or clear state.
 */
export async function state(input?: StateInput): Promise<StateCommandResult> {
  // No input = read current state
  if (!input || (!input.content && !input.status)) {
    const currentState = await readState(input?.path);

    if (!currentState) {
      return {
        success: true,
        state: undefined,
      };
    }

    // Don't return expired state
    if (currentState.expired) {
      return {
        success: true,
        state: undefined,
        warning: 'State expired (stale or marked done).',
      };
    }

    return {
      success: true,
      state: currentState,
    };
  }

  // Status = done means clear
  if (input.status === 'done') {
    return clearState(input.path);
  }

  // Content provided = write state
  if (input.content) {
    return writeState(input.content, input.path);
  }

  return {
    success: false,
    error: 'Invalid input. Provide content to write or status: "done" to clear.',
  };
}

/**
 * Formats state for display.
 */
export function formatStateForDisplay(result: StateResult | null): string {
  if (!result) {
    return 'No active state.';
  }

  if (result.expired) {
    return 'State expired (stale or marked done).';
  }

  return [
    `## Session State`,
    `*Updated: ${result.updated} (${result.tokens} tokens)*`,
    '',
    result.content,
  ].join('\n');
}
