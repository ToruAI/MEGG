# megg

> **Git-native, contextual memory infrastructure that lives directly in your codebase.**

**megg** turns stateless AI agents into long-term employees. It provides a standardized way for agents to read, store, and manage context directly within your project's folder structure.

Every session is fresh, but with megg, your agent remembers.

## ⚡️ Quick Start

### 1. Configure (Claude Desktop / MCP Client)
You can run `megg` directly using `npx`—no installation required.

Add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "megg": {
      "command": "npx",
      "args": ["-y", "megg@latest"]
    }
  }
}
```

### 3. Instruct Your Agent
Add this to your system prompt:
> **Memory/Context:**
> You have access to `megg`, a memory tools suite.
> - At session start, call `megg.awake()` to orient yourself.
> - When entering a new directory, call `megg.recall(path)`.
> - If you make a significant decision, call `megg.remember(path, content)`.

---

## 📚 Documentation

- [**User Manual**](docs/MANUAL.md): How to structure memory, best practices, and the "Good Employee" philosophy.
- [**API Reference**](docs/API.md): Detailed documentation of the MCP tools (`awake`, `recall`, `settle`, etc.).
- [**Design**](docs/DESIGN.md): The core philosophy and architecture.

## 🏗️ How It Works

megg inserts `.megg/` directories at key boundaries in your project (e.g., root, `src/`, `api/`).

```
project/
├── .megg/              # Root memory
│   ├── info.md         # Identity & Rules
│   └── map.md          # Navigation (auto-generated)
├── src/
│   ├── api/
│   │   ├── .megg/      # API memory
│   │   │   ├── info.md
│   │   │   └── decisions.md
```

When an agent calls `recall("src/api")`, it receives the full **chain of context**:
1. Root `info.md` (Identity)
2. Src `info.md` (General conventions)
3. API `info.md` (Specific rules)

This ensures the agent always has the right context for the task at hand.
