#!/usr/bin/env node
/**
 * megg - MCP Server
 *
 * Simplified memory system for AI agents.
 * 5 core tools: init, context, learn, maintain, state
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { context, formatContextForDisplay } from "./commands/context.js";
import { learn, isValidEntryType } from "./commands/learn.js";
import { init, initCommand } from "./commands/init.js";
import { maintain, formatMaintenanceReport } from "./commands/maintain.js";
import { state, formatStateForDisplay } from "./commands/state.js";

// Create server instance
const server = new McpServer({
  name: "megg",
  version: "1.1.0",
});

const PROJECT_ROOT = process.cwd();

// ============================================================================
// Core Tools (v1.1.0)
// ============================================================================

server.tool(
  "context",
  "Load context chain and knowledge for current location. Auto-discovers .megg hierarchy, loads info chain, and includes knowledge (full if <8k tokens, summary if <16k, blocked if larger). Use topic parameter to filter knowledge by specific topic.",
  {
    path: z.string().optional().describe("Target path (defaults to cwd)"),
    topic: z.string().optional().describe("Filter knowledge by topic"),
  },
  async ({ path: targetPath, topic }) => {
    try {
      const result = await context(targetPath || PROJECT_ROOT, topic);
      const formatted = formatContextForDisplay(result);
      return { content: [{ type: "text", text: formatted }] };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "learn",
  "Add a knowledge entry to the nearest .megg/knowledge.md. Entries have type (decision/pattern/gotcha/context), topics for categorization, and content.",
  {
    title: z.string().describe("Short title for the entry"),
    type: z.enum(["decision", "pattern", "gotcha", "context"]).describe("Entry type: decision (architectural choice), pattern (how we do things), gotcha (trap to avoid), context (background info)"),
    topics: z.array(z.string()).describe("Tags for categorization (e.g., ['auth', 'api', 'security'])"),
    content: z.string().describe("The knowledge content in markdown"),
    path: z.string().optional().describe("Target path (defaults to cwd, finds nearest .megg)"),
  },
  async ({ title, type, topics, content, path: targetPath }) => {
    try {
      const result = await learn({
        title,
        type,
        topics,
        content,
        path: targetPath || PROJECT_ROOT,
      });

      if (!result.success) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${result.error}` }],
        };
      }

      let response = `✓ Added "${title}" to ${result.path}`;
      if (result.warning) {
        response += `\n\n⚠️ ${result.warning}`;
      }

      return { content: [{ type: "text", text: response }] };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "init",
  "Initialize megg in current directory. Without content: analyzes project and returns questions to ask. With content: creates .megg/info.md and optionally knowledge.md.",
  {
    projectRoot: z.string().optional().describe("Root directory (defaults to cwd)"),
    info: z.string().optional().describe("Content for info.md (if provided, creates the file)"),
    knowledge: z.string().optional().describe("Initial content for knowledge.md (optional)"),
  },
  async ({ projectRoot, info, knowledge }) => {
    try {
      const root = projectRoot || PROJECT_ROOT;

      if (info) {
        // Create files mode
        const result = await init(root, { info, knowledge });
        if ('success' in result) {
          return { content: [{ type: "text", text: result.message }] };
        }
      }

      // Analysis mode
      const output = await initCommand(root);
      return { content: [{ type: "text", text: output }] };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "maintain",
  "Analyze knowledge files for bloat, staleness, and duplicates. Returns a report with suggested cleanup actions.",
  {
    path: z.string().optional().describe("Root path to scan (defaults to cwd)"),
  },
  async ({ path: targetPath }) => {
    try {
      const report = await maintain(targetPath || PROJECT_ROOT);
      const formatted = formatMaintenanceReport(report);
      return { content: [{ type: "text", text: formatted }] };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

server.tool(
  "state",
  "Manage ephemeral session state for cross-session handoff. Call without args to read current state. Call with content to write state. Call with status='done' to clear state. State auto-expires after 48h.",
  {
    content: z.string().optional().describe("State content to write (Working On, Progress, Next, Context sections)"),
    status: z.enum(["active", "done"]).optional().describe("Set to 'done' to clear state"),
    path: z.string().optional().describe("Target path (defaults to cwd)"),
  },
  async ({ content, status, path: targetPath }) => {
    try {
      const result = await state({
        content,
        status,
        path: targetPath || PROJECT_ROOT,
      });

      if (!result.success) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error: ${result.error}` }],
        };
      }

      let response: string;
      if (status === 'done') {
        response = '✓ State cleared.';
      } else if (content) {
        response = `✓ State saved to ${result.state?.path}`;
        if (result.warning) {
          response += `\n\n⚠️ ${result.warning}`;
        }
      } else {
        response = formatStateForDisplay(result.state || null);
      }

      return { content: [{ type: "text", text: response }] };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
);

// ============================================================================
// Main
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("megg MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
