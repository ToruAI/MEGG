# Setup Command

First-time machine-level configuration for megg.

## Requirements

### Requirement: Tool Detection
The system SHALL support multiple AI tools with tool-specific configuration.

#### Scenario: Claude Code setup
- **WHEN** setup({ tool: "claude-code" }) is called
- **THEN** configure MCP server, skills, and hooks

#### Scenario: Generic MCP setup
- **WHEN** setup({ tool: "generic-mcp" }) is called
- **THEN** configure MCP server only (no skills/hooks)

#### Scenario: Unsupported tool
- **WHEN** setup({ tool: "cursor" }) or setup({ tool: "windsurf" }) is called
- **THEN** return error with "coming soon" message

### Requirement: MCP Server Registration
The system SHALL register megg as an MCP server using the claude CLI.

#### Scenario: Register new server
- **WHEN** MCP server is not registered
- **THEN** run `claude mcp add megg -- npx -y megg@latest`

#### Scenario: Update existing server
- **WHEN** MCP server is already registered
- **THEN** remove and re-add to ensure correct configuration

#### Scenario: Claude CLI not found
- **WHEN** claude CLI is not available
- **THEN** return error with installation instructions

### Requirement: Skills Installation
The system SHALL install /megg-state skill to ~/.claude/skills/.

#### Scenario: Install skill
- **WHEN** setup for Claude Code runs
- **THEN** create ~/.claude/skills/megg-state/SKILL.md

#### Scenario: Development mode
- **WHEN** setup with --link flag
- **THEN** create symlink instead of copying file

#### Scenario: Update existing skill
- **WHEN** skill already exists
- **THEN** remove and reinstall to ensure latest version

### Requirement: Hooks Configuration
The system SHALL configure SessionStart hook in ~/.claude/hooks.json.

#### Scenario: Add hook to empty file
- **WHEN** hooks.json doesn't exist or is empty
- **THEN** create with megg SessionStart hook

#### Scenario: Merge with existing hooks
- **WHEN** hooks.json has other hooks
- **THEN** add megg hook without removing others
- **AND** create backup of original file

#### Scenario: Update existing megg hook
- **WHEN** megg hook already exists
- **THEN** update in place rather than duplicating

### Requirement: Idempotency
The system SHALL be safe to run multiple times.

#### Scenario: Re-run setup
- **WHEN** setup is run on already-configured machine
- **THEN** update configuration without duplicating entries
- **AND** preserve non-megg configuration

### Requirement: Uninstall
The system SHALL remove megg configuration when --uninstall flag is provided.

#### Scenario: Full uninstall
- **WHEN** setup({ uninstall: true }) is called
- **THEN** remove MCP server registration
- **AND** remove skills directory
- **AND** remove megg hooks (preserve other hooks)
