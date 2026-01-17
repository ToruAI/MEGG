# megg Hooks for Claude Code

This directory contains hook configuration for Claude Code integration.

## Installation

Run `megg setup` for automatic configuration, or manually add to `~/.claude/hooks.json`:

```json
{
  "SessionStart": [
    {
      "matcher": "startup|resume",
      "hooks": [
        {
          "type": "command",
          "command": "npx megg context --json 2>/dev/null || echo '{}'",
          "timeout": 10
        }
      ]
    }
  ]
}
```

## What the hook does

Automatically loads megg context when you start a Claude Code session:
- Discovers .megg directories by walking up the tree
- Loads info.md chain (domain hierarchy)
- Includes knowledge.md (full, summary, or blocked based on size)
- Includes state.md if active (session handoff)

The context is injected into Claude's context automatically.

## CLI usage

You can also use the CLI directly in hooks:

```bash
# Load context
npx megg context

# Load context filtered by topic
npx megg context --topic auth

# Add a learning
npx megg learn "Title" decision "topic1,topic2" "Content here"
```
