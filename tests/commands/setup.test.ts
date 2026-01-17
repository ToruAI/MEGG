import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Test the setup module's helper functions
// Note: Full integration tests require mocking claude CLI

describe('setup', () => {
  describe('formatSetupResult', () => {
    it('should format successful result', async () => {
      const { formatSetupResult } = await import('../../src/commands/setup.js');

      const result = {
        success: true,
        tool: 'claude-code' as const,
        steps: [
          { name: 'MCP Server', status: 'success' as const, message: 'Registered megg MCP server' },
          { name: 'Skills', status: 'success' as const, message: 'Installed /megg-state skill' },
          { name: 'Hooks', status: 'success' as const, message: 'Configured SessionStart hook' },
        ],
        nextSteps: "Run 'megg init' in your project",
      };

      const output = formatSetupResult(result);

      expect(output).toContain('Claude Code');
      expect(output).toContain('✓ MCP Server');
      expect(output).toContain('✓ Skills');
      expect(output).toContain('✓ Hooks');
      expect(output).toContain('Done!');
      expect(output).toContain('megg init');
    });

    it('should format failed result', async () => {
      const { formatSetupResult } = await import('../../src/commands/setup.js');

      const result = {
        success: false,
        tool: 'claude-code' as const,
        steps: [
          { name: 'MCP Server', status: 'failed' as const, message: 'Claude CLI not found' },
        ],
      };

      const output = formatSetupResult(result);

      expect(output).toContain('✗ MCP Server');
      expect(output).toContain('Claude CLI not found');
      expect(output).toContain('Setup incomplete');
    });

    it('should format error result', async () => {
      const { formatSetupResult } = await import('../../src/commands/setup.js');

      const result = {
        success: false,
        steps: [],
        error: 'cursor support is coming soon',
      };

      const output = formatSetupResult(result);

      expect(output).toContain('Error:');
      expect(output).toContain('coming soon');
    });

    it('should show skipped steps', async () => {
      const { formatSetupResult } = await import('../../src/commands/setup.js');

      const result = {
        success: true,
        tool: 'claude-code' as const,
        steps: [
          { name: 'MCP Server', status: 'skipped' as const, message: 'Already registered' },
        ],
      };

      const output = formatSetupResult(result);

      expect(output).toContain('- MCP Server');
    });
  });

  describe('getToolChoices', () => {
    it('should return available tools', async () => {
      const { getToolChoices } = await import('../../src/commands/setup.js');

      const choices = getToolChoices();

      expect(choices).toHaveLength(4);
      expect(choices[0]).toEqual({ label: 'Claude Code', value: 'claude-code', available: true });
      expect(choices[1].available).toBe(false); // cursor coming soon
      expect(choices[2].available).toBe(false); // windsurf coming soon
      expect(choices[3]).toEqual({ label: 'Other MCP client', value: 'generic-mcp', available: true });
    });
  });

  describe('setup with unsupported tools', () => {
    it('should return error for cursor', async () => {
      const { setup } = await import('../../src/commands/setup.js');

      const result = await setup({ tool: 'cursor' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('coming soon');
    });

    it('should return error for windsurf', async () => {
      const { setup } = await import('../../src/commands/setup.js');

      const result = await setup({ tool: 'windsurf' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('coming soon');
    });
  });
});

describe('CLI integration', () => {
  it('should have correct bin configuration', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    expect(packageJson.bin.megg).toBe('./build/cli.js');
    expect(packageJson.bin['megg-mcp']).toBe('./build/index.js');
  });

  it('should have executable CLI file', async () => {
    const cliPath = path.join(process.cwd(), 'build', 'cli.js');
    const stats = await fs.stat(cliPath);

    // Check file exists
    expect(stats.isFile()).toBe(true);

    // Check has shebang
    const content = await fs.readFile(cliPath, 'utf-8');
    expect(content.startsWith('#!/usr/bin/env node') || content.includes('#!/usr/bin/env node')).toBe(true);
  });

  it('should have skill file in correct structure', async () => {
    const skillPath = path.join(process.cwd(), '.claude', 'skills', 'megg-state', 'SKILL.md');
    const stats = await fs.stat(skillPath);

    expect(stats.isFile()).toBe(true);

    const content = await fs.readFile(skillPath, 'utf-8');
    expect(content).toContain('name: megg-state');
    expect(content).toContain('user-invocable: true');
  });
});
