/**
 * setup() - First-time machine-level configuration for megg
 *
 * Configures megg for the user's AI tool:
 * - Claude Code: MCP server + skills + hooks
 * - Cursor/Windsurf: MCP server only (coming soon)
 * - Generic MCP: MCP server only
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import { exists, readFile, writeFile } from '../utils/files.js';

// Types
export type SupportedTool = 'claude-code' | 'cursor' | 'windsurf' | 'generic-mcp';

export interface SetupOptions {
  tool?: SupportedTool;
  yes?: boolean;
  link?: boolean;
  uninstall?: boolean;
}

export interface SetupResult {
  success: boolean;
  tool?: SupportedTool;
  steps: SetupStep[];
  error?: string;
  nextSteps?: string;
}

export interface SetupStep {
  name: string;
  status: 'success' | 'skipped' | 'failed';
  message?: string;
}

// Constants
const CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claude');
const CLAUDE_SKILLS_DIR = path.join(CLAUDE_CONFIG_DIR, 'skills');
const CLAUDE_HOOKS_FILE = path.join(CLAUDE_CONFIG_DIR, 'hooks.json');

// Get the package root directory (where skills and hooks templates are)
function getPackageRoot(): string {
  // When running from build/, go up one level
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  // Go up from build/commands to package root
  return path.resolve(currentDir, '..', '..');
}

/**
 * Main setup command
 */
export async function setup(options: SetupOptions = {}): Promise<SetupResult> {
  const steps: SetupStep[] = [];

  // Handle uninstall
  if (options.uninstall) {
    return uninstallMegg(options);
  }

  // Determine tool (interactive or from flag)
  let tool = options.tool;
  if (!tool) {
    // In non-interactive mode or if we can't prompt, default to claude-code
    tool = 'claude-code';
  }

  // Check if tool is supported
  if (tool === 'cursor' || tool === 'windsurf') {
    return {
      success: false,
      tool,
      steps,
      error: `${tool} support is coming soon. For now, use 'generic-mcp' for basic MCP server registration.`,
    };
  }

  // Setup based on tool
  if (tool === 'claude-code') {
    return setupClaudeCode(options, steps);
  } else if (tool === 'generic-mcp') {
    return setupGenericMcp(options, steps);
  }

  return {
    success: false,
    steps,
    error: `Unknown tool: ${tool}`,
  };
}

/**
 * Setup for Claude Code - MCP, skills, and hooks
 */
async function setupClaudeCode(options: SetupOptions, steps: SetupStep[]): Promise<SetupResult> {
  // 1. Register MCP server
  const mcpResult = await registerMcpServer();
  steps.push(mcpResult);

  // 2. Install skills
  const skillsResult = await installSkills(options.link);
  steps.push(skillsResult);

  // 3. Configure hooks
  const hooksResult = await configureHooks();
  steps.push(hooksResult);

  const allSuccess = steps.every(s => s.status === 'success' || s.status === 'skipped');

  return {
    success: allSuccess,
    tool: 'claude-code',
    steps,
    nextSteps: allSuccess
      ? "Run 'megg init' in your project to create .megg/"
      : undefined,
  };
}

/**
 * Setup for generic MCP client - MCP only
 */
async function setupGenericMcp(options: SetupOptions, steps: SetupStep[]): Promise<SetupResult> {
  const mcpResult = await registerMcpServer();
  steps.push(mcpResult);

  return {
    success: mcpResult.status === 'success',
    tool: 'generic-mcp',
    steps,
    nextSteps: mcpResult.status === 'success'
      ? "MCP server registered. Configure your MCP client to connect to 'megg'."
      : undefined,
  };
}

/**
 * Register megg as MCP server using claude CLI
 */
async function registerMcpServer(): Promise<SetupStep> {
  try {
    // Check if claude CLI is available
    const claudeCheck = spawnSync('which', ['claude'], { encoding: 'utf-8' });
    if (claudeCheck.status !== 0) {
      return {
        name: 'MCP Server',
        status: 'failed',
        message: 'Claude CLI not found. Install Claude Code first.',
      };
    }

    // Check if megg is already registered
    const listResult = spawnSync('claude', ['mcp', 'list'], { encoding: 'utf-8' });
    if (listResult.stdout && listResult.stdout.includes('megg')) {
      // Already registered, try to update
      spawnSync('claude', ['mcp', 'remove', 'megg'], { encoding: 'utf-8' });
    }

    // Register megg MCP server
    // Use npx megg to ensure we use the installed version
    const addResult = spawnSync(
      'claude',
      ['mcp', 'add', 'megg', '--', 'npx', '-y', 'megg@latest'],
      { encoding: 'utf-8' }
    );

    if (addResult.status !== 0) {
      return {
        name: 'MCP Server',
        status: 'failed',
        message: `Failed to register: ${addResult.stderr || addResult.stdout}`,
      };
    }

    return {
      name: 'MCP Server',
      status: 'success',
      message: 'Registered megg MCP server',
    };
  } catch (err: any) {
    return {
      name: 'MCP Server',
      status: 'failed',
      message: err.message,
    };
  }
}

