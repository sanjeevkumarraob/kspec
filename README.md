# kspec — Spec-Driven Development for Kiro CLI

[![npm version](https://img.shields.io/npm/v/kspec.svg)](https://www.npmjs.com/package/kspec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Spec-driven development workflow for Kiro CLI with context management, verification at every step, and Jira integration.

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

**Problem**: API tokens should never be committed, but teams need consistent MCP configuration.

**Solution**: Use environment variables with a committed template.

1. Commit a template file (`.kiro/mcp.json.template`):
   ```json
   {
     "mcpServers": {
       "atlassian": {
         "command": "npx",
         "args": ["-y", "@anthropic/mcp-atlassian"],
         "env": {
           "ATLASSIAN_HOST": "${ATLASSIAN_HOST}",
           "ATLASSIAN_EMAIL": "${ATLASSIAN_EMAIL}",
           "ATLASSIAN_API_TOKEN": "${ATLASSIAN_API_TOKEN}"
         }
       }
     }
   }
   ```

2. Each team member creates their personal config:
   ```bash
   # Copy template to home directory
   mkdir -p ~/.kiro && chmod 700 ~/.kiro
   cp .kiro/mcp.json.template ~/.kiro/mcp.json
   chmod 600 ~/.kiro/mcp.json

   # Edit with real credentials
   nano ~/.kiro/mcp.json
   ```

3. Or use environment variables directly:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export ATLASSIAN_HOST="https://your-domain.atlassian.net"
   export ATLASSIAN_EMAIL="your-email@example.com"
   export ATLASSIAN_API_TOKEN="your-api-token"
   ```

See [SECURITY.md](SECURITY.md) for detailed security best practices.

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

`kspec init` creates `.kiro/mcp.json.template` automatically. To enable Jira integration:

```bash
# Copy template to your home directory (keeps secrets out of repo)
mkdir -p ~/.kiro && chmod 700 ~/.kiro
cp .kiro/mcp.json.template ~/.kiro/mcp.json
chmod 600 ~/.kiro/mcp.json

# Edit with your real credentials
nano ~/.kiro/mcp.json
```

Replace the `${...}` placeholders with your actual values:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-atlassian"],
      "env": {
        "ATLASSIAN_HOST": "https://your-domain.atlassian.net",
        "ATLASSIAN_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

Get your API token: https://id.atlassian.com/manage-profile/security/api-tokens

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

## Security

See [SECURITY.md](SECURITY.md) for:
- Secure MCP configuration with environment variables
- API token best practices
- Git repository safety guidelines

## License

MIT
