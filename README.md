# megg - Persistent Memory for AI Agents

[![npm version](https://img.shields.io/npm/v/megg.svg)](https://www.npmjs.com/package/megg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io/)

> **Give your AI agents long-term memory.** A lightweight knowledge management system for LLM agents with automatic context loading and smart token management.

## The Problem

AI agents are stateless. Every session starts from zero. Your agent:
- Forgets architectural decisions you made yesterday
- Re-discovers the same patterns over and over
- Doesn't know "how we do things here"
- Can't build on previous work

## The Solution

**megg** turns stateless AI agents into "good employees" who remember context across sessions. Works with Claude, GPT, and any MCP-compatible AI assistant.

```
Session 1: "We decided to use JWT with refresh tokens"
           → megg stores this decision

Session 47: Agent automatically knows about JWT decision
            → No re-explaining, no re-deciding
```

## Features

- **Auto-Discovery** - Walks directory tree to find relevant context
- **Hierarchical Context** - Company → Project → Feature inheritance
- **Size-Aware Loading** - Smart token management (full/summary/blocked)
- **Topic Filtering** - Query knowledge by tags like `auth`, `api`, `security`
- **MCP Protocol** - Works with Claude Desktop, Claude Code, and other MCP clients
- **CLI & API** - Use from terminal or programmatically

## Quick Start

### 1. Install MCP Server

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "megg": {
      "command": "npx",
      "args": ["-y", "megg@latest"]
    }
  }
}
```

Or install globally:

```bash
npm install -g megg
```

### 2. Initialize in Your Project

```bash
npx megg init
```

This creates a `.megg/` folder with:
- `info.md` - Project identity and rules
- `knowledge.md` - Accumulated learnings

### 3. (Optional) Auto-Load Context in Claude Code

Add to `.claude/settings.json` for automatic context on session start:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "npx megg context --json 2>/dev/null || echo '{}'"
          }
        ]
      }
    ]
  }
}
```

## How It Works

### Domain Hierarchy (Not Code Folders)

megg organizes knowledge by **bounded contexts**, not file paths:

```
Company/
├── .megg/info.md          # Company-wide rules
├── ProductA/.megg/        # Product-specific context
└── clients/
    └── acme/.megg/        # Client-specific knowledge
```

When you call `context("clients/acme")`, megg loads the full chain:
1. Company rules (parent)
2. Client workflow (if exists)
3. Acme specifics (target)

### Knowledge Types

| Type | Use For | Example |
|------|---------|---------|
| `decision` | Architectural choices | "We chose PostgreSQL over MongoDB because..." |
| `pattern` | Team conventions | "API endpoints use kebab-case" |
| `gotcha` | Traps to avoid | "Don't use localStorage for auth tokens" |
| `context` | Background info | "This client requires HIPAA compliance" |

### Smart Token Management

| Knowledge Size | Behavior |
|----------------|----------|
| < 8,000 tokens | Full knowledge loaded |
| 8k - 16k tokens | Summary + topic index |
| > 16,000 tokens | Blocked - run `maintain()` to clean up |

## API Reference

### 4 Simple Tools

| Tool | Purpose |
|------|---------|
| `context(path?, topic?)` | Load context chain + knowledge |
| `learn(title, type, topics, content)` | Add knowledge entry |
| `init()` | Initialize megg in directory |
| `maintain()` | Analyze and clean up bloated knowledge |

### CLI Usage

```bash
# Load context for current directory
npx megg context

# Load context with topic filter
npx megg context . --topic auth

# Add a decision
npx megg learn "JWT Auth" decision "auth,security" "We use JWT with refresh tokens..."

# Initialize megg
npx megg init

# Check knowledge health
npx megg maintain
```

### MCP Tool Usage

```javascript
// Load context (usually automatic via hooks)
context()
context("src/api")
context(null, "auth")  // filter by topic

// Add knowledge
learn({
  title: "JWT with refresh tokens",
  type: "decision",
  topics: ["auth", "api"],
  content: "We chose JWT because..."
})

// Initialize
init()

// Maintenance
maintain()
```

## Use Cases

### For Individual Developers
- Remember why you made certain technical decisions
- Keep track of project-specific conventions
- Build a personal knowledge base that grows with your projects

### For Teams
- Onboard new team members with accumulated knowledge
- Ensure AI assistants follow team conventions
- Preserve institutional knowledge when people leave

### For AI-Heavy Workflows
- Give Claude/GPT context about your codebase
- Prevent AI from re-suggesting rejected approaches
- Build consistent AI behavior across sessions

## Comparison with Alternatives

| Feature | megg | .cursorrules | Custom prompts |
|---------|------|--------------|----------------|
| Hierarchical context | Yes | No | No |
| Auto-discovery | Yes | No | No |
| Knowledge accumulation | Yes | No | Manual |
| Token management | Yes | No | No |
| MCP compatible | Yes | No | No |
| Cross-session memory | Yes | No | No |

## File Structure

```
project/
├── .megg/
│   ├── info.md          # Identity & rules (~200 tokens)
│   └── knowledge.md     # Accumulated learnings
```

### info.md Template

```markdown
# Project Name

## Context
Brief description of what this project is.

## Rules
1. Always do X
2. Never do Y
3. When Z, prefer A

## Memory Files
- knowledge.md: decisions, patterns, gotchas
```

### knowledge.md Entry Format

```markdown
---

## 2024-01-15 - JWT Auth Decision
**Type:** decision
**Topics:** auth, api, security

We chose JWT with refresh tokens because:
- Stateless authentication scales better
- Mobile apps need offline capability
- Refresh tokens provide security without constant re-auth

---
```

## Migration from v1

v1 tools still work but are deprecated:

| v1 | v1.1.0 |
|----|--------|
| `awake()` | `context()` |
| `recall()` | `context()` |
| `remember()` | `learn()` |
| `map()` | Included in `context()` |
| `settle()` | `maintain()` |

## Philosophy

megg makes AI agents behave like good employees who:
- **Orient before acting** - Context loads automatically at session start
- **Respect existing decisions** - Knowledge persists across sessions
- **Document for colleagues** - Learnings are captured, not lost
- **Build institutional knowledge** - The system grows smarter over time

Every AI session starts fresh, but with megg, your agent remembers.

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [npm package](https://www.npmjs.com/package/megg)
- [GitHub repository](https://github.com/toruai/megg)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Report issues](https://github.com/toruai/megg/issues)

---

**Keywords:** AI memory, LLM context management, Claude memory, GPT memory, MCP server, AI agent memory, persistent AI context, knowledge management for AI, Model Context Protocol, AI assistant memory, stateful AI agents
