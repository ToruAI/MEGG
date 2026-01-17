# Context Tool

Load context chain and knowledge for the current location.

## Requirements

### Requirement: Domain Chain Discovery
The system SHALL walk up the directory tree to find all ancestor .megg directories and load their info.md files in order from root to deepest.

#### Scenario: Multi-level hierarchy
- **WHEN** context() is called from `/projects/client/feature/`
- **AND** .megg exists at `/projects/.megg` and `/projects/client/.megg`
- **THEN** the chain SHALL include both domains in order: projects, client

#### Scenario: No megg found
- **WHEN** context() is called from a path with no .megg ancestors
- **THEN** the chain SHALL be empty

### Requirement: Knowledge Loading
The system SHALL load knowledge.md from the deepest .megg directory with size-aware behavior based on token count.

#### Scenario: Full load (under 8k tokens)
- **WHEN** knowledge.md exists and contains fewer than 8,000 tokens
- **THEN** the full content SHALL be returned with mode "full"

#### Scenario: Summary load (8k-16k tokens)
- **WHEN** knowledge.md exists and contains 8,000-16,000 tokens
- **THEN** a generated summary SHALL be returned with mode "summary"
- **AND** a warning SHALL be included suggesting topic filtering

#### Scenario: Blocked load (over 16k tokens)
- **WHEN** knowledge.md exists and contains more than 16,000 tokens
- **THEN** loading SHALL be blocked with mode "blocked"
- **AND** a message SHALL instruct running maintain()

### Requirement: Topic Filtering
The system SHALL filter knowledge entries by topic when a topic parameter is provided.

#### Scenario: Filter by topic
- **WHEN** context(path, "auth") is called
- **THEN** only entries with "auth" in their topics SHALL be returned
- **AND** mode SHALL be "full" regardless of total file size

#### Scenario: No matching entries
- **WHEN** context(path, "nonexistent") is called
- **THEN** a message SHALL indicate no entries found for that topic

### Requirement: Sibling and Child Discovery
The system SHALL discover sibling .megg directories (peers) and child .megg directories (subdomains) for navigation purposes.

#### Scenario: Discover siblings
- **WHEN** context() is called
- **THEN** sibling domains at the same directory level SHALL be listed

#### Scenario: Discover children
- **WHEN** context() is called
- **THEN** subdomain .megg directories SHALL be listed

### Requirement: File Discovery
The system SHALL list all .md files in the current .megg directory, indicating which ones were loaded.

#### Scenario: List available files
- **WHEN** .megg contains info.md, knowledge.md, and custom.md
- **THEN** all three files SHALL be listed
- **AND** info.md and knowledge.md SHALL be marked as loaded
- **AND** custom.md SHALL be marked as not loaded

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

### Requirement: SessionStart Hook Output
The system SHALL format output for Claude Code SessionStart hook integration when --json flag is used.

#### Scenario: JSON output for hook
- **WHEN** context --json is executed
- **THEN** output SHALL be JSON with hookSpecificOutput.additionalContext
- **AND** systemMessage SHALL list actual file paths loaded
- **AND** include state.md in loaded files list if active
- **AND** a collaborative learning reminder SHALL be included
