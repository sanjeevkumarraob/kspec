# Changelog

All notable changes to kspec are documented in this file.

## [2.3.0] — 2026-06-23

### Kiro CLI 2.8 and V3 early access

- Added workspace engine selection with `kspec engine set v2|v3`, global `--engine`, `KSPEC_KIRO_ENGINE`, and a Kiro 2.8 minimum for V3.
- Added V3 Markdown agents with tag-based tools, capability permissions, compact resources, MCP access, and standalone `.kiro/hooks/kspec.json` lifecycle hooks.
- V2 remains the default; CI is explicitly pinned to V2 until V3 headless support is documented.
- Added Kiro-native `requirements.md` resolution with legacy `spec.md` fallback and reversible `kspec migrate-spec` conversion.

### Deterministic active context

- `.kiro/CONTEXT.md` is now an atomic, derived snapshot capped at 8 KiB. It includes active format/phase, nested task progress, current chunk/task, design, Jira, requirements summary, decisions, and next action.
- All custom agents and Agent Skills read `.kiro/.current`, refresh through `kspec context --stdout`, and treat source artifacts as authoritative.
- Removed `.kiro/specs/**/*.md` from always-loaded resources so historical specs no longer consume every prompt's context window.
- Added `kspec use <spec>` and V3 hooks that track native `/spec` file changes.

### Compatibility

- Kiro model selection now inherits the CLI's persistent preference unless explicitly pinned.
- Added global `--effort`, `KIRO_HOME` support, the official `cli.kiro.dev` installer, and removed the invalid shell-level `agent swap` invocation.

## [2.2.0] — 2026-05-04

### Enterprise Governance (opt-in)

New single-prompt opt-in during `kspec init` configures organization-level governance. Default is **off** for solo / OSS users — enterprise teams flip the default with `KSPEC_ENTERPRISE=1` or skip the prompt entirely with `kspec init --enterprise`.

When enabled, scaffolds `.kiro/steering/enterprise-governance.md` (`inclusion: always`) so every agent loads it as context. Captures:

- **MCP registry URL** — admin-hosted JSON allow-list. Kiro auto-revokes unapproved MCP servers every 24h
- **Model registry URL** — admin-hosted approved-models list. Off-policy models get rewritten
- **Identity provider** — Okta / Microsoft Entra ID / AWS IAM Identity Center / Other
- **Prompt logging** — documents SOC2-style compliance ("don't paste secrets, PII, customer data") to all agents

