# kspec — Spec-Driven Development for Kiro CLI

[![npm version](https://img.shields.io/npm/v/kspec.svg)](https://www.npmjs.com/package/kspec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Spec-driven development workflow for Kiro CLI with verification at every step.

## Installation

```bash
npm install -g kspec
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
| `kspec help` | Show help |
| `kspec --help, -h` | Show help (standard flag) |
| `kspec --version, -v` | Show version (standard flag) |

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

## Integration with Kiro IDE

kspec and Kiro IDE work seamlessly together, combining structured workflow automation with interactive development assistance.

### Workflow Integration

**kspec provides:**
- Structured spec creation and task generation
- Automated analysis and verification steps
- TDD workflow enforcement
- Project memory harvesting

**Kiro IDE provides:**
- Interactive implementation assistance
- Real-time code help and debugging
- Native spec workflow support
- Advanced AI-powered development tools

### Usage Patterns

#### Pattern 1: kspec-Driven Development
```bash
# Use kspec for structure and planning
kspec init
kspec analyse
kspec spec "User Authentication API"
kspec tasks

# Switch to Kiro IDE for implementation
# Reference spec files: #File .kspec/specs/2026-01-22-user-auth/spec.md
# Implement tasks interactively with AI assistance

# Return to kspec for verification
kspec verify
kspec done
```

#### Pattern 2: Kiro-Native with kspec Analysis
```bash
# Use Kiro's built-in spec workflow
# Create specs using Kiro IDE's native tools

# Use kspec for analysis and verification
kspec analyse          # Update steering docs
kspec review          # Code review
kspec verify          # Verify implementation
```

#### Pattern 3: Hybrid Approach
```bash
kspec spec "Feature"   # Create initial spec
# Edit and refine spec in Kiro IDE
kspec tasks           # Generate tasks
# Implement tasks in Kiro IDE with AI assistance
kspec verify          # Final verification
```

### File System Integration

Both tools share the same file structure:

```
.kiro/
├── steering/         # Shared project context
│   ├── product.md   # Used by both kspec and Kiro
│   ├── tech.md      # Technology standards
│   └── testing.md   # Testing approach
└── agents/          # kspec-generated agents (usable in Kiro)

.kspec/
└── specs/           # kspec-generated specs
    └── feature/
        ├── spec.md      # Reference in Kiro: #File .kspec/specs/feature/spec.md
        ├── spec-lite.md # Concise version for context
        ├── tasks.md     # Task list
        └── memory.md    # Learnings
```

### Kiro IDE Context Usage

Reference kspec files in Kiro IDE chat:

```
#File .kspec/specs/user-auth/spec.md     # Full specification
#File .kspec/specs/user-auth/tasks.md    # Task list
#Folder .kspec/specs/user-auth           # Entire spec folder
#Folder .kiro/steering                   # Project context
```

### Agent Integration

kspec creates specialized agents that work in Kiro IDE:

- **kspec-analyse** (Ctrl+A): Codebase analysis
- **kspec-spec** (Ctrl+S): Specification creation  
- **kspec-tasks** (Ctrl+T): Task generation
- **kspec-build** (Ctrl+B): TDD implementation
- **kspec-verify** (Ctrl+V): Verification
- **kspec-review** (Ctrl+R): Code review

Switch agents in Kiro IDE: `/agent swap` or use keyboard shortcuts.

### Best Practices

1. **Start with kspec** for structured planning and analysis
2. **Use Kiro IDE** for interactive implementation and debugging
3. **Reference kspec files** in Kiro chat for context
4. **Leverage steering docs** updated by kspec analysis
5. **Use kspec agents** within Kiro for specialized workflows
6. **Verify with kspec** to ensure completeness

This integration gives you the best of both worlds: structured workflow automation and intelligent development assistance.

## Requirements

- Node.js >= 18
- Kiro CLI or Amazon Q CLI
- Kiro IDE (optional, for enhanced integration)

## License

MIT
