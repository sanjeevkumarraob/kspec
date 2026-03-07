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
| **No verification** | Verify at every step (spec → design → tasks → build) |
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
kspec design                  # Create technical design (optional)
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
kspec design                       # optional — creates design.md
kspec tasks
kspec build
```

### 2. Agent Mode (Inside kiro-cli) — Recommended

Stay inside your kiro-cli session and switch between specialized agents. Every agent includes **pipeline navigation** suggesting the next step:

```
$ kiro-cli

> /agent swap kspec-spec
> Build a todo app with categories
  (agent creates spec.md, spec-lite.md, updates context)
  → Next: /agent swap kspec-design or /agent swap kspec-tasks

> /agent swap kspec-design
  (reads spec → creates design.md with architecture)
  → Next: /agent swap kspec-tasks

> /agent swap kspec-tasks
  (reads CONTEXT.md + design.md → generates tasks)
  → Next: /agent swap kspec-build

> /agent swap kspec-build
  (reads CONTEXT.md → continues from current task)
  → Next: /agent swap kspec-verify
```

This approach solves the **context loss problem** — agents read `.kiro/CONTEXT.md` automatically to restore state after context compression. You never need to exit kiro-cli; the full pipeline is available through agent swapping.

## Workflow

```
init → analyse → spec → verify-spec → design (optional) → tasks → verify-tasks → build → verify → done
```

## Commands

### Core Workflow

| Command | Description |
|---------|-------------|
| `kspec init` | Interactive setup (date format, execution mode, Jira project) |
| `kspec analyse` | Analyse codebase, update steering docs |
| `kspec spec "Name"` | Create spec.md + spec-lite.md |
| `kspec verify-spec` | Interactively review and shape spec with clarifying questions |
| `kspec design` | Create technical design from spec (optional) |
| `kspec verify-design` | Verify design against spec requirements |
| `kspec tasks` | Generate tasks.md from spec (uses design.md if present) |
| `kspec verify-tasks` | Verify tasks cover spec |
| `kspec build` | Execute tasks with TDD |
| `kspec verify` | Verify implementation matches spec |
| `kspec done` | Complete spec, harvest memory |

### Jira Integration (requires Atlassian MCP)

| Command | Description |
|---------|-------------|
| `kspec spec --jira PROJ-123,PROJ-456 "Feature"` | Create spec from Jira issues |
| `kspec sync-jira` | Smart sync — updates existing issue or creates new |
| `kspec sync-jira --create` | Force create new Jira issue |
| `kspec sync-jira --project SECOPS` | Create in specific project |
| `kspec sync-jira --update PROJ-123` | Update existing Jira issue |
| `kspec jira-pull` | Pull latest updates from linked Jira issues |
| `kspec jira-subtasks` | Create Jira subtasks from tasks.md |
| `kspec jira-subtasks PROJ-123` | Create subtasks under specific issue |

### Work Types (Abbreviated Pipelines)

| Command | Description |
|---------|-------------|
| `kspec fix "Bug description"` | Bug fix with TDD (spec→test→fix→verify) |
| `kspec refactor "What and why"` | Refactor code (no behavior change) |
| `kspec spike "Question"` | Time-boxed investigation (no code) |
| `kspec revise` | Revise spec from stakeholder feedback |
| `kspec demo` | Generate stakeholder walkthrough |
| `kspec estimate` | Assess complexity before building |

### Memory, Milestones & Observability

| Command | Description |
|---------|-------------|
| `kspec memory` | Show project memory |
| `kspec memory review` | AI-assisted memory review |
| `kspec memory prune` | Remove outdated entries |
| `kspec milestone list` | List milestones |
| `kspec milestone create <name>` | Create milestone |
| `kspec milestone add <name>` | Add current spec to milestone |
| `kspec milestone status <name>` | Show milestone progress |
| `kspec metrics` | Show timeline for current spec |

### Agentic Review Loop

| Command | Description |
|---------|-------------|
| `kspec review [target]` | Code review with agentic loop (if reviewers configured) |
| `kspec review --simple` | Quick review without loop |
| `kspec analyse` | Analyse codebase with review loop |
| `kspec analyse --no-review` | Skip review loop |
| `kspec build --review` | Build with agentic review loop |

### Other

| Command | Description |
|---------|-------------|
| `kspec refresh` | Regenerate spec-lite.md after editing spec.md |
| `kspec context` | View/refresh context file |
| `kspec list` | List all specs |
| `kspec status` | Pipeline-aware status with next step suggestion |
| `kspec agents` | List available agents |
| `kspec update` | Check for updates |
| `kspec help` | Show help |

## Work Types

Not everything needs the full spec pipeline. kspec provides entry points for different work types:

### Bug Fix
```bash
kspec fix "Login fails with special characters"
```
Or in kiro-cli:
```
> /agent swap kspec-fix
> Login fails when email contains + character. Error in auth.js line 42.
```

### Refactor
```bash
kspec refactor "Extract validation logic from controllers"
```
Or in kiro-cli:
```
> /agent swap kspec-refactor
> Extract all validation logic from route controllers into a shared validation middleware
```

### Spike (Investigation)
```bash
kspec spike "Can we migrate from REST to GraphQL?"
```
Or in kiro-cli:
```
> /agent swap kspec-spike
> Investigate feasibility of migrating our REST API to GraphQL
```

### Revise (Feedback Loop)
```bash
kspec revise    # revise current spec from feedback
```
Or in kiro-cli:
```
> /agent swap kspec-revise
> PM says we need to add OAuth support and remove the remember-me feature
```

### Demo (Stakeholder Walkthrough)
```bash
kspec demo      # generate walkthrough of current implementation
```

### Estimate (Complexity Assessment)
```bash
kspec estimate  # assess before committing to build
```

## Design Pipeline

The optional **design** step sits between `spec` and `tasks`, enabling technical architecture planning before implementation:

```bash
kspec spec "Payment Processing"    # Create spec
kspec design                       # Create design.md (architecture, data models, APIs)
kspec verify-design                # Verify design covers spec
kspec tasks                        # Generate tasks (uses design.md for ordering)
```

`design.md` includes:
- Architecture Overview
- Component Breakdown
- Data Models
- API Contracts
- Dependency Mapping
- Technical Decisions
- Risk Assessment

The design step is optional — run `kspec tasks` directly to skip it. When `design.md` exists, the tasks agent uses it for architecture guidance and dependency ordering.

## Interactive Spec Shaping

`kspec verify-spec` goes beyond simple PASS/FAIL verification. It interactively shapes your spec:

1. Reads your spec.md thoroughly
2. Asks 4-8 targeted clarifying questions with sensible defaults
3. Proposes assumptions: *"I assume X, is that correct?"*
4. Waits for your responses
5. Suggests specific updates to spec.md
6. Gets your confirmation before making changes

This ensures specs are complete and unambiguous before moving to design or tasks.

## Jira Pull Updates

Keep specs in sync with evolving Jira requirements:

```bash
kspec jira-pull
```

This fetches the latest state of all linked Jira issues, generates a **change report** showing new/modified criteria, status changes, and comments, then presents changes for your approval before modifying spec.md. Specs are never auto-updated.

## Agentic Review Loop

kspec implements a **devil's advocate** pattern for code review, using multiple AI CLI tools as reviewers.

### How It Works

1. **Doer** (kspec-review agent) performs the initial review
2. **Reviewer** (configured external CLIs) critiques the doer's work
3. **Loop** continues up to 3 rounds until approved or questions remain
4. **Human-in-the-loop** surfaces unresolved questions for your input

### Configure Reviewers

During `kspec init`, select which CLIs to use as reviewers:

- GitHub Copilot CLI (`copilot`)
- Gemini CLI (`gemini`)
- Claude Code CLI (`claude`)
- OpenAI Codex CLI (`codex`)
- Aider (`aider`)

Or configure manually in `.kiro/config.json`:

```json
{
  "reviewers": ["copilot", "claude", "gemini"]
}
```

### Usage

```bash
# Review recent changes (uses configured reviewers)
kspec review

