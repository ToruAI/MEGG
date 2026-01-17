# Tasks: Add Session State

## 1. Types and Core
- [x] 1.1 Add state types to `src/types.ts` (StateContent, StateResult, StateStatus)
- [x] 1.2 Add STATE_FILE_NAME constant to `src/utils/paths.ts`
- [x] 1.3 Update version in `package.json` from 2.0.0 to 1.1.0

## 2. State Command
- [x] 2.1 Create `src/commands/state.ts` with state() function
- [x] 2.2 Implement state parsing (frontmatter + content)
- [x] 2.3 Implement state writing with token limit enforcement
- [x] 2.4 Implement done/clear logic
- [x] 2.5 Implement staleness check (48h default)

## 3. Context Integration
- [x] 3.1 Modify `context()` to discover and load state.md
- [x] 3.2 Add state to ContextResult type
- [x] 3.3 Update formatContextForDisplay() to include state
- [x] 3.4 Update formatForSessionStartHook() to show state in loaded files

## 4. MCP Registration
- [x] 4.1 Register state tool in `src/index.ts`
- [x] 4.2 Add CLI command in `src/cli.ts`

## 5. Testing
- [x] 5.1 Add unit tests for state parsing
- [x] 5.2 Add unit tests for staleness detection
- [x] 5.3 Add unit tests for token limit enforcement
- [x] 5.4 Add integration test for context loading state

## 6. Skill
- [x] 6.1 Create `.claude/skills/megg-state.md` skill file
- [x] 6.2 Handle subcommands: (none), clear, show

## 7. Documentation
- [x] 7.1 Update project.md with state tool and skill
- [x] 7.2 Update README with /megg-state usage
