# kspec — Spec-Driven Development for Kiro CLI

[![npm version](https://img.shields.io/npm/v/kspec-cli.svg)](https://www.npmjs.com/package/kspec-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A spec-driven development workflow for Kiro CLI with specialized agents for analysis, testing, debugging, and code review.

## Installation

```bash
npm install -g kspec-cli
```

## Quick Start

```bash
# Initialize in your project
cd your-project
kspec init

# Start developing
kspec analyse                        # Analyze project
kspec create-spec "User Auth API"    # Create specification
kspec create-tasks                   # Generate tasks
kspec execute-tasks                  # Execute with TDD
```

## Commands

### Core Workflow
```bash
kspec init                    # Initialize kspec structure
kspec analyse                 # Analyze project (read-only)
kspec apply-standards         # Update standards from steering
kspec create-spec "Feature"   # Create feature specification
kspec create-tasks            # Generate tasks from spec
kspec execute-tasks           # Execute tasks with TDD
kspec harvest-memory          # Capture decisions and learnings
```

### Quick Actions
```bash
kspec quick "Fix button"      # Fast ad-hoc task
kspec review                  # Code review mode
kspec test "src/auth.ts"      # Test generation
kspec debug "API 500 error"   # Systematic debugging
```

### Status
```bash
kspec status                  # Environment status
kspec progress                # Workflow progress
kspec agents                  # List available agents
kspec help                    # Full help
```

## Agents & Keyboard Shortcuts

Switch agents during your Kiro CLI session:

| Agent | Shortcut | Purpose |
|-------|----------|---------|
| `kspec-analyse` | - | Read-only project analysis |
| `kspec-review` | `Ctrl+R` | Code review |
| `kspec-test` | `Ctrl+T` | Test generation |
| `kspec-quick` | `Ctrl+Q` | Quick tasks |
| `kspec-debug` | `Ctrl+D` | Debugging |

## Project Structure

```
your-project/
├── .kiro/
│   ├── steering/           # Project rules (authoritative)
│   │   ├── product.md
│   │   ├── tech.md
│   │   ├── structure.md
│   │   ├── testing.md
│   │   └── security.md
│   └── agents/             # Agent configurations
└── .kspec/
    ├── standards/          # Derived standards
    ├── specs/              # Feature specifications
    ├── quick/              # Quick task logs
    ├── debug/              # Debug sessions
    └── memory/             # Decisions & learnings
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `KSPEC_DATE` | Override date (YYYY-MM-DD) |
| `KSPEC_FAST=1` | Non-interactive mode |
| `KSPEC_FORCE=1` | Overwrite on init |
| `KSPEC_DEBUG=1` | Debug output |

## Requirements

- Node.js >= 18
- Kiro CLI or Amazon Q CLI

## License

MIT