See [Kiro enterprise governance](https://kiro.dev/docs/cli/enterprise/governance/mcp/).

### CI/CD Integration

`kspec init --ci` scaffolds `.github/workflows/kspec-review.yml` running `kspec review --no-interactive --trust-tools=read,shell` on every PR (uses `KIRO_API_KEY` org secret), and a CI hooks preset:

- `preToolUse` — audit-log every shell command, hard-block destructive patterns (`rm -rf`, `git push`, `sudo`, `curl http`)
- `postToolUse` — audit-log every file write
- `onSpecComplete` — auto-runs `kspec verify` and `kspec sync-jira --progress`
- `onSessionStop` — refreshes CONTEXT.md

Powered by [Kiro CLI 2.0+ headless mode](https://kiro.dev/docs/cli/headless/).

### Least-Privilege Agent Permissions

Every kspec agent now ships with `toolsSettings`:

- **`write.allowedPaths`** — state-only agents (analyse, context, refresh, jira) can only write under `.kiro/**`. Spec-pipeline agents add `AGENTS.md`. Code-modifying agents (build, fix, refactor) get `src/**`, `lib/**`, `app/**`, `test/**`, `tests/**`, plus common source extensions
- **`write.deniedPaths`** — universal block on `.env*`, `**/secrets/**`, `**/credentials/**`, `*.pem`, `*.key`, `.git/**`, `node_modules/**`, `vendor/**`, `dist/**`, `build/**`
- **`shell.{allowedCommands,deniedCommands,autoAllowReadonly}`** — build can run package managers (npm/pnpm/yarn/cargo/go/mvn) and git commits but not `git push`/`rm -rf`/`sudo`/`curl`/`wget`/`npm publish`. Verify and review get test runners only
- **`subagent.availableAgents`** — explicit delegation graph (e.g. `kspec-build → [verify, review, fix]`, `kspec-verify → []`). Auditable, admin-restrictable

See [Kiro custom agents reference](https://kiro.dev/docs/cli/custom-agents/configuration-reference/).

### Kiro Agent Skills (CLI 2.1+)

5 new `.kiro/skills/<name>/SKILL.md` files turn kspec workflows into native `/<name>` slash commands in the **default** Kiro chat — no `/agent swap` required:

- `/kspec-spec` — clarify → spec.md → spec-lite.md
- `/kspec-build` — strict TDD execution (red → green → refactor → full suite)
- `/kspec-review` — multi-CLI parallel review with synthesis
- `/kspec-verify` — verify spec / design / tasks / implementation against acceptance criteria
- `/kspec-jira` — push spec progress to Jira (requires Atlassian MCP)

Created when you answer `Y` to "Create Kiro Agent Skills?" during `kspec init` (default Yes). See [Kiro skills](https://kiro.dev/docs/cli/skills/).

### All-MCP Agent Access (Option A)

Previously kspec only injected `@atlassian` / `@jira` into the spec/build/review pipeline. Now **every** configured MCP server (`@github`, `@confluence`, `@slack`, etc.) is automatically granted to agents on the allow-list, with a `## Available MCP Tools` section appended to each agent's prompt explaining how to use them. Idempotent via a `<!-- kspec:mcp-tools -->` marker.

### `kspec sync-agents` Command

New maintenance command. Run it after adding a new MCP server (`kiro-cli mcp add --name github`) and it updates every kspec agent's tools/allowedTools/`includeMcpJson`/`toolsSettings` and injects the MCP-tools usage section into preserved custom prompts. Idempotent — safe to run repeatedly. Updates both JSON CLI agents and (if enabled) the IDE markdown variants.

### Optional Kiro IDE Chat Subagents

`kspec init` now asks (default No) whether to also write `.kiro/agents/<name>.md` files — Kiro IDE chat subagent format with YAML frontmatter — alongside the existing `.json` CLI agents. Choice persisted as `config.ideAgents` so `sync-agents` picks the right files. Avoids file bloat for CLI-only users while supporting IDE chat workflows when wanted. See [Kiro IDE subagents](https://kiro.dev/docs/chat/subagents/).

### Steering — Kiro-Native Inclusion Syntax

Migrated from kspec's old `inclusion_mode: always | on_demand | never` to Kiro's actual spec: `inclusion: always | auto | fileMatch | manual`. Old syntax was silently ignored by Kiro.

- `api-standards.md` switched from `on_demand` to `inclusion: fileMatch` with `fileMatchPattern: ['**/api/**', '**/routes/**', ...]` so it auto-loads only when API code is touched
- New `frontend.md` (TSX/JSX/CSS patterns) and `backend.md` (server/db/migrations) templates, both `fileMatch`
- `mergeSteeringFile` migrates legacy `inclusion_mode` keys transparently on next `kspec init` (`on_demand → auto`, `never → manual`)

### Non-Destructive Steering Merge

When a steering file already exists (e.g. from base Kiro IDE init), `kspec init` no longer skips it entirely. The merge:

- Appends only the H2 sections missing from the user's file (with `<!-- added by kspec -->` markers)
- Adds missing frontmatter keys without overwriting existing values
- Leaves files outside the 7 known templates fully untouched

### New Agents for Inline Execution

Two new agents to stay in kiro-cli without running shell commands:

| Agent | Shortcut | Purpose |
|-------|----------|---------|
| kspec-context | Ctrl+Shift+C | Refresh CONTEXT.md inline (use after /compact) |
| kspec-refresh | — | Generate AI summary of spec (not just truncation) |

Total agents: 14 → 16.

### Configurable Model

AI model is now configurable during `kspec init`:

- **claude-sonnet-4.6** (default, recommended)
- **claude-opus-4.6** (most capable)
- **claude-haiku-4.5** (fastest)
- Custom model ID

Model is stored in `config.json` and used by `getAgentTemplates()`.

### File Locking

`kspec build` now uses file locking to prevent concurrent builds:

- Lock file created in spec folder (`.kspec-build.lock`)
- Contains PID, timestamp, and command for debugging
- Auto-expires after 30 minutes (stale lock detection)
- Cleaned up on process exit (including SIGINT/SIGTERM)

### Renamed Function

- `autoRefreshSpecLite()` → `truncateSpecLite()` — clearer name indicating truncation, not AI summary

### Security Fixes

- **Command injection fix** in `generateSlug()` — added `shellEscape()` function and input sanitization
- Removed unused code: `usingSpecFallback` variable, `available` field in reviewerCliConfigs
- Renamed `devilsAdvocatePrompts.pr` to `.review` (was defined but never used)

### Error Handling

- Added try-catch to `getTaskStats()`, `getCurrentTask()`, `isSpecStale()` for robustness
- Fixed TOCTOU race condition in `isSpecStale()`

### kspec-review Agent Updates

- Correct CLI flags for external reviewers (`-p` for non-interactive mode)
- Added install instructions for each CLI (copilot, claude, gemini, aider)
- Clearer agentic loop pattern documentation

### Documentation

- Added "Known Limitations" section to README (reduced from 4 to 2 after fixes)
- Added "File Locking" section to Configuration
- Documented model configuration option

## [2.1.0] — 2026-02-21

### Closing the Methodology Gaps

Addresses 10 identified gaps in the SDD methodology with work-type entry points, independent validation, feedback loops, and observability.

### Work Types (Gap 1 — abbreviated pipelines)

Not everything needs the full spec→design→tasks→build pipeline. 6 new commands provide tailored entry points:

- **`kspec fix "Bug description"`** — Abbreviated TDD pipeline: describe → root cause → test → fix → verify
- **`kspec refactor "What and why"`** — Restructure code with no behavior change, tests before and after
- **`kspec spike "Question"`** — Time-boxed investigation, findings report only, no implementation
- **`kspec revise`** — Re-enter spec from stakeholder feedback, diff summary, update affected tasks
- **`kspec demo`** — Generate stakeholder walkthrough mapping implementation to requirements
- **`kspec estimate`** — Complexity assessment with T-shirt sizing, risk analysis, recommendations

### 6 New Agents

| Agent | Shortcut | Purpose |
|-------|----------|---------|
| kspec-fix | Ctrl+Shift+F | Bug fix with abbreviated TDD pipeline |
| kspec-refactor | Ctrl+Shift+G | Refactor code (no behavior change) |
| kspec-spike | Ctrl+Shift+I | Investigation/spike (no code) |
| kspec-revise | Ctrl+Shift+E | Revise spec from feedback |
| kspec-demo | Ctrl+Shift+W | Generate stakeholder walkthrough |
| kspec-estimate | Ctrl+Shift+X | Assess complexity |

Total agents: 8 → 14. `kspec-fix` and `kspec-refactor` include `bash` tool for running tests.

### Independent Validation (Gap 2)

- **`testCommand`** config option: set during `kspec init` (e.g., `npm test`, `pytest`)
- `kspec verify` runs `testCommand` before AI review — tests must pass first
- `kspec build` runs `testCommand` as sanity check after AI chat

### Auto-Refresh Spec-Lite (Gap 5)

- `autoRefreshSpecLite()` detects when spec.md is newer than spec-lite.md
- Automatically creates truncated copy before `tasks`, `build`, `verify`, `verify-tasks`
- `kspec refresh` still uses AI for proper summary

### Observability & Metrics (Gap 10)

- `recordMetric()` tracks timestamps for every pipeline phase (spec, design, tasks, build, verify, done)
- **`kspec metrics`** — Display timeline for current spec
- Work-type commands (fix, refactor, spike) also record start/completed metrics

### Feedback Loop (Gap 3)

- **`kspec revise`** — Re-enter a spec from feedback, show diff summary, update affected tasks

### Stakeholder Demo (Gap 4)

- **`kspec demo`** — Generate walkthrough mapping implementation to spec requirements

### Memory Management (Gap 6)

- **`kspec memory`** — Show project memory
- **`kspec memory review`** — AI-assisted review (identify outdated, duplicates, contradictions)
- **`kspec memory prune`** — Remove outdated entries with confirmation

### Complexity Assessment (Gap 7)

- **`kspec estimate`** — T-shirt sizing, risk analysis, build recommendations

### Multi-Spec Orchestration (Gap 9)

- **`kspec milestone create <name>`** — Create milestone to group related specs
- **`kspec milestone add <name>`** — Add current spec to milestone
- **`kspec milestone status <name>`** — Show milestone progress with task aggregation
- **`kspec milestone list`** — List all milestones

### Status & Context Enhancements

- `kspec status` shows spec type from metadata.json (fix/refactor/spike/feature)
- `refreshContext()` includes metadata type and milestone membership
- Metadata.json created for fix/refactor/spike work types with `type` field

### Tests

- ~55 new tests across ~16 new suites
- Coverage for all new functions, commands, agent templates, and help text updates

### Design Pipeline

A new optional **design** step between `spec` and `tasks` enables technical architecture planning before implementation.

- **New agent**: `kspec-design` (Ctrl+Shift+D) — Creates `design.md` with Architecture Overview, Component Breakdown, Data Models, API Contracts, Dependency Mapping, Technical Decisions, and Risk Assessment
- **New command**: `kspec design` — Create technical design from spec (requires spec.md)
- **New command**: `kspec verify-design` — Verify design against spec requirements
- **Updated command**: `kspec tasks` — Automatically includes `design.md` for architecture guidance and dependency ordering when present
- **Updated workflow**: `spec → design (optional) → tasks → build → verify`

### Interactive Spec Shaping

`kspec verify-spec` is now an interactive spec-shaping experience instead of a one-shot PASS/FAIL report.

- Asks 4-8 targeted, numbered clarifying questions with sensible defaults
- Proposes assumptions: "I assume X, is that correct?"
- Waits for user responses before suggesting changes
- Gets confirmation before modifying spec.md
- Regenerates spec-lite.md after updates

### Jira Pull Updates

- **New command**: `kspec jira-pull` — Fetch latest updates from linked Jira issues
- Generates a CHANGE REPORT showing new/modified criteria, status changes, and comments
- Never auto-updates spec.md — always presents changes for user approval first

### Sync-Jira Smart Default

- Reads `jira-links.json` for existing `specIssue` before defaulting to create
- If a linked issue exists, updates it automatically (use `--create` to force new)

### Agent Pipeline Navigation

All agents now include a **PIPELINE** section suggesting next steps with both CLI and agent-swap commands.

### Bug Fixes

- **`.current` file handling**: `setCurrentSpec()` now normalizes to consistent `.kiro/specs/...` format
- **Fuzzy matching removed**: `getCurrentSpec()` now requires exact path or folder name match
- **Empty `.current` handling**: Returns `null` for empty or whitespace-only files
- **Stale context after chat**: `refreshContext()` now runs after `chat()` returns
- **Better error messages**: `getOrSelectSpec()` suggests `kspec list` and explains stale `.current`

### Model Upgrade

- All agents updated from `claude-sonnet-4` to `claude-sonnet-4.6`

### Tests

- 164 tests across 58 suites (up from 85 tests across 25 suites)

---

## [2.0.0] — 2026-02-14

### Breaking Changes

- Consolidated `.kspec/` directory into `.kiro/` — all state now under `.kiro/`
- Automatic migration offered when `.kspec/` detected

### Added

- **Powers**: Modular knowledge files (contract, document, tdd, code-review, code-intelligence)
- **Contracts**: Enforce structured outputs with `## Contract` section in spec.md
- **Jira Integration**: Pull from Jira, sync to Jira, create subtasks via Atlassian MCP
- **Spec staleness detection**: Warns when spec.md is modified after spec-lite.md
- **`kspec refresh`**: Regenerate spec-lite.md after editing spec.md
- **`kspec update`**: Check for npm updates (auto-checks every 24h)
- **V1 → V2 migration**: Automatic `.kspec/` to `.kiro/` migration with user confirmation
- **MCP config detection**: Checks workspace settings, workspace root, user, and legacy locations
- **ACP support**: Works with JetBrains IDEs and Zed via Agent Client Protocol
- **Code Intelligence**: Tree-sitter indexing and optional LSP integration
- **kspec-jira agent**: Dedicated Jira agent with Ctrl+Shift+J shortcut
- **`kspec agents`**: List all agents with shortcuts
- **Smart slugs**: LLM-powered slug generation with regex fallback

### Changed

- All agent resources use `file://` protocol
- CONTEXT.md includes Jira links section
- Help text reorganized with Jira and Powers sections

---

## [1.0.0] — 2026-01-22

### Added

- Initial release
- Core workflow: init → analyse → spec → tasks → build → verify → done
- 7 agents: kspec-analyse, kspec-spec, kspec-tasks, kspec-build, kspec-verify, kspec-review
- CONTEXT.md auto-generation for context preservation
- spec-lite.md for concise context after compression
- memory.md for harvesting learnings
- Steering docs: product.md, tech.md, testing.md
- CLI and Agent mode support
