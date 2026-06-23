# kspec — Spec-Driven Development for Kiro CLI

[![npm version](https://img.shields.io/npm/v/kspec.svg)](https://www.npmjs.com/package/kspec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Spec-driven development workflow for Kiro CLI with context management, verification at every step, and Jira integration.

## What's new in 2.3.0

| Area | What you get |
|---|---|
| **Kiro V3 early access** | `kspec engine set v3` generates Markdown agents, capability permissions, and standalone V3 hooks; V2 remains the default |
| **Native specs** | New V3 work uses `requirements.md`; legacy `spec.md` remains supported and can be converted with `kspec migrate-spec` |
| **Reliable active context** | Every custom agent and `/kspec-*` skill resolves `.kiro/.current`, refreshes `CONTEXT.md` through kspec, and reads active artifacts |
| **Lean prompts** | Historical `.kiro/specs/**/*.md` files are no longer loaded into every agent request |
| **Current CLI support** | Persistent model inheritance, `--effort`, `KIRO_HOME`, official installer URL, and explicit V2 CI |

See [CHANGELOG](CHANGELOG.md#230--2026-06-23) for the full release notes.

## What's new in 2.2.0

| Area | What you get |
|---|---|
| **Enterprise governance** | `kspec init --enterprise` (or `KSPEC_ENTERPRISE=1`) — single opt-in prompt that scaffolds an MCP-registry / model-registry / IdP / prompt-logging governance steering doc auto-loaded into every agent prompt |
| **CI/headless mode** | `kspec init --ci` scaffolds `.github/workflows/kspec-review.yml` running `kspec review --no-interactive` on every PR + a CI hooks preset (preToolUse audit + destructive-command block) |
| **Least-privilege agents** | Every agent now ships with `toolsSettings`: write paths scoped per-role, shell commands allow/denylisted, secrets/git/`node_modules` always-denied, explicit `subagent.availableAgents` delegation graph |
| **Kiro Agent Skills** | 5 SKILL.md files (`/kspec-spec`, `/kspec-build`, `/kspec-review`, `/kspec-verify`, `/kspec-jira`) — auto-become slash commands in CLI 2.1+ default chat |
| **All-MCP injection** | `kspec-spec` and the spec/build/review pipeline now see every configured MCP (not just Atlassian) — `@github`, `@confluence`, `@slack`, etc. |
| **`kspec sync-agents`** | Refresh agent JSON + IDE markdown after adding a new MCP — no full `kspec init` re-run |
| **IDE chat subagents** | Optional `.md` agent files alongside `.json` so Kiro IDE chat can use kspec workflows |
| **Smart steering** | `inclusion: fileMatch` so `api-standards.md`, `frontend.md`, `backend.md` only auto-load when matching files are touched. Existing `inclusion_mode` files migrated transparently |

See [CHANGELOG](CHANGELOG.md#220) for the full release notes.

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
  (agent creates requirements.md on V3 or spec.md on V2, plus spec-lite.md)
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
| `kspec init` | Interactive setup (date format, execution mode, Jira project, enterprise opt-in) |
| `kspec init --enterprise` | Skip the prompt — go straight into governance setup (MCP/model registries, IdP, prompt logging) |
| `kspec init --ci` | Setup with GitHub Actions workflow + CI hooks preset (audit + destructive-block) |
| `kspec sync-agents` | Refresh agent JSON/markdown after adding a new MCP server (idempotent) |
| `kspec engine status` | Show the selected engine and detected Kiro CLI version |
| `kspec engine set v2\|v3 [--dry-run]` | Validate, back up, and regenerate agents/hooks for one engine |
| `kspec use <spec>` | Select the active spec and refresh deterministic context |
| `kspec migrate-spec <spec> [--dry-run] [--yes]` | Reversibly convert legacy `spec.md` to native `requirements.md` |
| `kspec analyse` | Analyse codebase, update steering docs |
| `kspec spec "Name"` | Create active-engine requirements + spec-lite.md |
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

## Enterprise Governance

For teams operating under SOC2, regulated environments, or any org with central control over MCP/model usage. **All four governance settings are off by default**: kspec asks once during `kspec init` whether to configure them, and the prompt only fires when you opt in.

### How to enable

```bash
# Option 1 — opt in interactively
kspec init
> Configure enterprise governance? (MCP/model registries, prompt logging, IdP) (y/N): y

# Option 2 — flip the prompt default to Yes for the whole org
export KSPEC_ENTERPRISE=1   # in dev container / shell init
kspec init                  # prompt now defaults Y, devs can still opt out per-project

# Option 3 — non-interactive (CI / org templates)
kspec init --enterprise
```

### What it configures

| Setting | What it does | Why it matters |
|---|---|---|
| **MCP registry URL** | Admin-hosted JSON allow-list of approved MCP servers. Kiro fetches it every 24h and auto-revokes unapproved servers | Central fleet control, automatic revocation |
| **Model registry URL** | Admin-hosted approved-models list. Off-policy `model:` fields get rewritten to the org default | Cost control + regulatory model whitelisting |
| **Identity provider** | Okta / Microsoft Entra ID / AWS IAM Identity Center / Other | Required for the above governance features |
| **Prompt logging** | Documents (in steering) that prompts are recorded by Kiro for SOC2 / regulatory audit | Surfaces "don't paste secrets" guidance to every agent |

### What it ships

Opting in writes `.kiro/steering/enterprise-governance.md` with `inclusion: always`, so every agent loads it as context. It substitutes your registry URLs and IdP into the doc and reminds agents to:

- Cite governance gaps in spec output instead of silently ignoring them
- Surface model/MCP needs as questions rather than guessing
- Treat `audit.log` and `.kiro/sessions/` as evidence (don't delete)

See [Kiro enterprise governance docs](https://kiro.dev/docs/cli/enterprise/governance/mcp/) for the upstream feature spec.

## CI/CD Integration

`kspec init --ci` scaffolds two things so kspec runs on every PR:

### 1. GitHub Actions workflow

Drops `.github/workflows/kspec-review.yml`:

```yaml
name: kspec review
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  kspec-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: curl -fsSL https://cli.kiro.dev/install | bash
      - run: npm install -g kspec
      - env: { KIRO_API_KEY: ${{ secrets.KIRO_API_KEY }} }
        run: kspec review --engine v2 --simple --trust-tools=read,shell --no-interactive
      # ...posts review as PR comment via actions/github-script
```

You only need to add `KIRO_API_KEY` as a repo secret — everything else is wired up.

### 2. CI hooks preset

V2 hooks are embedded in generated agent profiles; V3 uses `.kiro/hooks/kspec.json`. They refresh context on agent/session start and apply the destructive-command guard before shell execution. The generated headless CI workflow remains explicitly V2.

Powered by Kiro CLI 2.0+ headless mode (`--no-interactive`, `KIRO_API_KEY`, `--trust-tools`). See [Kiro headless docs](https://kiro.dev/docs/cli/headless/).

## Agent Skills (Kiro CLI 2.1+)

In addition to the JSON custom agents (`/agent swap kspec-spec`), kspec ships **Agent Skills** as `.kiro/skills/<name>/SKILL.md`. In Kiro CLI 2.1+ these auto-become slash commands in the **default** chat agent — no `/agent swap` required.

```
> /kspec-spec
> Build a payment processing feature
  (clarifies → active requirements → spec-lite.md)

> /kspec-build
  (executes tasks with strict TDD)

> /kspec-review
  (multi-CLI parallel review)
```

5 skills shipped: `kspec-spec`, `kspec-build`, `kspec-review`, `kspec-verify`, `kspec-jira`. Created when you answer `Y` to "Create Kiro Agent Skills?" during `kspec init` (default Yes). See [Kiro skills docs](https://kiro.dev/docs/cli/skills/).

Every skill reads `.kiro/.current`, refreshes through `kspec context --stdout`, reads `.kiro/CONTEXT.md`, and then loads the active requirements/tasks. Skills never write `CONTEXT.md` directly.

## Agent Permissions (Least-Privilege)

V2 agents use `toolsSettings`; V3 Markdown agents use capability-based `permissions`. Both retain the same role-based filesystem, shell, MCP, secret, and subagent boundaries.

| Agent type | Write paths | Shell scope |
|---|---|---|
| State-only (analyse, context, refresh, jira, demo, estimate) | `.kiro/**` | none |
| Spec pipeline (spec, design, tasks, revise, spike) | `.kiro/**` (+ `AGENTS.md` for spec) | none |
| Verifiers (verify, review) | `.kiro/**` | read-only commands + test runners |
| Code-modifying (build, fix, refactor) | `.kiro/**`, `src/**`, `lib/**`, `test/**`, `*.ts/.js/.py/.go/.rs`, ... | npm/pnpm/yarn, pytest, go test, cargo, git status/diff/add/commit |

**Universal denylist** (all agents): `.env*`, `**/secrets/**`, `**/credentials/**`, `*.pem`, `*.key`, `.git/**`, `node_modules/**`, `vendor/**`, `dist/**`, `build/**`.

**Shell denylist** (build/verify/review): `rm -rf`, `git push`, `git reset --hard`, `sudo`, `curl`, `wget`, `npm publish`, `pip install`, `apt`.

**Subagent delegation graph** — every agent declares an explicit `availableAgents` list (e.g. `kspec-build → [verify, review, fix]`, `kspec-verify → []` terminal). Makes the call graph auditable and admin-restrictable. See [Kiro custom agents reference](https://kiro.dev/docs/cli/custom-agents/configuration-reference/).

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

## Steering Documents

Steering files in `.kiro/steering/` are project rules that agents load as context. kspec ships 7 templates with [Kiro-native `inclusion`](https://kiro.dev/docs/cli/steering/) modes:

| File | Inclusion | When it loads |
|---|---|---|
| `product.md` | `always` | Every prompt |
| `tech.md` | `always` | Every prompt |
| `testing.md` | `always` | Every prompt |
| `security.md` | `always` | Every prompt |
| `api-standards.md` | `fileMatch` | When `**/api/**`, `**/routes/**`, `**/handlers/**`, `**/controllers/**` files are touched |
| `frontend.md` | `fileMatch` | When `**/*.tsx`, `**/*.jsx`, `**/components/**`, `**/styles/**`, `**/*.css` files are touched |
| `backend.md` | `fileMatch` | When `**/server/**`, `**/services/**`, `**/db/**`, `**/migrations/**` files are touched |

`fileMatch` keeps context small in monorepos — frontend rules don't pollute backend agent prompts.

### Non-destructive merge

If a steering file already exists (e.g. from base Kiro IDE init), `kspec init` merges instead of overwriting:

- Missing H2 sections are appended with a `<!-- added by kspec -->` marker
- Missing frontmatter keys are added; existing values never overwritten
- Files outside the 7 known templates are left fully untouched

Legacy `inclusion_mode: on_demand` files are auto-migrated to `inclusion: auto` on next init.

## Context Management

kspec maintains a deterministic active-work snapshot regenerated from source artifacts:

```
.kiro/CONTEXT.md (auto-generated, max 8 KiB)
├── Active spec, format, phase, type, milestone
├── Nested task progress, current chunk and task
├── Design and Jira status
├── Requirements summary and recent decisions
└── Next action
```

Every custom agent and `/kspec-*` Agent Skill resolves `.kiro/.current`, runs `kspec context --stdout`, reads `CONTEXT.md`, and then reads the active requirements and tasks. Source artifacts remain authoritative, and kspec is the only writer of `CONTEXT.md`.

```bash
kspec context             # Refresh and view context
kspec context --stdout    # Hook/agent-safe output without the footer
kspec use <spec>          # Select the active spec
```

Or refresh inline without leaving kiro-cli:

```
> /agent swap kspec-context
```

Compaction creates a new Kiro session and reloads persistent resources. Session-start hooks and the Agent Skill preflight regenerate the snapshot before it is consumed.

### Native Kiro session controls

kspec does not wrap controls Kiro already provides:

- [`/goal`](https://kiro.dev/changelog/cli/2-7/) runs an iterative, completion-checked loop for longer work.
- [Queue steering](https://kiro.dev/docs/cli/chat/queue-steering/) redirects active work at the next tool boundary; `Ctrl+S` toggles steer/queue behavior.
- [`/rewind`](https://kiro.dev/docs/cli/chat/rewind/) branches from an earlier turn without changing the original session.
- [`/transcript save`](https://kiro.dev/changelog/cli/2-6/) exports the current conversation as Markdown, plaintext, or JSON.

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

Kiro compaction creates a new session and reloads resources. The session-start hook refreshes context automatically. You can also refresh it explicitly:

```
> /agent swap kspec-context
```

The context agent delegates to `kspec context --stdout`; it never writes its own alternate snapshot format.

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
│       ├── requirements.md # Kiro V3 requirements (commit)
│       ├── spec.md       # Legacy requirements (supported)
│       ├── contract.json # V3 structured output contract (optional)
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
├── steering/             # Project rules — incl. enterprise-governance.md if --enterprise (commit)
├── agents/               # Active engine agents — V2 *.json or V3 *.md (commit)
├── skills/               # Kiro Agent Skills — /<name> slash commands in default chat (commit)
├── hooks/                # V3 versioned lifecycle hooks (commit)
├── settings/
│   └── mcp.json          # MCP config (local only)
└── mcp.json.template     # MCP config template (commit, no secrets)
```

When `kspec init --ci` is used, also creates:

```
.github/workflows/kspec-review.yml   # Headless review on every PR (commit)
```

## Team Collaboration

kspec is designed for team collaboration. Most files should be committed to share specifications, tasks, and guidelines across your team.

### What to Commit

| Path | Commit? | Why |
|------|---------|-----|
| `.kiro/config.json` | Yes | Project preferences (incl. enterprise + ideAgents + skills flags) |
| `.kiro/specs/` | Yes | Specifications, designs, tasks, memory |
| `.kiro/steering/` | Yes | Shared product, tech, testing guidelines (+ enterprise-governance.md if `--enterprise`) |
| `.kiro/agents/` | Yes | Active-engine agents — V2 JSON or V3 Markdown |
| `.kiro/hooks/` | Yes | Versioned V3 lifecycle hooks |
| `.kiro/skills/` | Yes | Kiro Agent Skills — `/<name>` slash commands |
| `.kiro/mcp.json.template` | Yes | MCP setup template (no secrets) |
| `.kiro/memory.md` | Yes | Project learnings |
| `.github/workflows/kspec-review.yml` | Yes | If `--ci` was used — headless review on PRs |
| `.kiro/.current` | No | Personal working state |
| `.kiro/CONTEXT.md` | No | Auto-generated, local state |
| `.kiro/sessions/` | No | Review session logs |
| `.kiro/settings/` | No | Local workspace MCP config |
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

Migration moves `config.json`, `.current`, `memory.md`, and `specs/` from `.kspec/` to `.kiro/`, regenerates `CONTEXT.md` from the migrated source artifacts, then removes the empty `.kspec/` directory.

## Configuration

Set during `kspec init`:

- **Date format**: YYYY-MM-DD, DD-MM-YYYY, or MM-DD-YYYY
- **Auto-execute**: ask (default), auto, or dry-run
- **Kiro engine**: V2 by default; select V3 with `--engine v3` or `kspec engine set v3`
- **Model**: inherits Kiro's persistent preference by default, or pin a custom model ID
- **Jira project**: Default project key for `sync-jira` (when Atlassian MCP detected)
- **Reviewers**: Multi-CLI reviewers for agentic review loop (Copilot, Claude, Gemini, etc.)
- **IDE chat subagents**: Optional `.md` agent files for Kiro IDE chat (default No)
- **Agent Skills**: Slash-command skills (`/kspec-spec` etc.) for default chat (default Yes)
- **Enterprise governance**: MCP/model registry URLs, IdP, prompt logging (opt-in, off by default)
- **Hooks**: V2 embeds context lifecycle and destructive-command guard hooks; V3 uses the versioned lifecycle hook file

### Environment variables

| Variable | Effect |
|---|---|
| `KSPEC_ENTERPRISE=1` | Flips the "Configure enterprise governance?" prompt default to Yes (orgs set this in dev container / shell init) |
| `KSPEC_KIRO_ENGINE=v2|v3` | Selects the harness when no global `--engine` flag is supplied |
| `KIRO_HOME=/path` | Overrides the global Kiro agents/settings/MCP home |
| `KIRO_API_KEY` | Required for headless mode — used by the `--ci` GitHub Actions workflow |

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
| **V3 headless CI is early access** | Generated CI stays explicitly on V2 until Kiro documents stable V3 headless behavior. |
| **spec-lite.md auto-update is truncation** | `truncateSpecLite()` truncates the active requirements artifact. Run `kspec refresh` or `/agent swap kspec-refresh` for an AI-generated summary. |

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
