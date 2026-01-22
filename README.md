# kspec — Spec-Driven Development for Kiro CLI

kspec is a **Spec-Driven Development (SDD)** workflow built on top of **Kiro CLI**, enabling teams to deliver software using a consistent, reproducible, and fully-documented process.

## ✨ Key Features

- **Multi-Agent Workflow** — Specialized agents for analysis, testing, debugging, code review
- **Seamless Agent Switching** — Keyboard shortcuts to swap agents without leaving your session
- **TDD-First Approach** — Test-driven development baked into every execution phase
- **Context Engineering** — Steering docs and standards keep AI responses consistent
- **Progress Tracking** — Resume interrupted work with task checkboxes
- **Quick Mode** — Fast ad-hoc tasks without full spec workflow

## 🚀 Quick Start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/sanjeevkumarraob/kspec/main/install-kspec.sh | bash

# Initialize in your project
cd your-project
kspec /init

# Start developing
kspec /analyse                           # Analyze project
kspec /create-spec "User Auth API"       # Create specification
kspec /create-tasks                      # Generate tasks
kspec /execute-tasks                     # Execute with TDD
```

## 📋 Commands

### Core Workflow
```bash
kspec /init                    # Initialize kspec structure
kspec /analyse                 # Analyze project (read-only)
kspec /apply-standards         # Update standards from steering
kspec /create-spec "Feature"   # Create feature specification
kspec /create-tasks            # Generate tasks from spec
kspec /execute-tasks           # Execute tasks with TDD
kspec /harvest-memory          # Capture decisions and learnings
```

### Quick Actions
```bash
kspec /quick "Fix button"      # Fast ad-hoc task
kspec /review                  # Code review mode
kspec /test "src/auth.ts"      # Test generation
kspec /debug "API 500 error"   # Systematic debugging
```

### Status & Help
```bash
kspec /status                  # Environment status
kspec /progress                # Workflow progress
kspec /agents                  # List available agents
kspec /help                    # Full help
```

## 🤖 Agents & Keyboard Shortcuts

Switch agents seamlessly during your Kiro CLI session:

| Agent | Shortcut | Purpose |
|-------|----------|---------|
| `kspec-analyse` | - | Read-only project analysis |
| `kspec-review` | `Ctrl+R` | Code review and quality check |
| `kspec-test` | `Ctrl+T` | Test generation specialist |
| `kspec-quick` | `Ctrl+Q` | Quick ad-hoc tasks |
| `kspec-debug` | `Ctrl+D` | Systematic debugging |
| `kspec-orchestrator` | `Ctrl+O` | Coordinate multi-agent workflows |

**Switch agents:**
- Press keyboard shortcut during chat
- Run `/agent swap` in kiro-cli
- Start with: `kiro-cli --agent kspec-review`

## 📁 Project Structure

```
your-project/
├── .kiro/
│   ├── steering/           # Authoritative project rules
│   │   ├── product.md
│   │   ├── tech.md
│   │   ├── structure.md
│   │   ├── api-standards.md
│   │   ├── testing-standards.md
│   │   └── security.md
│   └── agents/             # kspec agent configurations
│       ├── kspec-analyse.json
│       ├── kspec-review.json
│       ├── kspec-test.json
│       └── ...
└── .kspec/
    ├── standards/          # Derived standards
    ├── specs/              # Feature specifications
    │   └── DD-MM-YYYY-feature-slug/
    │       ├── spec.md
    │       ├── spec-lite.md
    │       ├── tasks.md
    │       └── execution.log
    ├── quick/              # Quick task logs
    ├── debug/              # Debug session logs
    └── memory/             # Decisions, glossary, follow-ups
```

## 🔄 Workflow Patterns

### New Feature (Full Workflow)
```
analyse → create-spec → create-tasks → execute-tasks → review → harvest-memory
```

### Bug Fix
```
debug → quick (or create-spec if complex) → review
```

### Refactoring
```
analyse → create-spec → test (add coverage) → execute-tasks → review
```

### Code Review
```
review → debug (if issues) → test (if coverage gaps)
```

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KSPEC_DATE` | today | Override date for folder naming (DD-MM-YYYY) |
| `KSPEC_FAST` | 0 | Non-interactive mode for CI/headless |
| `KSPEC_FORCE` | 0 | Overwrite existing agents on /init |
| `KSPEC_DEBUG` | 0 | Enable debug output |

## 🏗️ Architecture

kspec uses a **steering-first architecture**:

1. **Steering Docs** (`.kiro/steering/`) — Authoritative project rules
2. **Standards** (`.kspec/standards/`) — Derived from steering, reflects reality
3. **Specs** (`.kspec/specs/`) — Feature specifications with tasks
4. **Memory** (`.kspec/memory/`) — Captured decisions and learnings

The steering docs are the "constitution" — standards must conform to them.

## 🧪 TDD Workflow

Every `/execute-tasks` follows TDD:

1. **Red** — Write failing test first
2. **Green** — Implement minimal code to pass
3. **Refactor** — Clean up while tests pass
4. **Commit** — Atomic commit per task

Tasks use checkboxes (`[ ]` / `[x]`) for progress tracking and resume capability.

## 🔗 Compatibility

- **Kiro CLI** — First-class support
- **Amazon Q CLI** — Backward compatible (auto-detected)

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

**kspec: Spec-driven development that just works.**