# Review specific target
kspec review "src/auth/*.js"

# Quick review without agentic loop
kspec review --simple

# Build with review loop
kspec build --review
```

### Session Files

Review sessions are logged to `.kiro/sessions/` with full transcripts:

```
.kiro/sessions/review-pr-2026-03-04T20-29-38-940Z.md
```

Each session captures doer output, reviewer critiques, and final status (APPROVED, NEEDS_CHANGES, or NEEDS_HIL).

## Contracts (Beta)

Enforce structured outputs and non-negotiable checks in your spec. This prevents context loss and regression by ensuring specific files and patterns exist before verification proceeds.

Add a `## Contract` section to your `spec.md`:

```markdown
## Contract

\`\`\`json
{
  "output_files": ["package.json", "src/index.js"],
  "checks": [
    { "type": "contains", "file": "package.json", "text": "\"name\": \"my-app\"" }
  ]
}
\`\`\`
```

`kspec verify` will automatically validate these rules.

See [Contracts Documentation](docs/contracts.md) for full details.

## Powers

Powers are modular knowledge files that enhance AI agent capabilities. kspec ships with 5 powers:

| Power | Description |
|-------|-------------|
| [contract](powers/contract/) | Enforce structured outputs and checks in specs |
| [document](powers/document/) | Documentation best practices (README, CONTRIBUTING, CHANGELOG, ADRs) |
| [tdd](powers/tdd/) | Test-driven development patterns and workflows |
| [code-review](powers/code-review/) | Code review checklists and quality standards |
| [code-intelligence](powers/code-intelligence/) | Tree-sitter and LSP setup for enhanced AI assistance |

