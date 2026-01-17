# Context

Modifications to support state loading.

## MODIFIED Requirements

### Requirement: Domain Chain Discovery
The system SHALL walk up the directory tree to find all ancestor .megg directories.

#### Scenario: Multi-level hierarchy
- **WHEN** context() is called from /users/tako/clients/acme/project
- **AND** .megg exists at /users/tako and /users/tako/clients/acme
- **THEN** return chain with both domains in order (root first)

#### Scenario: No megg found
- **WHEN** context() is called from a path with no ancestor .megg
- **THEN** return empty chain

### Requirement: State Loading
The system SHALL load state.md if present and not expired.

#### Scenario: Load active state
- **WHEN** context() discovers a .megg with state.md
- **AND** state is active (status: active, updated within 48h)
- **THEN** include state content in result

#### Scenario: Skip expired state
- **WHEN** context() discovers a .megg with state.md
- **AND** state is expired (status: done OR updated > 48h ago)
- **THEN** exclude state from result

#### Scenario: No state file
- **WHEN** context() discovers a .megg without state.md
- **THEN** state field is null in result

### Requirement: File Discovery
The system SHALL list all markdown files in the current .megg directory.

#### Scenario: List available files
- **WHEN** context() runs
- **THEN** return list of .md files in target .megg
- **AND** mark which are loaded (info.md, knowledge.md, state.md)
- **AND** mark which are available but not loaded

### Requirement: SessionStart Hook Output
The system SHALL format output for Claude Code SessionStart hook.

#### Scenario: JSON output for hook
- **WHEN** context() is called with --json flag
- **THEN** return JSON with systemMessage (status) and additionalContext (full context)
- **AND** include state.md in loaded files list if active
