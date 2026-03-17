---
id: SVC-005
type: service
status: active
severity: medium
issue: —
validated: 2026-03-17
---

# State Tool

## What
Read, write, or clear ephemeral session state in `.megg/state.md`.
State expires after 48h or when explicitly cleared.

## Why
Context is lost between sessions. State bridges the gap for in-progress work without polluting knowledge.md.

## Dependencies
- Writes to: `.megg/state.md` (nearest ancestor)
- Consumed by: `context()` (loads active state automatically)
- Used by: `/megg-state` skill

## How

**Read** (no args):
- Return content, status, updated timestamp, token count
- If expired (>48h or status:done) → return with `expired: true`
- If no file → return null state

**Write** (content provided):
- Create/overwrite `state.md` with content
- Set `status: active`, `updated: now`
- Truncate to 2k token limit, include warning if truncated

**Clear** (status: "done"):
- Delete `state.md`
- Return success confirmation

## Invariants
- State content never exceeds 2k tokens
- Expired state never surfaced in `context()` output
- Clear always deletes the file (not just sets status)

## Test
- Read active state returns content + metadata
- Read expired state returns `expired: true`
- Read with no file returns null
- Write creates/overwrites with active status
- Content truncated at 2k tokens with warning
- Clear deletes file entirely

## Changelog
- 2026-01-17: Initial