**In Kiro IDE:** Open the Powers panel and install from this repository's `powers/` directory.

**With kspec CLI:** Powers are reference documentation in the `powers/` directory. Agents can read them for context.

**Custom Powers:** Create your own in `powers/{name}/POWER.md` following the [Kiro power format](https://kiro.dev/docs/powers/create/).

## Context Management

kspec maintains context that survives AI context compression:

```
.kiro/CONTEXT.md (auto-generated)
├── Current Spec: 2026-01-24-user-auth
├── Progress: 3/12 tasks completed
├── Design: present / not yet created
├── Requirements Summary (from spec-lite)
├── Decisions & Learnings
├── Jira Links (if integrated)
└── Quick Commands (design, tasks, build, verify...)
```

Agents read CONTEXT.md first, automatically restoring state after context compression. CONTEXT.md is refreshed both before and after agent chat sessions.

```bash
kspec context    # View and refresh context (CLI)
```

Or refresh inline without leaving kiro-cli:

```
> /agent swap kspec-context
```

**Note:** There is no automatic hook for `/compact` — CONTEXT.md won't auto-refresh on context compaction. Use `kspec-context` agent or run `kspec context` after compacting.

## Agents & Shortcuts

| Agent | Shortcut | Purpose |
|-------|----------|---------|
| kspec-analyse | Ctrl+Shift+A | Analyse codebase, update steering |
| kspec-spec | Ctrl+Shift+S | Create specifications |
| kspec-design | Ctrl+Shift+D | Create technical design from spec |
| kspec-tasks | Ctrl+Shift+T | Generate tasks (uses design if present) |
| kspec-build | Ctrl+Shift+B | Execute tasks with TDD |
| kspec-verify | Ctrl+Shift+V | Verify spec/design/tasks/implementation |
| kspec-review | Ctrl+Shift+R | Code review (+ configured reviewers) |
| kspec-jira | Ctrl+Shift+J | Jira integration (pull, sync, subtasks) |
| kspec-fix | Ctrl+Shift+F | Fix bugs (abbreviated pipeline) |
| kspec-refactor | Ctrl+Shift+G | Refactor code (no behavior change) |
| kspec-spike | Ctrl+Shift+I | Investigate/spike (no code) |
| kspec-revise | Ctrl+Shift+E | Revise spec from feedback |
| kspec-demo | Ctrl+Shift+W | Generate stakeholder walkthrough |
| kspec-estimate | Ctrl+Shift+X | Assess complexity |
| kspec-context | Ctrl+Shift+C | Refresh CONTEXT.md inline |
| kspec-refresh | — | Generate AI summary of spec |

Switch agents in kiro-cli: `/agent swap kspec-build` or use keyboard shortcuts.

Every agent includes a **PIPELINE** section suggesting contextual next steps — so you can navigate the full workflow without leaving kiro-cli.

### Context Refresh After /compact

When you run `/compact` in kiro-cli, CONTEXT.md may become stale. Refresh it inline:

```
> /agent swap kspec-context
```

This regenerates CONTEXT.md with current spec progress without leaving your session.

## ACP (Agent Client Protocol)

ACP enables Kiro to work with JetBrains IDEs (IntelliJ, WebStorm, PyCharm) and Zed editor.

### JetBrains Setup

Create or edit `~/.jetbrains/acp.json`:

```json
{
  "agent_servers": {
    "Kiro Agent": {
      "command": "/full/path/to/kiro-cli",
      "args": ["acp"]
    }
  }
}
```

Replace `/full/path/to/kiro-cli` with the actual path (find with `which kiro-cli`). Restart your IDE after configuration.

Once ACP is configured, kspec agents work the same way as in Kiro IDE. Your `.kiro/agents/` configurations are loaded automatically.

See: https://kiro.dev/docs/cli/acp/

## Code Intelligence

Kiro includes built-in code intelligence powered by tree-sitter, with optional LSP integration for deeper analysis.

```
/code init      # Index your project
/code status    # Check indexing status
```

This enables structural code understanding (symbols, references, definitions) for 18 languages. See the [code-intelligence power](powers/code-intelligence/) for detailed setup and usage guide.

See: https://kiro.dev/docs/cli/code-intelligence/

## Structure

```
.kiro/
├── config.json           # User preferences (commit)
├── .current              # Current active spec path (local only)
├── CONTEXT.md            # Auto-generated context (local only)
├── memory.md             # Project learnings (commit)
├── specs/
│   └── 2026-01-22-feature/
│       ├── spec.md       # Full specification (commit)
│       ├── spec-lite.md  # Concise (for context compression)
│       ├── design.md     # Technical design (commit, optional)
│       ├── tasks.md      # Implementation tasks (commit)
│       ├── memory.md     # Feature learnings (commit)
│       ├── metadata.json # Spec type metadata (commit)
│       ├── metrics.json  # Pipeline timeline (commit)
│       ├── estimate.md   # Complexity estimate (commit, optional)
│       ├── demo.md       # Stakeholder walkthrough (commit, optional)
│       └── jira-links.json # Jira issue links (commit)
├── milestones/           # Milestone groupings (commit)
├── sessions/             # Review session logs (local only)
├── steering/             # Project rules (commit)
├── agents/               # kspec-generated agents (commit)
├── settings/mcp.json     # MCP config (local only)
└── mcp.json.template     # MCP config template (commit, no secrets)
```

## Team Collaboration

kspec is designed for team collaboration. Most files should be committed to share specifications, tasks, and guidelines across your team.

### What to Commit

| Path | Commit? | Why |
|------|---------|-----|
| `.kiro/config.json` | Yes | Project preferences |
| `.kiro/specs/` | Yes | Specifications, designs, tasks, memory |
| `.kiro/steering/` | Yes | Shared product, tech, testing guidelines |
| `.kiro/agents/` | Yes | Consistent agent configurations |
| `.kiro/mcp.json.template` | Yes | MCP setup template (no secrets) |
| `.kiro/memory.md` | Yes | Project learnings |
| `.kiro/.current` | No | Personal working state |
| `.kiro/CONTEXT.md` | No | Auto-generated, local state |
| `.kiro/sessions/` | No | Review session logs |
| `.kiro/settings/` | No | Local MCP config |
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
kspec sync-jira                      # Smart: updates existing or creates new
kspec sync-jira --create             # Force create new issue
kspec sync-jira --project SECOPS     # Create in specific project
kspec sync-jira --update PROJ-789    # Update specific issue
```

`sync-jira` is smart — it checks `jira-links.json` for an existing linked issue and updates it by default. Use `--create` to force a new issue.

### Pull Latest Updates

```bash
kspec jira-pull
```

Fetches the latest state of linked Jira issues, generates a change report, and presents changes for approval before modifying spec.md.

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

## Migrating from v1

kspec v2.0 consolidates everything into `.kiro/` (previously split between `.kspec/` and `.kiro/`).

When you run any kspec command, it will automatically detect `.kspec/` and offer to migrate:

```
$ kspec status

  kspec v2.0 Migration

  kspec now stores everything under .kiro/ instead of .kspec/

  Files to migrate:
    - config.json
    - specs/ (3 specs)

  Migrate .kspec/ to .kiro/ now? (Y/n):
```

Migration moves `config.json`, `.current`, `CONTEXT.md`, `memory.md`, and `specs/` from `.kspec/` to `.kiro/`, then removes the empty `.kspec/` directory.

## Configuration

Set during `kspec init`:

- **Date format**: YYYY-MM-DD, DD-MM-YYYY, or MM-DD-YYYY
- **Auto-execute**: ask (default), auto, or dry-run
- **Model**: AI model for agents (claude-sonnet-4.6, claude-opus-4.6, claude-haiku-4.5, or custom)
- **Jira project**: Default project key for `sync-jira` (when Atlassian MCP detected)
- **Reviewers**: Multi-CLI reviewers for agentic review loop (Copilot, Claude, Gemini, etc.)

### File Locking

`kspec build` uses file locking to prevent concurrent builds on the same spec. If another build is running, you'll see an error with the PID and lock time. Locks auto-expire after 30 minutes if the process crashes.

## Auto-Updates

kspec checks for updates automatically (cached for 24 hours). Check manually:

```bash
kspec update
```

Or check when viewing version:

```bash
kspec --version
```

## Known Limitations

| Limitation | Workaround |
|------------|------------|
| **No `/compact` hook** | CONTEXT.md doesn't auto-refresh on context compaction. Run `/agent swap kspec-context` or `kspec context` manually. |
| **spec-lite.md auto-update is truncation** | `truncateSpecLite()` truncates spec.md (not AI summary). Run `kspec refresh` or `/agent swap kspec-refresh` for AI-generated summary. |

## Requirements

- Node.js >= 18
- Kiro CLI or Amazon Q CLI
- Atlassian MCP (optional, for Jira integration)

## Documentation

- [Methodology](docs/methodology.md) — Why spec-driven development works
- [Example: Todo App](docs/examples/todo-app/) — Complete walkthrough with real files
- [Contracts](docs/contracts.md) — Enforce structured outputs in specs
- [CHANGELOG](CHANGELOG.md) — Version history and release notes
- [SECURITY.md](SECURITY.md) — Secure MCP configuration and best practices

## License

MIT
