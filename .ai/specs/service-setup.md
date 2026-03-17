---
id: SVC-006
type: service
status: active
severity: low
issue: —
validated: 2026-03-17
---

# Setup Command

## What
One-time machine-level configuration for megg (MCP server + skills + hooks).
Supports Claude Code only; other tools return "coming soon".

## Why
Manual setup is error-prone. `megg setup` bootstraps everything in one command.

## Dependencies
- Requires: `claude` CLI available on PATH
- Writes to: `~/.claude/` (MCP config, skills, hooks)

## How
1. Detect tool (`claude-code` or `generic-mcp`)
2. Register MCP server: `claude mcp add megg -- npx -y megg@latest`
   - If already registered → remove and re-add
3. Install `/megg-state` skill to `~/.claude/skills/megg-state/SKILL.md`
   - `--link` flag → symlink instead of copy (dev mode)
4. Configure SessionStart hook in `~/.claude/settings.json`
   - Merge with existing hooks, never overwrite non-megg config
5. `--uninstall` → reverse all of the above, preserve non-megg config

## Invariants
- Idempotent: safe to run multiple times
- Never removes non-megg hooks/config
- Creates backup before modifying existing hooks

## Test
- Fresh machine: all three components configured
- Re-run: updates in place, no duplicates
- `--link`: symlink created instead of file copy
- `--uninstall`: all megg config removed, others preserved
- Missing `claude` CLI: clear error with install instructions

## Changelog
- 2026-01-17: Initial