/**
 * Install megg skills to ~/.claude/skills/
 * Skills use folder structure: ~/.claude/skills/megg-state/SKILL.md
 */
async function installSkills(useSymlink?: boolean): Promise<SetupStep> {
  try {
    // Ensure skills directory exists
    await fs.mkdir(CLAUDE_SKILLS_DIR, { recursive: true });

    const packageRoot = getPackageRoot();
    const sourceSkillDir = path.join(packageRoot, '.claude', 'skills', 'megg-state');
    const sourceSkillPath = path.join(sourceSkillDir, 'SKILL.md');
    const targetSkillDir = path.join(CLAUDE_SKILLS_DIR, 'megg-state');
    const targetSkillPath = path.join(targetSkillDir, 'SKILL.md');

    // Check if source skill exists
    if (!(await exists(sourceSkillPath))) {
      return {
        name: 'Skills',
        status: 'failed',
        message: `Skill file not found at ${sourceSkillPath}`,
      };
    }

    // Remove existing skill directory if present
    if (await exists(targetSkillDir)) {
      await fs.rm(targetSkillDir, { recursive: true });
    }

    if (useSymlink) {
      // Create symlink for the whole folder
      await fs.symlink(sourceSkillDir, targetSkillDir);
    } else {
      // Create folder and copy SKILL.md
      await fs.mkdir(targetSkillDir, { recursive: true });
      const content = await readFile(sourceSkillPath);
      await writeFile(targetSkillPath, content);
    }

    return {
      name: 'Skills',
      status: 'success',
      message: useSymlink
        ? `Linked /megg-state skill (${targetSkillDir})`
        : `Installed /megg-state skill (${targetSkillDir})`,
    };
  } catch (err: any) {
    return {
      name: 'Skills',
      status: 'failed',
      message: err.message,
    };
  }
}

/**
 * Configure SessionStart hook in ~/.claude/hooks.json
 */
async function configureHooks(): Promise<SetupStep> {
  try {
    // Ensure .claude directory exists
    await fs.mkdir(CLAUDE_CONFIG_DIR, { recursive: true });

    let existingHooks: any = {};

    // Read existing hooks if present
    if (await exists(CLAUDE_HOOKS_FILE)) {
      try {
        const content = await readFile(CLAUDE_HOOKS_FILE);
        existingHooks = JSON.parse(content);

        // Backup existing hooks
        const backupPath = `${CLAUDE_HOOKS_FILE}.backup`;
        await writeFile(backupPath, content);
      } catch {
        // Invalid JSON, start fresh
        existingHooks = {};
      }
    }

    // Megg's SessionStart hook
    const meggHook = {
      matcher: 'startup|resume',
      hooks: [
        {
          type: 'command',
          command: 'npx megg context --json 2>/dev/null || echo \'{}\'',
          timeout: 10,
        },
      ],
    };

    // Merge hooks
    if (!existingHooks.SessionStart) {
      existingHooks.SessionStart = [];
    }

    // Check if megg hook already exists (by command content)
    const meggHookIndex = existingHooks.SessionStart.findIndex((h: any) =>
      h.hooks?.some((hook: any) => hook.command?.includes('megg context'))
    );

    if (meggHookIndex >= 0) {
      // Update existing
      existingHooks.SessionStart[meggHookIndex] = meggHook;
    } else {
      // Add new
      existingHooks.SessionStart.push(meggHook);
    }

    // Write updated hooks
    await writeFile(CLAUDE_HOOKS_FILE, JSON.stringify(existingHooks, null, 2));

    return {
      name: 'Hooks',
      status: 'success',
      message: `Configured SessionStart hook (${CLAUDE_HOOKS_FILE})`,
    };
  } catch (err: any) {
    return {
      name: 'Hooks',
      status: 'failed',
      message: err.message,
    };
  }
}

/**
 * Uninstall megg configuration
 */
