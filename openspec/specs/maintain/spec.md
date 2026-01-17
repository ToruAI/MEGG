# Maintain Tool

Analyze knowledge files for bloat, staleness, and duplicates.

## Requirements

### Requirement: Knowledge Analysis
The system SHALL scan all .megg directories and analyze their knowledge.md files for issues.

#### Scenario: Scan all megg directories
- **WHEN** maintain() is called
- **THEN** all .megg directories from current path downward SHALL be scanned
- **AND** total tokens and entries SHALL be counted

### Requirement: Bloat Detection
The system SHALL detect knowledge files that exceed the summary threshold (16k tokens).

#### Scenario: Detect bloated file
- **WHEN** knowledge.md exceeds 16,000 tokens
- **THEN** an issue with problem "bloated" SHALL be reported
- **AND** details SHALL include token count and entry count
- **AND** suggested action SHALL recommend consolidation or archiving

### Requirement: Staleness Detection
The system SHALL detect entries older than the staleness threshold (90 days by default).

#### Scenario: Detect stale entries
- **WHEN** entries have dates older than 90 days
- **THEN** an issue with problem "stale" SHALL be reported
- **AND** the count of stale entries SHALL be included
- **AND** suggested action SHALL recommend review and archiving

### Requirement: Duplicate Detection
The system SHALL detect topics with multiple entries that could be consolidated.

#### Scenario: Detect duplicate topics
- **WHEN** multiple entries share the same topic (3+ entries)
- **THEN** those entries SHALL be identified as consolidation candidates
- **AND** an issue with problem "duplicates" SHALL be reported if significant

### Requirement: Action Suggestions
The system SHALL generate actionable suggestions for resolving issues.

#### Scenario: Consolidation action
- **WHEN** bloat is detected with duplicate topics
- **THEN** "consolidate" actions SHALL be suggested
- **AND** entries to merge SHALL be listed

#### Scenario: Summarize action
- **WHEN** tokens exceed block threshold
- **THEN** "summarize" action SHALL be suggested
- **AND** target token count SHALL be indicated

#### Scenario: Archive action
- **WHEN** stale entries are found
- **THEN** "archive" action SHALL be suggested
- **AND** stale entries SHALL be listed with dates

### Requirement: Report Formatting
The system SHALL format the maintenance report with clear sections.

#### Scenario: Healthy report
- **WHEN** no issues are found
- **THEN** a success message SHALL indicate all files are healthy

#### Scenario: Issues report
- **WHEN** issues are found
- **THEN** report SHALL include Overview, Issues Found, and Suggested Actions sections
- **AND** issues SHALL be color-coded by severity (bloated=red, stale=yellow, duplicates=orange)

### Requirement: Overview Statistics
The system SHALL include summary statistics in the report.

#### Scenario: Report overview
- **WHEN** maintain() completes
- **THEN** report SHALL show number of directories scanned
- **AND** total tokens across all files
- **AND** total entries across all files
