# Project Context

## Purpose
megg is a memory system for AI agents. It turns stateless agents into "good employees" that remember context across sessions through a simple file-based knowledge hierarchy.

## Tech Stack
- TypeScript
- Node.js
- MCP SDK (@modelcontextprotocol/sdk)
- Zod for validation
- Vitest for testing

## Project Conventions

### Code Style
- ES modules (type: "module")
- Strict TypeScript
- Functions over classes where possible
- Async/await for all file operations
- Clear JSDoc comments on exports

### Architecture Patterns
- **4 Core Tools**: context, learn, init, maintain
- **Domain Hierarchy**: .megg directories for bounded contexts, NOT code folders
- **Single Knowledge File**: One knowledge.md per domain with type + topics
- **Size-Aware Loading**: Full (<8k tokens), summary (8-16k), blocked (>16k)
- **Auto-Discovery**: Walk up/down directory tree to find .megg chain
- **Hooks Integration**: SessionStart auto-loads context, Stop suggests learning

### File Structure
```
src/
├── types.ts              # All TypeScript types
├── index.ts              # MCP server entry
├── cli.ts                # CLI entry point
├── commands/
│   ├── context.ts        # Load context chain + knowledge
│   ├── learn.ts          # Add knowledge entries
│   ├── init.ts           # Initialize megg
│   └── maintain.ts       # Cleanup + consolidation
└── utils/
    ├── files.ts          # File I/O
    ├── format.ts         # Frontmatter formatting
    ├── paths.ts          # Directory discovery
    ├── tokens.ts         # Token estimation
    └── knowledge.ts      # Parsing, summarization

hooks/
├── hooks.json            # Claude Code plugin hooks
└── session-start.sh      # Shell script for hook
```

### Testing Strategy
- Unit tests with Vitest
- Test files alongside source in tests/ directory
- Focus on core functions: parsing, discovery, token estimation

### Git Workflow
- Main branch: `main`
- Development on feature branches
- Semantic commits: feat, fix, docs, chore, refactor

## Domain Context

### Entry Types
Knowledge entries have 4 types:
- **decision**: Architectural choices with rationale
- **pattern**: How we do things here (repeatable approaches)
- **gotcha**: Traps to avoid (learned the hard way)
- **context**: Background info (facts, not opinions)

### Entry Format
```markdown
## YYYY-MM-DD - Title
**Type:** decision|pattern|gotcha|context
**Topics:** tag1, tag2

Content...
```

### Size Thresholds
- 8,000 tokens: Full load limit
- 16,000 tokens: Summary limit (blocked above)
- 90 days: Staleness threshold for maintenance

## Important Constraints

### UX Principles
- **Collaborative learning**: Always ask before capturing knowledge
- **Transparency over abstraction**: Show what's actually happening
- **Warm but brief messaging**: Team/collaboration framing

### What NOT To Do
- Don't create .megg for code folders (src/api/auth)
- Don't auto-capture learnings without user confirmation
- Don't use "I" for the agent - use "Agent"

## External Dependencies

### MCP SDK
Model Context Protocol for AI tool integration. megg exposes 4 tools via MCP.

### Claude Code Hooks
Integration points:
- SessionStart: Auto-load context
- Stop: Suggest learning capture

### Token Estimation
Simple heuristic: ~4 characters per token. Good enough for size decisions.
