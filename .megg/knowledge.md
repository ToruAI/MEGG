---
created: 2026-01-14T22:13:24.420Z
updated: 2026-01-14T22:13:58.764Z
type: knowledge
---

# Knowledge


---

## 2026-01-14 - megg v2 Architecture Redesign
**Type:** decision
**Topics:** megg, architecture, tools, simplification

## Summary
Simplified megg from 9 tools to 4 core tools:

**New Tools:**
- `context(path?, topic?)` - replaces awake, recall, map, get
- `learn(title, type, topics, content)` - replaces remember
- `init()` - replaces init + init_finalize
- `maintain()` - replaces settle, modify_rules

**Key Design Decisions:**

1. **Domain hierarchy, not code folders** - .megg for bounded contexts (clients, products), not src/api/auth
2. **Single knowledge file** - All learnings go to knowledge.md with type + topics
3. **Size-aware loading** - Full (<8k), summary (8-16k), blocked (>16k tokens)
4. **Auto-discovery** - context() walks up/down to find .megg chain
5. **Hooks integration** - SessionStart auto-loads context, Stop suggests learning capture
6. **Entry types** - decision, pattern, gotcha, context

**Entry Format:**
```
## YYYY-MM-DD - Title
**Type:** decision|pattern|gotcha|context
**Topics:** tag1, tag2
Content...
```

**Thresholds:**
- 8000 tokens: full load limit
- 16000 tokens: summary limit (blocked above)
- 90 days: staleness threshold

---

## 2026-01-14 - megg v2 Implementation Structure
**Type:** pattern
**Topics:** megg, implementation, structure, files

## File Structure

```
src/
├── types.ts              # All TypeScript types
├── index.ts              # MCP server (v2 + legacy compatibility)
├── cli.ts                # CLI entry point
├── commands/
│   ├── context.ts        # Main workhorse - loads chain + knowledge
│   ├── learn.ts          # Add knowledge entries
│   ├── init.ts           # Initialize megg (single command)
│   └── maintain.ts       # Cleanup + consolidation
├── utils/
│   ├── files.ts          # File I/O
│   ├── format.ts         # Frontmatter formatting
│   ├── paths.ts          # Discovery (findAncestorMegg, findSiblingMegg, etc.)
│   ├── tokens.ts         # Token estimation (~4 chars/token)
│   └── knowledge.ts      # Parsing, summarization, filtering

hooks/
├── hooks.json            # Claude Code plugin hooks
├── session-start.sh      # Shell script for hook
└── README.md
```

## Key Functions

- `findAncestorMegg(path)` - walks UP to find .megg chain
- `findSiblingMegg(path)` - finds peer domains
- `findChildMegg(path)` - finds subdomains
- `parseKnowledge(content)` - extracts entries with type/topics
- `generateSummary(parsed)` - creates summary when >8k tokens
- `filterByTopic(parsed, topic)` - filters entries by topic

---

## 2026-01-14 - Claude Code Hooks Integration
**Type:** pattern
**Topics:** megg, hooks, claude-code, automation

## SessionStart Hook
Auto-loads context when session starts.

```json
{
  "SessionStart": [{
    "matcher": "startup|resume",
    "hooks": [{
      "type": "command",
      "command": "node /path/to/megg/build/cli.js context --json",
      "timeout": 10
    }]
  }]
}
```

Output format for hook (JSON with additionalContext):
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "## Domain Chain\n..."
  }
}
```

## Stop Hook (Prompt-based)
Suggests capturing learnings at session end.

```json
{
  "Stop": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "Review session. If significant decisions/patterns/gotchas, suggest learn(). If routine, allow stop.",
      "timeout": 30
    }]
  }]
}
```

## MCP Config
Use local build for development:
```
claude mcp add --scope user megg -- node /path/to/MEGG/build/index.js
```

---

## 2026-01-14 - Domain vs Code Folder Hierarchy
**Type:** gotcha
**Topics:** megg, hierarchy, domains, organization

## The Trap
Don't create .megg for code folders like src/api/auth - this fragments knowledge and creates placement confusion.

## Correct Approach
Use .megg for **bounded contexts** (domains):
- ✅ ToruAI/.megg (company)
- ✅ TORIS/.megg (product)
- ✅ klienci/ACTIVE/termet/.megg (client)

NOT for code paths:
- ❌ src/.megg
- ❌ src/api/.megg
- ❌ src/api/auth/.megg

## Why
- Decisions like 'auth pattern' don't belong to a folder
- Use **topics** in knowledge.md instead of folder hierarchy
- Topics: auth, api, security - searchable and filterable
