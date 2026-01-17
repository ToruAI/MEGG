import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import {
  parseState,
  isStateExpired,
  createStateContent,
  truncateToLimit,
  state,
  readState,
  writeState,
  clearState,
} from '../../src/commands/state.js';
import { context } from '../../src/commands/context.js';
import { MEGG_DIR_NAME } from '../../src/utils/paths.js';

const TEST_ROOT = path.resolve(process.cwd(), 'tests', 'temp-state');

describe('State Command', () => {
  beforeEach(async () => {
    await fs.mkdir(path.join(TEST_ROOT, MEGG_DIR_NAME), { recursive: true });
    // Create info.md so findNearestMegg works
    await fs.writeFile(
      path.join(TEST_ROOT, MEGG_DIR_NAME, 'info.md'),
      '# Test\n'
    );
  });

  afterEach(async () => {
    await fs.rm(TEST_ROOT, { recursive: true, force: true });
  });

  describe('parseState', () => {
    it('should parse valid state with frontmatter', () => {
      const content = `---
updated: 2026-01-17T10:30:00Z
status: active
---

## Working On
Test task

## Progress
- Done something`;

      const result = parseState(content);

      expect(result).not.toBeNull();
      expect(result!.status).toBe('active');
      expect(result!.updated).toBe('2026-01-17T10:30:00Z');
      expect(result!.body).toContain('## Working On');
    });

    it('should return null for content without frontmatter', () => {
      const content = '## Working On\nTest task';
      const result = parseState(content);
      expect(result).toBeNull();
    });

    it('should return null for malformed frontmatter', () => {
      const content = '---\nno closing';
      const result = parseState(content);
      expect(result).toBeNull();
    });

    it('should parse done status', () => {
      const content = `---
updated: 2026-01-17T10:30:00Z
status: done
---

Content`;

      const result = parseState(content);
      expect(result!.status).toBe('done');
    });
  });

  describe('isStateExpired', () => {
    it('should return true for done status', () => {
      const result = isStateExpired('2026-01-17T10:30:00Z', 'done');
      expect(result).toBe(true);
    });

    it('should return true for empty updated timestamp', () => {
      const result = isStateExpired('', 'active');
      expect(result).toBe(true);
    });

    it('should return true for stale state (>48h)', () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 49); // 49 hours ago
      const result = isStateExpired(oldDate.toISOString(), 'active');
      expect(result).toBe(true);
    });

    it('should return false for fresh active state', () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago
      const result = isStateExpired(recentDate.toISOString(), 'active');
      expect(result).toBe(false);
    });
  });

  describe('truncateToLimit', () => {
    it('should not truncate content under limit', () => {
      const content = 'Short content';
      const result = truncateToLimit(content, 2000);
      expect(result.content).toBe(content);
      expect(result.truncated).toBe(false);
    });

    it('should truncate content over limit', () => {
      // Create content that exceeds 2000 tokens (~8000 chars)
      const longContent = 'x'.repeat(10000);
      const result = truncateToLimit(longContent, 2000);
      expect(result.content.length).toBeLessThan(10000);
      expect(result.truncated).toBe(true);
    });

    it('should try to truncate at natural boundary', () => {
      const content = 'Line 1\nLine 2\nLine 3\n' + 'x'.repeat(9000);
      const result = truncateToLimit(content, 2000);
      // Should end at a newline or space if possible
      expect(result.truncated).toBe(true);
    });
  });

  describe('createStateContent', () => {
    it('should create content with frontmatter', () => {
      const body = '## Working On\nTest';
      const result = createStateContent(body);

      expect(result).toContain('---');
      expect(result).toContain('updated:');
      expect(result).toContain('status: active');
      expect(result).toContain('## Working On');
    });

    it('should respect status parameter', () => {
      const result = createStateContent('Content', 'done');
      expect(result).toContain('status: done');
    });
  });

  describe('state() integration', () => {
    it('should return empty state when no state file exists', async () => {
      const result = await state({ path: TEST_ROOT });
      expect(result.success).toBe(true);
      expect(result.state).toBeUndefined();
    });

    it('should write and read state', async () => {
      const content = '## Working On\nTest task';

      // Write state
      const writeResult = await writeState(content, TEST_ROOT);
      expect(writeResult.success).toBe(true);
      expect(writeResult.state).toBeDefined();

      // Read state
      const readResult = await readState(TEST_ROOT);
      expect(readResult).not.toBeNull();
      expect(readResult!.content).toContain('## Working On');
      expect(readResult!.status).toBe('active');
    });

    it('should clear state', async () => {
      // Write state first
      await writeState('## Working On\nTest', TEST_ROOT);

      // Clear it
      const clearResult = await clearState(TEST_ROOT);
      expect(clearResult.success).toBe(true);

      // Verify it's gone
      const readResult = await readState(TEST_ROOT);
      expect(readResult).toBeNull();
    });

    it('should truncate content over token limit with warning', async () => {
      const longContent = '## Working On\n' + 'x'.repeat(10000);
      const result = await writeState(longContent, TEST_ROOT);

      expect(result.success).toBe(true);
      expect(result.warning).toContain('truncated');
      expect(result.state!.tokens).toBeLessThanOrEqual(2000);
    });

    it('should not return expired state', async () => {
      // Manually write an expired state file
      const expiredContent = `---
updated: 2020-01-01T00:00:00Z
status: active
---

Old state`;

      await fs.writeFile(
        path.join(TEST_ROOT, MEGG_DIR_NAME, 'state.md'),
        expiredContent
      );

      const result = await state({ path: TEST_ROOT });
      expect(result.success).toBe(true);
      expect(result.state).toBeUndefined();
      expect(result.warning).toContain('expired');
    });
  });

  describe('context() integration', () => {
    it('should include active state in context result', async () => {
      // Write state
      await writeState('## Working On\nTest task', TEST_ROOT);

      // Load context
      const result = await context(TEST_ROOT);

      expect(result.state).not.toBeNull();
      expect(result.state!.content).toContain('## Working On');
      expect(result.state!.status).toBe('active');
    });

    it('should not include expired state in context result', async () => {
      // Write expired state
      const expiredContent = `---
updated: 2020-01-01T00:00:00Z
status: active
---

Old state`;

      await fs.writeFile(
        path.join(TEST_ROOT, MEGG_DIR_NAME, 'state.md'),
        expiredContent
      );

      // Load context
      const result = await context(TEST_ROOT);

      expect(result.state).toBeNull();
    });

    it('should mark state.md as loaded in files list', async () => {
      // Write state
      await writeState('## Working On\nTest', TEST_ROOT);

      // Load context
      const result = await context(TEST_ROOT);

      const stateFile = result.files.find(f => f.name === 'state.md');
      expect(stateFile).toBeDefined();
      expect(stateFile!.loaded).toBe(true);
    });
  });
});
