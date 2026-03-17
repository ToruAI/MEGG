---
id: SVC-001
type: service
status: active
severity: critical
issue: —
validated: 2026-03-17
---

# Context Tool

## What
Load full context chain (info.md hierarchy + knowledge + state) for a given path.
Does NOT write anything — read-only operation.

## Why
Agents are stateless. Without context(), every session starts from zero.

## Dependencies
- Consumes: `.megg/info.md`, `.megg/knowledge.md`, `.megg/state.md`
- Consumed by: SessionStart hook, all other tools (for path discovery)

## How
1. Walk up directory tree, collect all `.megg/` ancestors
2. Load each `info.md` in order (root → deepest) — builds domain chain
3. Load `knowledge.md` from deepest `.megg/` with size-aware behavior:
   - < 8k tokens → full load
   - 8k–16k tokens → summary + topic index
   - > 16k tokens → blocked, instruct to run `maintain()`
4. If `topic` param provided → filter entries, bypass token limits
5. Load `state.md` if active (not expired, status ≠ done, updated < 48h ago)
6. List siblings and subdomains for navigation
7. Warn if `info.md` updated > 30 days ago (stale warning)

## Invariants
- Domain chain always root-first
- Blocked knowledge never partially loads
- Expired state never included

## Test
- Multi-level hierarchy loads all ancestors in order
- No `.megg` found → empty chain, no error
- Full/summary/blocked based on token thresholds
- Topic filter bypasses token limits
- Stale warning shown when info.md > 30 days old
- Active state included; expired/done state excluded
- `--json` flag formats for SessionStart hook

## Changelog
- 2026-03-17: Add stale info.md warning (v1.2.0)
- 2026-01-17: Add state loading
- 2026-01-14: Initial
