# State Tool

Manage ephemeral session state for cross-session handoff.

## Requirements

### Requirement: State Format
The system SHALL use a standard frontmatter + markdown format for state.md.

#### Scenario: Valid state file
- **WHEN** state.md exists
- **THEN** it SHALL have YAML frontmatter with `updated` (ISO timestamp) and `status` (active|done)
- **AND** markdown body with session context

### Requirement: State Read
The system SHALL read and return current state when called without arguments.

#### Scenario: Read active state
- **WHEN** state() is called without arguments
- **AND** state.md exists and is active
- **THEN** return state content, status, updated timestamp, and token count

#### Scenario: Read expired state
- **WHEN** state() is called without arguments
- **AND** state.md exists but is expired (>48h or status:done)
- **THEN** return state with expired:true flag

#### Scenario: No state file
- **WHEN** state() is called without arguments
- **AND** no state.md exists
- **THEN** return null state

### Requirement: State Write
The system SHALL write/overwrite state.md when content is provided.

#### Scenario: Write new state
- **WHEN** state({ content: "..." }) is called
- **THEN** create/overwrite state.md with provided content
- **AND** set status to "active" and updated to current timestamp
- **AND** truncate content if exceeds 2k token limit

#### Scenario: Truncation warning
- **WHEN** state content exceeds 2,000 tokens
- **THEN** truncate to limit and include warning in result

### Requirement: State Clear
The system SHALL clear state when status:done is provided.

#### Scenario: Clear state
- **WHEN** state({ status: "done" }) is called
- **THEN** delete state.md file
- **AND** return success confirmation

### Requirement: Auto-Expiry
The system SHALL consider state expired after 48 hours or when status is "done".

#### Scenario: Time-based expiry
- **WHEN** state.md updated timestamp is older than 48 hours
- **THEN** state is considered expired and excluded from context()

#### Scenario: Status-based expiry
- **WHEN** state.md has status: done
- **THEN** state is considered expired and excluded from context()
