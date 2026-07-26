# megg — AI agent memory that lives in your repo

[![npm version](https://img.shields.io/npm/v/megg.svg)](https://www.npmjs.com/package/megg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io/)

> **Claude Code's memory stays on your machine. megg puts it in the repo** — plain markdown in `.megg/` folders, versioned with git. Push, and your teammate's (and your CI's) agent already knows everything yours learned.

## The Problem

Your agent's memory doesn't travel. Claude Code remembers — but in `~/.claude/`, on one machine:
- New laptop, teammate, CI runner, fresh worktree: the agent starts from zero
- Architectural decisions live outside the codebase they describe
- A monorepo gets one flat memory for wildly different subprojects
- Memory can't be reviewed, diffed, or reverted like everything else you trust

## The Solution

**megg** keeps agent memory as markdown in `.megg/` folders inside your directory tree — next to the code it describes, versioned with the repo. Works with Claude Code, Claude Desktop, and any MCP-compatible assistant.

- `git push` → every teammate's agent shares the memory
- Per-directory scope: `api/.megg/` knows API conventions, `clients/acme/.megg/` knows Acme
- Human-readable, human-editable, reviewable in PRs

This is how we work at ToruAI: ~30 `.megg` folders across client projects, internal tools and this repo itself — from company root down to single features.

```
Session 1: "We decided to use JWT with refresh tokens"
           → megg stores this decision

Session 47: Agent automatically knows about JWT decision
            → No re-explaining, no re-deciding
```

## Features

- **Git-Native** - Memory is markdown in `.megg/` folders: versioned, diffable, shared with the repo
- **Auto-Discovery** - Walks directory tree to find relevant context
- **Hierarchical Context** - Company → Project → Feature inheritance
- **Size-Aware Loading** - Smart token management (full/summary/blocked)
- **Topic Filtering** - Query knowledge by tags like `auth`, `api`, `security`
- **Session Handoff** - Pass state between sessions with `/megg-state`
- **MCP Protocol** - Works with Claude Desktop, Claude Code, and other MCP clients
- **CLI & API** - Use from terminal or programmatically

## Quick Start

### 1. Install

```bash
npm install -g megg
```

### 2. Setup (one-time, for Claude Code)

```bash
megg setup
```

This automatically:
- Registers megg as an MCP server
- Installs the `/megg-state` skill
- Configures SessionStart hook for auto-loading context

### 3. Initialize in Your Project

```bash
cd your-project
megg init
```

This creates a `.megg/` folder with:
- `info.md` - Project identity and rules
- `knowledge.md` - Accumulated learnings

That's it! Run `megg context` to verify, then context loads automatically when you start Claude Code.

---

<details>
<summary>Manual Setup (without megg setup)</summary>

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

And add to `~/.claude/hooks.json` for automatic context loading:

```json
{
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
```

</details>

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
| `rule` | Always/never do X | "Don't use localStorage for auth tokens" |
| `fact` | This is true about X | "This client requires HIPAA compliance" |
| `decision` | We chose X because Y | "We chose PostgreSQL over MongoDB because..." |
| `process` | How to do X step by step | "Deploy: build → tag → push → migrate" |

### Smart Token Management

| Knowledge Size | Behavior |
|----------------|----------|
| < 8,000 tokens | Full knowledge loaded |
| 8k - 16k tokens | Summary + topic index |
| > 16,000 tokens | Blocked - run `maintain()` to clean up |

## API Reference

### 5 Core Tools

| Tool | Purpose |
|------|---------|
| `context(path?, topic?)` | Load context chain + knowledge + state |
| `learn(title, type, topics, content)` | Add knowledge entry |
| `init()` | Initialize megg in directory |
| `maintain()` | Analyze and clean up bloated knowledge |
| `state(content?, status?)` | Session state handoff (ephemeral) |

### CLI Usage

```bash
# Load context for current directory
npx megg context

# Load context with topic filter
npx megg context . --topic auth

# Add a decision
npx megg learn "JWT Auth" decision "auth,security" "We use JWT because..."

# Add a rule
npx megg learn "No localStorage for tokens" rule "auth,security" "Use httpOnly cookies instead"

# Initialize megg
npx megg init

# Check knowledge health
npx megg maintain

# Show current session state
npx megg state

# Clear session state (mark task done)
npx megg state --clear
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

// Session state
state()                    // Read current state
state({ content: "..." })  // Write state
state({ status: "done" })  // Clear state
```

### Session State with /megg-state

Unlike permanent knowledge, **session state** is ephemeral - designed for passing context between sessions when you're mid-task.

```bash
# In Claude Code, use the skill:
/megg-state         # Capture current work for next session
/megg-state show    # Display current state
/megg-state clear   # Mark task complete, clear state
```

**State vs Knowledge:**
| Aspect | state.md | knowledge.md |
|--------|----------|--------------|
| Purpose | Session handoff | Permanent wisdom |
| Lifecycle | Overwritten each capture | Accumulated over time |
| Expiry | Auto-expires after 48h | Never expires |
| Size limit | 2k tokens (hard) | 8k-16k tokens (soft) |

**Example state.md:**
```markdown
---
updated: 2026-01-17T10:30:00Z
status: active
---

## Working On
Implementing user authentication

## Progress
- Created auth middleware
- Added JWT validation

## Next
- Add refresh token rotation
- Write tests

## Context
Files: src/middleware/auth.ts, src/utils/jwt.ts
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

| | megg | Claude Code auto-memory | Central-store memory tools |
|---|------|------------------------|----------------------------|
| Lives in the repo | Yes — `.megg/` folders | No — `~/.claude/`, machine-local | No — home dir or database |
| Travels with `git push` | Yes | No | No (hosted sync at best) |
| Per-directory scope in a monorepo | Yes | Per-project only | Varies |
| Reviewable/diffable in PRs | Yes | No | No |
| Human-editable markdown | Yes | Yes | Sometimes |
| Knowledge accumulation + session handoff | Yes | Partial | Varies |

Claude Code's built-in memory is good — and stays on one machine. Vector/graph memory platforms are powerful — and live outside your repo. megg's bet is simpler: **the agent's learned context belongs in version control, next to the code it's about.**

## File Structure

```
project/
├── .megg/
│   ├── info.md          # Identity & rules (~200 tokens)
│   ├── knowledge.md     # Accumulated learnings (permanent)
│   └── state.md         # Session handoff (ephemeral)
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
- knowledge.md: rules, facts, decisions, processes
```

### knowledge.md Entry Format

```markdown
---

## 2026-07-15 - JWT Auth Decision
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
| - | `state()` (new in v1.1.0) |

## Philosophy

megg makes AI agents behave like good employees who:
- **Orient before acting** - Context loads automatically at session start
- **Respect existing decisions** - Knowledge persists across sessions
- **Document for colleagues** - Learnings are captured, not lost
- **Build institutional knowledge** - The system grows smarter over time

Every AI session starts fresh, but with megg, your agent remembers.

## Security Model

megg's memory is plain text that enters your agent's context. Treat it accordingly:

- **`.megg/` content is instruction-adjacent.** The model reads knowledge entries as trusted project memory, so a malicious entry is a prompt injection. Review changes to `.megg/` in PRs the way you review code.
- **Third-party repos bring their own memory.** If you clone a repo you don't trust, its `.megg/` folders load like any other. Inspect or delete them before running an agent session inside it.
- **The context chain walks up the directory tree by design** — parent and company-level `.megg/` folders are included. Keep secrets out of knowledge files: they are plain markdown in git, and they end up in model context.

None of this is unique to megg — any memory system that feeds text to a model has the same property — but a memory you can `git diff` is at least one you can audit.

## Development

```bash
# Clone and install
git clone https://github.com/toruai/megg.git
cd megg
npm install

# Build
npm run build

# Run tests
npm test

# Verify everything works
./scripts/verify-install.sh

# Link for local testing (use sudo on Linux if needed)
npm link
megg --help

# Setup with symlinks (changes reflect immediately)
megg setup --link
```

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [npm package](https://www.npmjs.com/package/megg)
- [GitHub repository](https://github.com/toruai/megg)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Report issues](https://github.com/toruai/megg/issues)
