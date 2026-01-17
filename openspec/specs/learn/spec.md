# Learn Tool

Add knowledge entries to the nearest .megg/knowledge.md.

## Requirements

### Requirement: Entry Creation
The system SHALL append structured knowledge entries to knowledge.md in the nearest .megg directory.

#### Scenario: Add entry with all metadata
- **WHEN** learn(title, type, topics, content) is called
- **THEN** an entry SHALL be appended with date, title, type, topics, and content
- **AND** the entry format SHALL follow the standard template

### Requirement: Entry Format
The system SHALL format entries with a consistent structure including date, title, type, and topics.

#### Scenario: Entry format structure
- **WHEN** an entry is created
- **THEN** it SHALL include `## YYYY-MM-DD - Title` header
- **AND** `**Type:** decision|pattern|gotcha|context` line
- **AND** `**Topics:** tag1, tag2` line with lowercased topics
- **AND** the content body

### Requirement: Entry Type Validation
The system SHALL validate that entry types are one of the allowed values.

#### Scenario: Valid entry types
- **WHEN** type is "decision", "pattern", "gotcha", or "context"
- **THEN** the entry SHALL be created successfully

#### Scenario: Invalid entry type
- **WHEN** type is not one of the allowed values
- **THEN** an error SHALL be returned indicating valid options

### Requirement: Topic Validation
The system SHALL require at least one topic for each entry.

#### Scenario: Topics required
- **WHEN** topics array is empty
- **THEN** an error SHALL be returned requiring at least one topic

#### Scenario: Topics normalization
- **WHEN** topics contain mixed case
- **THEN** all topics SHALL be normalized to lowercase

### Requirement: Knowledge File Creation
The system SHALL create knowledge.md with frontmatter if it does not exist.

#### Scenario: Create knowledge.md
- **WHEN** learn() is called and knowledge.md does not exist
- **THEN** knowledge.md SHALL be created with proper frontmatter
- **AND** the entry SHALL be appended

### Requirement: Nearest Megg Discovery
The system SHALL find the nearest .megg directory by walking up the tree.

#### Scenario: Find nearest megg
- **WHEN** learn() is called from a nested directory
- **THEN** the entry SHALL be added to the nearest ancestor .megg

#### Scenario: No megg found
- **WHEN** no .megg directory exists in any ancestor
- **THEN** an error SHALL instruct running 'megg init' first

### Requirement: Size Warning
The system SHALL warn when knowledge.md exceeds 12,000 tokens after adding an entry.

#### Scenario: Size warning threshold
- **WHEN** knowledge.md exceeds 12,000 tokens after adding entry
- **THEN** a warning SHALL suggest running maintain() soon

### Requirement: Frontmatter Update
The system SHALL update the "updated" timestamp in frontmatter when adding entries.

#### Scenario: Touch frontmatter
- **WHEN** an entry is added
- **THEN** the frontmatter "updated" field SHALL be set to current timestamp
