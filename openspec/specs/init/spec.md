# Init Tool

Initialize megg in a project directory.

## Requirements

### Requirement: Two-Phase Initialization
The system SHALL support a two-phase initialization: analysis without content (returns questions) and creation with content (creates files).

#### Scenario: Analysis phase
- **WHEN** init() is called without content parameter
- **THEN** the project SHALL be analyzed
- **AND** relevant questions SHALL be returned for the agent to ask

#### Scenario: Creation phase
- **WHEN** init(path, { info, knowledge }) is called with content
- **THEN** .megg directory SHALL be created
- **AND** info.md SHALL be created with provided content
- **AND** knowledge.md SHALL be created if knowledge content provided

### Requirement: Already Initialized Check
The system SHALL detect if megg is already initialized and return appropriate message.

#### Scenario: Already initialized
- **WHEN** init() is called and .megg/info.md already exists
- **THEN** status "already_initialized" SHALL be returned
- **AND** message SHALL suggest using context() instead

### Requirement: Project Structure Analysis
The system SHALL analyze project structure to detect type and key files.

#### Scenario: Detect codebase
- **WHEN** package.json, Cargo.toml, go.mod, or pyproject.toml exists
- **THEN** suggestedType SHALL be "codebase"

#### Scenario: Detect domain
- **WHEN** no code project files are found
- **THEN** suggestedType SHALL be "domain"

#### Scenario: Key files detection
- **WHEN** analyzing project structure
- **THEN** key files like README.md, package.json, Dockerfile SHALL be listed

### Requirement: Directory Tree Generation
The system SHALL generate an ASCII tree representation of project structure up to 3 levels deep.

#### Scenario: Tree depth limit
- **WHEN** generating project tree
- **THEN** depth SHALL be limited to 3 levels
- **AND** directories SHALL be prefixed with folder emoji
- **AND** files SHALL be prefixed with file emoji

#### Scenario: Skip ignored directories
- **WHEN** generating project tree
- **THEN** node_modules, .git, dist, build, etc. SHALL be skipped

### Requirement: Parent Chain Discovery
The system SHALL discover parent .megg directories for context inheritance information.

#### Scenario: Show parent chain
- **WHEN** parent .megg directories exist
- **THEN** they SHALL be listed in the analysis
- **AND** their domain names SHALL be shown

### Requirement: Context-Aware Questions
The system SHALL generate appropriate questions based on detected project type.

#### Scenario: Codebase questions
- **WHEN** project type is "codebase"
- **THEN** questions SHALL ask about project purpose, coding conventions, and learning targets

#### Scenario: Domain questions
- **WHEN** project type is "domain"
- **THEN** questions SHALL ask about domain context, rules, and learning targets

### Requirement: File Creation
The system SHALL create .megg directory and files with proper frontmatter.

#### Scenario: Create with frontmatter
- **WHEN** files are created
- **THEN** info.md SHALL have frontmatter with created, updated, and type fields
- **AND** knowledge.md SHALL have frontmatter with created, updated, and type fields

#### Scenario: Optional knowledge file
- **WHEN** knowledge content is not provided
- **THEN** knowledge.md SHALL NOT be created
