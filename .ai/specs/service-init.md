---
id: SVC-003
type: service
status: active
severity: high
issue: —
validated: 2026-03-17
---

# Init Tool

## What
Initialize or update `.megg/` in a project directory.
Two modes: fresh init (no `.megg/` exists) and update (`.megg/` exists, `update: true`).

## Why
Agents need a guided way to create or refresh domain context without manual file editing.

## Dependencies
- Creates: `.megg/info.md`, optionally `.megg/knowledge.md`
- Used by: `/megg-remember` skill (for context updates)

## How

**Fresh init (no `.megg/` exists):**
1. Analyze project structure (detect type: codebase vs domain, key files, parent chain)
2. If called without `info` content → return questions for agent to ask user
3. If called with `info` content → create `.megg/info.md` + optional `knowledge.md`

**Update mode (`.megg/` exists, `update: true`):**
1. Read current `info.md`, parse sections
2. Calculate days since last update
3. Generate targeted questions per section (what changed, what's outdated)
4. When called with new content → overwrite `info.md`, preserve `created`, refresh `updated`

**Project type detection:**
- `package.json` / `Cargo.toml` / `go.mod` / `pyproject.toml` → `codebase`
- None of the above → `domain`

## Invariants
- `created` timestamp never overwritten on update
- Directory tree capped at 3 levels, skips `node_modules/.git/dist/build`

## Test
- Fresh: analysis phase returns questions, not files
- Fresh: creation phase creates files with frontmatter
- Update: returns section questions, not "already initialized"
- Update: `created` preserved, `updated` refreshed
- Codebase vs domain type correctly detected

## Changelog
- 2026-03-17: `already_initialized` replaced by `analyzeForUpdate()` (v1.2.0)
- 2026-01-14: Initial
