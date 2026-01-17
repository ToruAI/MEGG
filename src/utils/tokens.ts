/**
 * Token estimation utilities
 *
 * Uses a simple heuristic: ~4 characters per token (conservative estimate)
 * This is reasonably accurate for English text and code.
 */

const CHARS_PER_TOKEN = 4;

/**
 * Estimates the number of tokens in a string.
 * Uses character count / 4 as a simple heuristic.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Checks if content exceeds a token threshold.
 */
export function exceedsTokenLimit(text: string, limit: number): boolean {
  return estimateTokens(text) > limit;
}

/**
 * Formats token count for display.
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1)}k`;
}
