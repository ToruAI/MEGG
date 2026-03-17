# Spec Instructions

Specs live in `.ai/specs/`. Read the relevant spec before implementing anything non-trivial.

When planning features or architectural changes, follow the `/openspec-workflow` skill:
write a draft spec in `.ai/changes/` first, then implement.

## Specs Index

| ID | File | What |
|----|------|------|
| SVC-001 | `service-context.md` | context() — load domain chain + knowledge + state |
| SVC-002 | `service-learn.md` | learn() — append knowledge entry |
| SVC-003 | `service-init.md` | init() — initialize or update .megg/ |
| SVC-004 | `service-maintain.md` | maintain() — scan knowledge health |
| SVC-005 | `service-state.md` | state() — ephemeral session handoff |
| SVC-006 | `service-setup.md` | setup() — one-time machine config |
