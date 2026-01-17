# Change: Add Session State for Cross-Session Handoff

## Why
Current megg captures permanent knowledge (decisions, patterns, gotchas) but has no mechanism for ephemeral session state. When an agent ends mid-task, the next session starts cold with no context about what was in progress. This is different from learning - it's about continuity, not wisdom.

## What Changes
- Add `state.md` file format for ephemeral session handoff
- Add `state()` MCP tool to capture/clear session state
- Add `/megg-state` skill for easy invocation
- Modify `context()` to load state.md alongside info + knowledge
- State auto-expires when marked "done" or after time threshold (48h default)
- Hard token limit (2k) to prevent bloat
- Update version from 2.0.0 to 1.1.0

## Impact
- Affected specs: `context` (modified), `state` (new)
- Affected code:
  - `src/commands/state.ts` (new)
  - `src/commands/context.ts` (load state)
  - `src/types.ts` (state types)
  - `src/index.ts` (register tool)
  - `package.json` (version bump)
  - `.claude/skills/megg-state.md` (new skill)

## Key Design Decisions

### State vs Knowledge
| Aspect | state.md | knowledge.md |
|--------|----------|--------------|
| Purpose | Session handoff | Permanent wisdom |
| Lifecycle | Overwritten each session | Accumulated over time |
| Size | Hard limit 2k tokens | Soft limits with summary |
| Expiry | Auto-expires (done/stale) | Never expires (needs maintain) |

### State File Format
```markdown
---
updated: 2026-01-17T10:30:00Z
status: active
---

## Working On
One-liner task description

## Progress
- What's done
- Current status

## Next
- Immediate actions

## Context
Files, blockers, pending decisions
```

### State Lifecycle
1. Agent works on task
2. User invokes `/megg-state` to capture handoff (or anytime mid-session)
3. Next session: `context()` loads state alongside info/knowledge
4. When task completes: `/megg-state clear` marks done
5. If stale (>48h) and status still "active": context() ignores it

### Skill Design: /megg-state
```
/megg-state         → Capture current session state (prompts agent to summarize)
/megg-state clear   → Mark state as done, clear it
/megg-state show    → Display current state
```

The skill prompts the agent to:
1. Summarize what was worked on
2. List progress and next steps
3. Note any relevant context
4. Call state() MCP tool with formatted content
