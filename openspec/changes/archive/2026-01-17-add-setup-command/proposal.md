# Change: Add Setup Command for First-Time Installation

## Why
New users have to manually configure MCP server, skills, and hooks separately. This is error-prone and fragmented. A single `megg setup` command should handle all first-time configuration for their AI tool.

## What Changes
- Add `megg setup` command for first-time machine-level setup
- Support Claude Code initially (extensible for Cursor, Windsurf later)
- Auto-register MCP server with Claude Code
- Install skills to user's ~/.claude/skills/
- Configure SessionStart hook in user's hooks config
- Interactive tool selection with future extensibility

## Impact
- Affected specs: `setup` (new)
- Affected code:
  - `src/commands/setup.ts` (new)
  - `src/cli.ts` (add setup command)
  - `src/index.ts` (optional: expose via MCP for discoverability)

## Key Design Decisions

### Tool-Aware Setup
Different AI tools need different configurations:

| Tool | MCP | Skills | Hooks |
|------|-----|--------|-------|
| Claude Code | Yes | Yes | Yes |
| Cursor | Yes | No | No |
| Windsurf | Yes | No | No |
| Generic MCP | Yes | No | No |

### Setup Flow
```
$ megg setup

Welcome to megg - Memory for AI Agents

Which AI tool do you use?
  > Claude Code
    Cursor (coming soon)
    Windsurf (coming soon)
    Other MCP client

Setting up for Claude Code...
  ✓ Registered MCP server
  ✓ Installed skills (/megg-state)
  ✓ Configured SessionStart hook

Done! megg will now load context automatically.

Next: Run 'megg init' in your project to create .megg/
```

### Non-Interactive Mode
```bash
megg setup --tool claude-code --yes
```

For scripted/automated installs.

### Idempotent
Running `megg setup` multiple times is safe - it updates existing config rather than duplicating.

### File Locations (Claude Code)

**MCP Registration:**
- Uses `claude mcp add` CLI command
- Or directly modifies `~/.claude/claude_desktop_config.json`

**Skills:**
- Copies to `~/.claude/skills/megg-state.md`
- Symlink option for development: `--link`

**Hooks:**
- Merges into `~/.claude/hooks.json`
- Preserves existing hooks, adds megg's SessionStart hook

### Uninstall
```bash
megg setup --uninstall
```

Removes MCP registration, skills, and hooks cleanly.
