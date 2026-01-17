# State

Ephemeral session handoff for cross-session continuity.

## ADDED Requirements

### Requirement: State Capture
The system SHALL allow capturing session state via `state(content)`.

#### Scenario: Write state
- **WHEN** state(content) is called with content
- **THEN** create/overwrite .megg/state.md with frontmatter (updated timestamp, status: active) and content
- **AND** truncate if content exceeds 2000 tokens with warning

#### Scenario: State token limit
- **WHEN** content exceeds 2000 tokens
- **THEN** truncate content to fit within limit
- **AND** return warning about truncation

### Requirement: State Retrieval
The system SHALL allow reading current state via `state()` with no arguments.

#### Scenario: Read state
- **WHEN** state() is called without arguments
- **THEN** return current state content if exists and not expired
- **AND** return null if no state or expired

### Requirement: State Clearing
The system SHALL allow clearing state via `state(status: "done")`.

#### Scenario: Mark done
- **WHEN** state(status: "done") is called
- **THEN** delete or clear state.md
- **AND** return confirmation

### Requirement: State Format
State files SHALL use frontmatter with status and timestamp.

#### Scenario: State file structure
- **GIVEN** a state.md file
- **THEN** it SHALL have frontmatter with `updated` (ISO timestamp) and `status` (active|done)
- **AND** content sections: Working On, Progress, Next, Context

### Requirement: State Expiry
State SHALL auto-expire when stale.

#### Scenario: Staleness detection
- **WHEN** state.md has `updated` older than 48 hours
- **AND** status is still "active"
- **THEN** treat as expired (do not load in context)

#### Scenario: Done state
- **WHEN** state.md has status "done"
- **THEN** treat as expired (do not load in context)

### Requirement: Nearest Megg Discovery
State operations SHALL target the nearest ancestor .megg directory.

#### Scenario: Find nearest megg for state
- **WHEN** state() is called from /project/src/feature
- **AND** .megg exists at /project/.megg
- **THEN** operate on /project/.megg/state.md

### Requirement: Megg-State Skill
The system SHALL provide a `/megg-state` skill for easy state management.

#### Scenario: Capture state
- **WHEN** user invokes `/megg-state`
- **THEN** agent summarizes current session (working on, progress, next, context)
- **AND** calls state() with formatted content

#### Scenario: Clear state
- **WHEN** user invokes `/megg-state clear`
- **THEN** agent calls state(status: "done")
- **AND** confirms state cleared

#### Scenario: Show state
- **WHEN** user invokes `/megg-state show`
- **THEN** agent calls state() without arguments
- **AND** displays current state or "no active state"
