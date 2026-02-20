# Changelog

All notable changes to kspec are documented in this file.

## [Unreleased] — v2.1

### Design Pipeline

A new optional **design** step between `spec` and `tasks` enables technical architecture planning before implementation.

- **New agent**: `kspec-design` (Ctrl+Shift+D) — Creates `design.md` with Architecture Overview, Component Breakdown, Data Models, API Contracts, Dependency Mapping, Technical Decisions, and Risk Assessment
- **New command**: `kspec design` — Create technical design from spec (requires spec.md)
- **New command**: `kspec verify-design` — Verify design against spec requirements
- **Updated command**: `kspec tasks` — Automatically includes `design.md` for architecture guidance and dependency ordering when present
- **Updated workflow**: `spec → design (optional) → tasks → build → verify`

The design step is optional — run `kspec tasks` directly to skip it.

### Interactive Spec Shaping

`kspec verify-spec` is now an interactive spec-shaping experience instead of a one-shot PASS/FAIL report.

- Asks 4-8 targeted, numbered clarifying questions with sensible defaults
- Proposes assumptions: "I assume X, is that correct?"
- Waits for user responses before suggesting changes
- Gets confirmation before modifying spec.md
- Regenerates spec-lite.md after updates

### Jira Pull Updates

New command to pull the latest changes from linked Jira issues and review them before updating specs.

- **New command**: `kspec jira-pull` — Fetch latest updates from linked Jira issues
- Reads `jira-links.json` for linked issue keys
- Generates a CHANGE REPORT showing new/modified criteria, status changes, and comments
- Never auto-updates spec.md — always presents changes for user approval first
- Updated `kspec-jira` agent with PULL UPDATES capability

### Sync-Jira Smart Default

`kspec sync-jira` now intelligently detects whether to create or update.

- Reads `jira-links.json` for existing `specIssue` before defaulting to create
- If a linked issue exists, updates it automatically (use `--create` to force new)
- Preserves `--project` and `--update` flag behavior

### Agent Pipeline Navigation

All 8 agents now include a **PIPELINE** section suggesting next steps with both CLI and agent-swap commands. Users who stay inside kiro-cli can navigate the full workflow without exiting.

- Every agent prompt ends with contextual next-step suggestions
- Both `/agent swap kspec-*` and `kspec *` commands shown
- Pipeline is context-aware (e.g., after verify-spec, suggests design or tasks)

### Bug Fixes

- **`.current` file handling**: `setCurrentSpec()` now normalizes to consistent `.kiro/specs/...` format using `path.basename()`. Previously stored inconsistent path formats between CLI and agent mode.
- **Fuzzy matching removed**: `getCurrentSpec()` no longer uses fuzzy matching (`d.includes(spec) || spec.includes(d)`) which could return wrong specs. Now requires exact path or folder name match.
- **Empty `.current` handling**: `getCurrentSpec()` returns `null` for empty or whitespace-only `.current` files instead of attempting to match.
- **Stale context after chat**: `refreshContext()` now runs after `chat()` returns, ensuring CONTEXT.md reflects agent work in CLI mode.
- **Better error messages**: `getOrSelectSpec()` now suggests `kspec list` and explains that `.kiro/.current` may be stale when no spec is found.

### Agent Prompt Improvements

- **kspec-spec**: Steps 5-6 now use explicit format: "Write the spec folder path to .kiro/.current (format: .kiro/specs/YYYY-MM-DD-slug)" and "Regenerate .kiro/CONTEXT.md"
- **kspec-tasks**: References `design.md` for architecture guidance, uses "Regenerate" for CONTEXT.md
- **kspec-build**: Uses "regenerate .kiro/CONTEXT.md" for clarity
- **kspec-verify**: Added VERIFY-DESIGN section alongside VERIFY-SPEC, VERIFY-TASKS, VERIFY-IMPLEMENTATION
- **kspec-jira**: Added PULL UPDATES capability, references `jira-links.json` explicitly, warns against auto-updating spec

### Model Upgrade

- All agents updated from `claude-sonnet-4` to `claude-sonnet-4.6`

### UI Updates

- `kspec status` — Pipeline-aware "Next step" logic (no spec → spec, no design → design/skip, no tasks → tasks)
- `kspec agents` — Lists kspec-design with Ctrl+Shift+D shortcut
- `kspec help` — Includes design, verify-design, and jira-pull commands
- `refreshContext()` — Shows Design section (present / not yet created), updated Quick Commands

### Tests

- 112 tests across 39 suites (up from 85 tests across 25 suites)
- New test suites: agent model version, agent prompt format, setCurrentSpec normalization, getCurrentSpec enhanced (empty/whitespace/no-fuzzy), getOrSelectSpec errors, sync-jira smart default, kspec-design agent, refreshContext with design, help/agents includes design, status pipeline, jira-pull, kspec-jira pull-updates, verify-spec as spec-shaper

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
