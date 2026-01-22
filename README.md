# kspec — Spec-Driven Development for Kiro CLI

[![npm version](https://img.shields.io/npm/v/kspec-cli.svg)](https://www.npmjs.com/package/kspec-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Spec-driven development workflow for Kiro CLI with verification at every step.

## Installation

```bash
npm install -g kspec-cli
```

## Quick Start

```bash
kspec init                    # Interactive setup
kspec analyse                 # Analyse codebase
kspec spec "User Auth API"    # Create specification
kspec verify-spec             # Verify spec is complete
kspec tasks                   # Generate tasks
kspec verify-tasks            # Verify tasks cover spec
kspec build                   # Execute with TDD
kspec verify                  # Verify implementation
kspec done                    # Complete & harvest memory
```

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
| `kspec review` | Code review |
| `kspec list` | List all specs |
| `kspec status` | Current status |

## Agents & Shortcuts

| Agent | Shortcut | Purpose |
|-------|----------|---------|
| kspec-analyse | Ctrl+A | Analyse codebase |
| kspec-spec | Ctrl+S | Create specifications |
| kspec-tasks | Ctrl+T | Generate tasks |
| kspec-build | Ctrl+B | Execute with TDD |
| kspec-verify | Ctrl+V | Verify spec/tasks/impl |
| kspec-review | Ctrl+R | Code review |

## Structure

```
.kspec/
├── config.json           # User preferences
├── memory.md             # Project learnings
└── specs/
    └── 2026-01-22-feature/
        ├── spec.md       # Full specification
        ├── spec-lite.md  # Concise (for context compression)
        ├── tasks.md      # Implementation tasks
        └── memory.md     # Feature learnings

.kiro/
└── steering/             # Project rules (Kiro native)
```

## Configuration

Set during `kspec init`:

- **Date format**: YYYY-MM-DD, DD-MM-YYYY, or MM-DD-YYYY
- **Auto-execute**: ask (default), auto, or dry-run

## Requirements

- Node.js >= 18
- Kiro CLI or Amazon Q CLI

## License

MIT
