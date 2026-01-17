# Setup

First-time machine-level configuration for megg.

## ADDED Requirements

### Requirement: Interactive Tool Selection
The system SHALL prompt user to select their AI tool when run without --tool flag.

#### Scenario: Interactive mode
- **WHEN** user runs `megg setup` without --tool flag
- **THEN** display list of supported tools (Claude Code, Cursor, Windsurf, Other)
- **AND** allow user to select one
- **AND** proceed with tool-specific setup

#### Scenario: Non-interactive mode
- **WHEN** user runs `megg setup --tool claude-code`
- **THEN** skip tool selection prompt
- **AND** proceed with Claude Code setup

### Requirement: Claude Code MCP Registration
The system SHALL register megg as an MCP server with Claude Code.

#### Scenario: Register MCP server
- **WHEN** setting up for Claude Code
- **THEN** register megg MCP server using `claude mcp add` or config file
- **AND** use the installed megg binary path

#### Scenario: Already registered
- **WHEN** megg MCP server is already registered
- **THEN** update the registration if path differs
- **AND** skip if identical

### Requirement: Claude Code Skills Installation
The system SHALL install megg skills to user's Claude Code skills directory.

#### Scenario: Install skills
- **WHEN** setting up for Claude Code
- **THEN** copy skill files to ~/.claude/skills/
- **AND** create skills directory if it doesn't exist

#### Scenario: Link mode
- **WHEN** setup is run with --link flag
- **THEN** create symlinks instead of copies
- **AND** point to package's skill files

### Requirement: Claude Code Hooks Configuration
The system SHALL configure SessionStart hook for auto-loading context.

#### Scenario: Configure hooks
- **WHEN** setting up for Claude Code
- **THEN** merge megg hook into ~/.claude/hooks.json
- **AND** preserve existing hooks

#### Scenario: Hook already exists
- **WHEN** megg SessionStart hook already configured
- **THEN** update if different
- **AND** skip if identical

### Requirement: Setup Confirmation
The system SHALL display confirmation of completed steps.

#### Scenario: Success output
- **WHEN** setup completes successfully
- **THEN** display checkmarks for each completed step
- **AND** show "next steps" guidance (run megg init)

### Requirement: Idempotent Execution
The system SHALL be safe to run multiple times.

#### Scenario: Re-run setup
- **WHEN** user runs setup again
- **THEN** update existing configuration
- **AND** not create duplicates

### Requirement: Uninstall
The system SHALL support removing megg configuration.

#### Scenario: Uninstall
- **WHEN** user runs `megg setup --uninstall`
- **THEN** remove MCP registration
- **AND** remove skill files
- **AND** remove hook entries (preserve other hooks)
- **AND** confirm removal

### Requirement: Skip Confirmation Flag
The system SHALL support --yes flag for automated installs.

#### Scenario: Automated install
- **WHEN** user runs `megg setup --tool claude-code --yes`
- **THEN** skip all confirmation prompts
- **AND** proceed with defaults

### Requirement: Future Tool Support
The system SHALL indicate coming soon status for unsupported tools.

#### Scenario: Coming soon tools
- **WHEN** user selects Cursor or Windsurf
- **THEN** display "coming soon" message
- **AND** offer to set up generic MCP only
