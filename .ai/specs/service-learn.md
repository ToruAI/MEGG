---
id: SVC-002
type: service
status: active
severity: high
issue: —
validated: 2026-03-17
---

# Learn Tool

## What
Append a structured knowledge entry to the nearest `.megg/knowledge.md`.
Does NOT read context — write-only operation.

## Why
Agents need a way to capture knowledge without overwriting or formatting manually.

## Dependencies
- Writes to: `.megg/knowledge.md` (nearest ancestor)
- Consumed by: `/megg-learn` skill, `/megg-remember` skill

## How
1. Find nearest `.megg/` by walking up tree
2. Create `knowledge.md` with frontmatter if it doesn't exist
3. Validate `type` ∈ `{rule, fact, decision, process}`
4. Normalize topics to lowercase
5. Append entry in standard format:
   ```
   ## YYYY-MM-DD - Title
   **Type:** rule|fact|decision|process
   **Topics:** tag1, tag2

   content...
   ```
6. Touch `updated` timestamp in frontmatter
7. Warn if file exceeds 12k tokens after write

## Invariants
- At least one topic required
- Invalid type always returns error (never silently accepted)
- Topics always lowercase

## Test
- Entry appended with correct format
- `knowledge.md` created if missing
- Invalid type returns error listing valid options
- Empty topics array returns error
- Size warning triggers at 12k tokens
- `updated` frontmatter always refreshed

## Changelog
- 2026-03-17: Types changed to rule/fact/decision/process (v1.2.0)
- 2026-01-14: Initial (types were decision/pattern/gotcha/context)