async function uninstallMegg(options: SetupOptions): Promise<SetupResult> {
  const steps: SetupStep[] = [];

  // 1. Remove MCP server registration
  try {
    const claudeCheck = spawnSync('which', ['claude'], { encoding: 'utf-8' });
    if (claudeCheck.status === 0) {
      spawnSync('claude', ['mcp', 'remove', 'megg'], { encoding: 'utf-8' });
      steps.push({
        name: 'MCP Server',
        status: 'success',
        message: 'Removed MCP server registration',
      });
    } else {
      steps.push({
        name: 'MCP Server',
        status: 'skipped',
        message: 'Claude CLI not found',
      });
    }
  } catch {
    steps.push({
      name: 'MCP Server',
      status: 'failed',
      message: 'Failed to remove MCP server',
    });
  }

  // 2. Remove skills (folder structure)
  try {
    const skillDir = path.join(CLAUDE_SKILLS_DIR, 'megg-state');
    if (await exists(skillDir)) {
      await fs.rm(skillDir, { recursive: true });
      steps.push({
        name: 'Skills',
        status: 'success',
        message: 'Removed /megg-state skill',
      });
    } else {
      steps.push({
        name: 'Skills',
        status: 'skipped',
        message: 'Skill not found',
      });
    }
  } catch (err: any) {
    steps.push({
      name: 'Skills',
      status: 'failed',
      message: err.message,
    });
  }

  // 3. Remove hooks (preserve other hooks)
  try {
    if (await exists(CLAUDE_HOOKS_FILE)) {
      const content = await readFile(CLAUDE_HOOKS_FILE);
      const hooks = JSON.parse(content);

      if (hooks.SessionStart) {
        // Filter out megg hooks
        hooks.SessionStart = hooks.SessionStart.filter((h: any) =>
          !h.hooks?.some((hook: any) => hook.command?.includes('megg context'))
        );

        // Remove empty array
        if (hooks.SessionStart.length === 0) {
          delete hooks.SessionStart;
        }

        // Write back
        if (Object.keys(hooks).length > 0) {
          await writeFile(CLAUDE_HOOKS_FILE, JSON.stringify(hooks, null, 2));
        } else {
          await fs.unlink(CLAUDE_HOOKS_FILE);
        }

        steps.push({
          name: 'Hooks',
          status: 'success',
          message: 'Removed SessionStart hook',
        });
      } else {
        steps.push({
          name: 'Hooks',
          status: 'skipped',
          message: 'No megg hooks found',
        });
      }
    } else {
      steps.push({
        name: 'Hooks',
        status: 'skipped',
        message: 'No hooks file found',
      });
    }
  } catch (err: any) {
    steps.push({
      name: 'Hooks',
      status: 'failed',
      message: err.message,
    });
  }

  return {
    success: steps.every(s => s.status !== 'failed'),
    steps,
  };
}

/**
 * Format setup result for display
 */
export function formatSetupResult(result: SetupResult): string {
  const lines: string[] = [];

  if (result.error) {
    lines.push(`Error: ${result.error}`);
    return lines.join('\n');
  }

  if (result.tool) {
    lines.push(`Setting up for ${formatToolName(result.tool)}...\n`);
  }

  for (const step of result.steps) {
    const icon = step.status === 'success' ? '✓' : step.status === 'skipped' ? '-' : '✗';
    lines.push(`  ${icon} ${step.name}${step.message ? `: ${step.message}` : ''}`);
  }

  if (result.success) {
    lines.push('\nDone!');
    if (result.nextSteps) {
      lines.push(`\nNext: ${result.nextSteps}`);
    }
  } else {
    lines.push('\nSetup incomplete. See errors above.');
  }

  return lines.join('\n');
}

function formatToolName(tool: SupportedTool): string {
  switch (tool) {
    case 'claude-code':
      return 'Claude Code';
    case 'cursor':
      return 'Cursor';
    case 'windsurf':
      return 'Windsurf';
    case 'generic-mcp':
      return 'Generic MCP Client';
    default:
      return tool;
  }
}

/**
 * Interactive tool selection (returns selection or null if cancelled)
 */
export function getToolChoices(): { label: string; value: SupportedTool | null; available: boolean }[] {
  return [
    { label: 'Claude Code', value: 'claude-code', available: true },
    { label: 'Cursor (coming soon)', value: 'cursor', available: false },
    { label: 'Windsurf (coming soon)', value: 'windsurf', available: false },
    { label: 'Other MCP client', value: 'generic-mcp', available: true },
  ];
}
