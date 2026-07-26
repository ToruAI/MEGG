# Changelog

All notable changes to megg will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-26

### Changed
- README repositioned around what megg actually is: git-native agent memory that travels with the repo — versus machine-local auto-memory and central-store tools. Added an honest Security Model section (memory is model input; treat `.megg/` changes like code in review).
- `package.json`: `mcpName` (`io.github.toruai/megg`) for the official MCP Registry, sharper description.

### Added
- **Stale info.md warning** - `context()` now warns when `info.md` hasn't been updated in >30 days
  - Banner shown in context output: `⚠️ info.md last updated N days ago`
  - Prompts to run `megg init --update`
- **`init --update` mode** - Intelligent update of existing `info.md`
  - Loads current info, analyzes what may be outdated
  - Asks targeted questions section by section
  - Updates `updated` timestamp on save
- **Universal entry types** - New taxonomy that works for any domain (not just code)
  - `rule` — always/never do X (replaces `pattern` + `gotcha`)
  - `fact` — this is true about X (replaces `context`)
  - `decision` — we chose X because Y (unchanged)
  - `process` — how to do X step by step (new)

### Breaking Changes
- Entry types `pattern`, `gotcha`, `context` removed; replaced by `rule`, `fact`, `process`
  - Existing knowledge.md files with old types will still parse (type is read as-is from file)
  - New entries must use the new types

## [1.1.0] - 2026-01-17

### Added
- **Session State** - New `state()` tool for ephemeral cross-session handoff
  - `/megg-state` skill for Claude Code
  - Auto-expires after 48 hours
  - Hard limit of 2k tokens to prevent bloat
- **One-Command Setup** - `megg setup` configures everything:
  - Registers MCP server automatically
  - Installs `/megg-state` skill
  - Configures SessionStart hook
  - Supports `--uninstall` to remove configuration
  - Supports `--link` for development symlinks
- **Setup-Free Usage** - Works immediately after `npm install -g megg`
- **Improved CLI** - Better help text and examples

### Changed
- Simplified architecture from 9 tools to 6 core tools:
  - `context(path?, topic?)` - Load context chain + knowledge + state
  - `learn(title, type, topics, content)` - Add knowledge entry
  - `init()` - Initialize megg in directory
  - `maintain()` - Analyze and clean up knowledge
  - `state(content?, status?)` - Session state management
  - `setup()` - First-time machine configuration
- Skills now use folder structure: `.claude/skills/megg-state/SKILL.md`
- SessionStart hook includes state when active

### Fixed
- Hook output format now properly includes `additionalContext`
- Token estimation more accurate for size thresholds

## [1.0.0] - 2026-01-14

### Added
- Initial release of megg v1 (v2 architecture)
- Core tools: `context`, `learn`, `init`, `maintain`
- Domain hierarchy system (not code folder based)
- Size-aware knowledge loading:
  - Full load under 8k tokens
  - Summary mode 8k-16k tokens
  - Blocked above 16k tokens
- Topic-based filtering for knowledge
- MCP server for Claude Code, Claude Desktop, and other MCP clients
- CLI for terminal usage

### Philosophy
- Domain hierarchy for bounded contexts, not code folders
- Single knowledge.md per domain with type + topics
- Collaborative learning - agent asks before capturing
- Size thresholds prevent context bloat
