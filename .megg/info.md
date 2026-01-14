---
created: 2026-01-14T22:14:23.455Z
updated: 2026-01-14T22:14:23.455Z
type: context
---

# megg

## Context
Memory system for AI agents. Turns stateless agents into 'good employees' that remember context across sessions.

**Version:** 2.0.0
**Stack:** TypeScript, MCP SDK, Node.js
**Status:** Active development

## Rules
1. Domain hierarchy for bounded contexts, NOT code folders
2. Single knowledge.md per domain (no fragmentation)
3. Entry types: decision, pattern, gotcha, context
4. Size thresholds: 8k full, 16k summary, >16k blocked
5. Topics for categorization (not folder paths)
6. Backward compatible - old tools work but deprecated

## Memory Files
- knowledge.md: architecture decisions, implementation patterns, gotchas
