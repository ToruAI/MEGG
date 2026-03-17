---
id: SVC-004
type: service
status: active
severity: medium
issue: —
validated: 2026-03-17
---

# Maintain Tool

## What
Scan all `.megg/knowledge.md` files from current path downward and report health issues.
Read + report only — does NOT modify files (auto-fix is future work).

## Why
Knowledge files grow over time. Without maintenance, they hit token limits and block loading.

## Dependencies
- Reads: all `.megg/knowledge.md` files in subtree
- Complements: `context()` (which blocks at 16k tokens)

## How
1. Walk directory tree, collect all `.megg/` directories
2. For each `knowledge.md`:
   - Count tokens and entries
   - Detect **bloat**: > 16k tokens
   - Detect **stale**: entries older than 90 days
   - Detect **duplicates**: topics with 3+ entries (consolidation candidates)
3. Generate action suggestions per issue:
   - Bloat → consolidate or summarize
   - Stale → archive old entries
   - Duplicates → merge into single entry
4. Format report with overview stats + issues + suggested actions

## Invariants
- No files modified during maintain()
- Healthy report shown when zero issues found

## Test
- No issues → "all healthy" message
- Bloated file → issue reported with token count
- Stale entries → count reported with dates
- 3+ same-topic entries → consolidation suggested
- Overview always shows: dirs scanned, total tokens, total entries

## Changelog
- 2026-01-14: Initial
