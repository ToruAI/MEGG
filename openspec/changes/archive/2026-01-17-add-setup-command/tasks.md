# Tasks: Add Setup Command

## 1. Core Setup Command
- [x] 1.1 Create `src/commands/setup.ts` with main setup() function
- [x] 1.2 Implement tool detection/selection (interactive prompt)
- [x] 1.3 Add --tool flag for non-interactive mode
- [x] 1.4 Add --yes flag to skip confirmations

## 2. Claude Code Integration
- [x] 2.1 Implement MCP server registration (via `claude mcp add` or config file)
- [x] 2.2 Implement skills installation to ~/.claude/skills/
- [x] 2.3 Implement hooks configuration (merge into ~/.claude/hooks.json)
- [x] 2.4 Add --link flag for symlink mode (development)

## 3. Idempotency & Safety
- [x] 3.1 Detect existing megg configuration
- [x] 3.2 Update rather than duplicate on re-run
- [x] 3.3 Backup existing hooks.json before modifying

## 4. Uninstall
- [x] 4.1 Implement --uninstall flag
- [x] 4.2 Remove MCP registration
- [x] 4.3 Remove skills files
- [x] 4.4 Remove hooks entries (preserve other hooks)

## 5. CLI Integration
- [x] 5.1 Add setup command to `src/cli.ts`
- [x] 5.2 Add setup to help text

## 6. Future Tool Stubs
- [x] 6.1 Add "coming soon" placeholders for Cursor, Windsurf
- [x] 6.2 Add generic MCP client option (MCP only, no skills/hooks)

## 7. Documentation
- [x] 7.1 Update README with setup instructions
- [x] 7.2 Update project.md with setup command
