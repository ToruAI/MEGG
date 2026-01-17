#!/usr/bin/env node
/**
 * megg CLI
 *
 * Usage:
 *   npx megg setup [--tool <tool>] [--uninstall] [--link]
 *   npx megg context [path] [--topic <topic>] [--json]
 *   npx megg learn <title> <type> <topics> <content> [path]
 *   npx megg init [path]
 *   npx megg maintain [path]
 *   npx megg state [path] [--clear] [--show]
 *   npx megg --help
 */

import { contextCommand } from './commands/context.js';
import { learnCommand } from './commands/learn.js';
import { initCommand } from './commands/init.js';
import { maintainCommand } from './commands/maintain.js';
import { state, formatStateForDisplay } from './commands/state.js';
import { setup, formatSetupResult, getToolChoices, type SupportedTool } from './commands/setup.js';

const VERSION = '1.1.0';

const HELP = `
megg v${VERSION} - Memory for AI Agents

USAGE:
  megg <command> [options]

COMMANDS:
  setup                    First-time setup for your AI tool
    --tool <tool>          claude-code | generic-mcp (default: claude-code)
    --uninstall            Remove megg configuration
    --link                 Use symlinks (for development)

  context [path]           Load context chain and knowledge
    --topic <topic>        Filter knowledge by topic
    --json                 Output JSON for hook integration

  learn <title> <type> <topics> <content> [path]
                           Add a knowledge entry
    <type>                 decision | pattern | gotcha | context
    <topics>               Comma-separated tags

  init [path]              Initialize megg in directory
    --info <content>       Provide info.md content directly

  maintain [path]          Analyze and report on knowledge health

  state [path]             Manage session state
    --show                 Display current state (default)
    --clear                Clear/delete state
    <content>              Write new state content

  help                     Show this help message
  version                  Show version

EXAMPLES:
  # First-time setup (configures MCP, skills, hooks)
  megg setup

  # Load context for current directory
  megg context

  # Load context filtered by topic
  megg context . --topic auth

  # Add a decision entry
  megg learn "Use JWT for auth" decision "auth,security" "We chose JWT because..."

  # Initialize megg
  megg init

  # Check knowledge health
  megg maintain

  # Show current state
  megg state

  # Clear state (mark task done)
  megg state --clear

HOOK INTEGRATION:
  # For Claude Code SessionStart hook:
  megg context --json

  # Returns JSON with additionalContext for the hook system
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    console.log(HELP);
    process.exit(0);
  }

  if (args[0] === 'version' || args[0] === '--version' || args[0] === '-v') {
    console.log(`megg v${VERSION}`);
    process.exit(0);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'setup': {
        const toolIndex = args.indexOf('--tool');
        const tool = toolIndex !== -1 ? args[toolIndex + 1] as SupportedTool : undefined;
        const uninstall = args.includes('--uninstall');
        const link = args.includes('--link');
        const yes = args.includes('--yes') || args.includes('-y');

        // Show welcome message for interactive mode
        if (!tool && !uninstall) {
          console.log('\nWelcome to megg - Memory for AI Agents\n');
          console.log('Setting up for Claude Code (default)...\n');
        }

        const result = await setup({ tool: tool || 'claude-code', uninstall, link, yes });
        console.log(formatSetupResult(result));

        if (!result.success) {
          process.exit(1);
        }
        break;
      }

      case 'context': {
        const pathArg = args[1] && !args[1].startsWith('--') ? args[1] : undefined;
        const topicIndex = args.indexOf('--topic');
        const topic = topicIndex !== -1 ? args[topicIndex + 1] : undefined;
        const json = args.includes('--json');

        const output = await contextCommand(pathArg, { topic, json });
        console.log(output);
        break;
      }

      case 'learn': {
        if (args.length < 5) {
          console.error('Usage: megg learn <title> <type> <topics> <content> [path]');
          console.error('  <type>: decision | pattern | gotcha | context');
          console.error('  <topics>: comma-separated tags (e.g., "auth,api,security")');
          process.exit(1);
        }

        const [, title, type, topics, content, targetPath] = args;
        const output = await learnCommand(title, type, topics, content, targetPath);
        console.log(output);
        break;
      }

      case 'init': {
        const pathArg = args[1] && !args[1].startsWith('--') ? args[1] : undefined;
        const infoIndex = args.indexOf('--info');
        const info = infoIndex !== -1 ? args[infoIndex + 1] : undefined;

        const output = await initCommand(pathArg, info);
        console.log(output);
        break;
      }

      case 'maintain': {
        const pathArg = args[1];
        const output = await maintainCommand(pathArg);
        console.log(output);
        break;
      }

      case 'state': {
        const clearFlag = args.includes('--clear');
        const pathArg = args.find(a => !a.startsWith('--') && a !== 'state');

        if (clearFlag) {
          const result = await state({ status: 'done', path: pathArg });
          if (result.success) {
            console.log('✓ State cleared.');
          } else {
            console.error(`Error: ${result.error}`);
            process.exit(1);
          }
        } else {
          // Show current state
          const result = await state({ path: pathArg });
          console.log(formatStateForDisplay(result.state || null));
        }
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "megg help" for usage information.');
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
