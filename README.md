# kspec — Spec-Driven Development for Kiro CLI

[![npm version](https://img.shields.io/npm/v/kspec.svg)](https://www.npmjs.com/package/kspec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Spec-driven development workflow for Kiro CLI with context management, verification at every step, and Jira integration.

## Why kspec?

AI coding assistants forget context, drift from requirements, and repeat mistakes. kspec solves this:

| Problem | kspec Solution |
|---------|---------------|
| **Context loss** | `CONTEXT.md` survives AI context compression |
| **Scope creep** | Specs define boundaries before coding |
| **No verification** | Verify at every step (spec → tasks → build) |
| **Lost learnings** | `memory.md` compounds knowledge across projects |
| **Enterprise silos** | Jira integration bridges BA/PM and developers |

Read the full [Methodology](docs/methodology.md) or see a complete [Example Walkthrough](docs/examples/todo-app/).

## Installation

```bash
npm install -g kspec
```

## Quick Start

```bash
kspec init                    # Interactive setup
kspec analyse                 # Analyse codebase
kspec spec "User Auth API"    # Create specification
kspec tasks                   # Generate tasks
kspec build                   # Execute with TDD
kspec verify                  # Verify implementation
kspec done                    # Complete & harvest memory
```

## Two Ways to Use kspec

### 1. CLI Mode (Outside kiro-cli)

Run kspec commands from your terminal:

```bash
kspec init
kspec spec "User Authentication"
kspec tasks
kspec build
```

### 2. Agent Mode (Inside kiro-cli) — Recommended

Stay inside your kiro-cli session and switch between specialized agents:

```
$ kiro-cli

> /agent swap kspec-spec
> Build a todo app with categories
  (agent creates spec.md, spec-lite.md, updates context)

> /agent swap kspec-tasks
  (reads CONTEXT.md → knows current spec → generates tasks)

> /agent swap kspec-build
  (reads CONTEXT.md → continues from current task)
```

This approach solves the **context loss problem** — agents read `.kspec/CONTEXT.md` automatically to restore state after context compression.

## Workflow

```
init → analyse → spec → verify-spec → tasks → verify-tasks → build → verify → done
```

## Commands

| Command | Description |
|---------|-------------|
| `kspec init` | Interactive setup (date format, execution mode) |
| `kspec analyse` | Analyse codebase, update steering docs |
| `kspec spec "Name"` | Create spec.md + spec-lite.md |
| `kspec verify-spec` | Verify spec covers requirements |
| `kspec tasks` | Generate tasks.md from spec |
| `kspec verify-tasks` | Verify tasks cover spec |
| `kspec build` | Execute tasks with TDD |
| `kspec verify` | Verify implementation matches spec |
| `kspec done` | Complete spec, harvest memory |
| `kspec context` | View/refresh context file |
| `kspec review` | Code review |
| `kspec list` | List all specs |
| `kspec status` | Current status |
| `kspec agents` | List available agents |
| `kspec update` | Check for updates |
| `kspec help` | Show help |

### Jira Integration (requires Atlassian MCP)

| Command | Description |
|---------|-------------|
| `kspec spec --jira PROJ-123,PROJ-456 "Feature"` | Create spec from Jira issues |
| `kspec sync-jira` | Create Jira issue from spec |
| `kspec sync-jira --update PROJ-123` | Update existing Jira issue |
| `kspec jira-subtasks` | Create Jira subtasks from tasks.md |
| `kspec jira-subtasks PROJ-123` | Create subtasks under specific issue |

## Context Management

kspec maintains context that survives AI context compression:

```
.kspec/CONTEXT.md (auto-generated)
├── Current Spec: 2026-01-24-user-auth
├── Task: 3/12 - Implement JWT validation
├── Requirements Summary (from spec-lite)
├── Decisions & Learnings
└── Jira Links (if integrated)
```

Agents read CONTEXT.md first, automatically restoring state after context compression.

```bash
kspec context    # View and refresh context manually
```

## Agents & Shortcuts

| Agent | Shortcut | Purpose |
|-------|----------|---------|
| kspec-analyse | Ctrl+Shift+A | Analyse codebase |
| kspec-spec | Ctrl+Shift+S | Create specifications |
| kspec-tasks | Ctrl+Shift+T | Generate tasks |
| kspec-build | Ctrl+Shift+B | Execute with TDD |
| kspec-verify | Ctrl+Shift+V | Verify spec/tasks/impl |
| kspec-review | Ctrl+Shift+R | Code review |
| kspec-jira | Ctrl+Shift+J | Jira integration |

Switch agents in kiro-cli: `/agent swap kspec-build` or use keyboard shortcuts.

## Structure

```
.kspec/
├── config.json           # User preferences (commit)
├── .current              # Current active spec path (local only)
├── CONTEXT.md            # Auto-generated context (local only)
├── memory.md             # Project learnings (commit)
└── specs/
    └── 2026-01-22-feature/
        ├── spec.md       # Full specification (commit)
        ├── spec-lite.md  # Concise (for context compression)
        ├── tasks.md      # Implementation tasks (commit)
        ├── memory.md     # Feature learnings (commit)
        └── jira-links.json # Jira issue links (commit)

.kiro/
├── steering/             # Project rules (commit)
├── agents/               # kspec-generated agents (commit)
└── mcp.json.template     # MCP config template (commit, no secrets)
```

## Team Collaboration

kspec is designed for team collaboration. Most files should be committed to share specifications, tasks, and guidelines across your team.

### What to Commit

| Path | Commit? | Why |
|------|---------|-----|
| `.kiro/steering/` | Yes | Shared product, tech, testing guidelines |
| `.kiro/agents/` | Yes | Consistent agent configurations |
| `.kiro/mcp.json.template` | Yes | MCP setup template (no secrets) |
| `.kspec/config.json` | Yes | Project preferences |
| `.kspec/specs/` | Yes | Specifications, tasks, memory |
| `.kspec/.current` | No | Personal working state |
| `.kspec/CONTEXT.md` | No | Auto-generated, local state |
| `~/.kiro/mcp.json` | N/A | Personal secrets in home directory |

### Setting Up MCP for Teams

`kspec init` creates `.kiro/mcp.json.template` which uses mcp-remote with OAuth (no API tokens needed):

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"],
      "timeout": 120000
    }
  }
}
```

Each team member copies to their settings:
```bash
mkdir -p ~/.kiro/settings
cp .kiro/mcp.json.template ~/.kiro/settings/mcp.json
```

Or add via CLI: `kiro-cli mcp add --name atlassian`

See [SECURITY.md](SECURITY.md) for security best practices.

## Jira Integration

Bridge the gap between BAs/PMs and developers by integrating with Jira via Atlassian MCP.

### Pull Requirements from Jira

```bash
kspec spec --jira PROJ-123,PROJ-456 "User Authentication"
```

This fetches issue details, extracts acceptance criteria, and creates a unified spec with source attribution.

### Push Specs to Jira

```bash
kspec sync-jira                      # Create new issue
kspec sync-jira --update PROJ-789    # Update existing issue
```

Create or update Jira issues with spec content for BA/PM review.

### Create Subtasks

```bash
kspec jira-subtasks PROJ-789
```

Generate Jira subtasks from tasks.md for progress tracking.

### Prerequisites

Configure Atlassian MCP using one of these methods:

**Option 1: Use kiro-cli** (recommended)
```bash
kiro-cli mcp add --name atlassian
```

**Option 2: Manual configuration**

Add to `.kiro/settings/mcp.json` (workspace) or `~/.kiro/settings/mcp.json` (user):

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"],
      "timeout": 120000
    }
  }
}
```

Or add via CLI: `kiro-cli mcp add --name atlassian`

See: https://kiro.dev/docs/cli/mcp/

See [Team Collaboration](#team-collaboration) for secure team setup with environment variables.

## Configuration

Set during `kspec init`:

- **Date format**: YYYY-MM-DD, DD-MM-YYYY, or MM-DD-YYYY
- **Auto-execute**: ask (default), auto, or dry-run

## Auto-Updates

kspec checks for updates automatically (cached for 24 hours). Check manually:

```bash
kspec update
```

Or check when viewing version:

```bash
kspec --version
```

## Requirements

- Node.js >= 18
- Kiro CLI or Amazon Q CLI
- Atlassian MCP (optional, for Jira integration)

## Documentation

- [Methodology](docs/methodology.md) — Why spec-driven development works
- [Example: Todo App](docs/examples/todo-app/) — Complete walkthrough with real files
- [SECURITY.md](SECURITY.md) — Secure MCP configuration and best practices

## License

MIT
