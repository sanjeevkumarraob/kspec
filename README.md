# kspec — Spec-Driven Development for Kiro CLI (Q-Compatible)

kspec is a **Spec-Driven Development (SDD)** workflow built on top of **Kiro CLI**, enabling teams to deliver software using a consistent, reproducible, and fully-documented process.

kspec integrates deeply with:

- **Kiro CLI** (first-class support)
- **Amazon Q CLI** (backward compatible)
- **Per-project agents** stored under `.kiro/agents/`
- **Steering docs** stored under `.kiro/steering/`
- **Standards/specs/tasks/memory** stored under `.kspec/*`

It is designed for:

- Teams working across multiple languages and stacks
- Organisations requiring **standards governance**, **traceability**, **feature specs**, and **review gates**
- Engineers who want to work with AI assistance *but maintain control* through structured flows

kspec helps you move through a clear workflow:
ANALYSE → APPLY STANDARDS → CREATE SPEC → CREATE TASKS → EXECUTE TASKS → HARVEST MEMORY

Every step is transparent, reviewable, and grounded in your project’s own steering rules.

---

# 🚀 Features

### 🧭 Phase-Gated Development Workflow  

kspec enforces a structured Spec-Driven workflow:

1. Analyse repository + architecture  
2. Apply Standards based on steering  
3. Create Spec with lightweight + full spec files  
4. Create Tasks from spec (TDD-friendly)  
5. Execute Tasks step-by-step with optional command execution  
6. Harvest Memory (decisions, glossary, follow-ups)

---

### Architecture



![QOS Architecture](image.png)

### 📚 Steering-First Architecture  

kspec treats:

- `.kiro/steering/` → **Authoritative project rules & conventions**
- `.kspec/standards/` → **Derived standards** (must conform to steering)

---

### 🤖 Per-Project Agents  

kspec installs dedicated agents into:

```
.kiro/agents/
  kspec-analyse.json
  kspec-apply-standards.json
  kspec-create-spec.json
  kspec-create-tasks.json
  kspec-execute-tasks.json
  kspec-harvest-memory.json
```

These are **version-controlled**, **portable**, and **CI-friendly**.

---

### 🧪 Test-Driven Development Workflow  

`/execute-tasks` will:

- Propose code changes
- Propose tests
- Suggest commands
- Log executed commands into `execution.log`
- Support **dry-run**, **interactive**, and **auto-exec** modes

---

### 📂 Date Spec Folders  

Specs are stored in the form:

```
.kspec/specs/DD-MM-YYYY-feature-slug/
```

---

### ⚙️ Works Everywhere  

- Fully supports **Kiro CLI**
- Fully compatible with **Amazon Q CLI** for legacy environments

---

# 📦 Installation

## Option A — One-Line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/install-kspec.sh | bash
```

Installs the `kspec` CLI script globally (usually to `~/.local/bin/kspec`).

---

## Option B — From Repo

```bash
git clone https://github.com/YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO
./install-kspec.sh
```

---

# 🧰 Commands

These commands are executed from your **project root**.

> Run `/init` once per repo to enable kspec.

For detailed documentation of all commands, see **[COMMANDS.md](COMMANDS.md)**.

---

## Quick Reference

### Setup Commands
- **`kspec /init`** - Initialize kspec structure
- **`kspec /status`** - Show current configuration

### Analysis Commands  
- **`kspec /analyse`** - Analyze repository (read-only)
- **`kspec /apply-standards`** - Update standards from steering
- **`kspec /check-consistency`** - Check steering ↔ standards
- **`kspec /reconcile-rules-standards`** - Propose alignment edits

### Feature Development (Simplified!)
- **`kspec /create-spec "Feature Name"`** - Create spec (sets current)
- **`kspec /create-tasks`** - Generate tasks (uses current spec)
- **`kspec /execute-tasks`** - Execute tasks (uses current spec)
- **`kspec /harvest-memory`** - Capture learnings (uses current spec)

**Note:** Feature name is only required for `/create-spec`. All other commands use the current spec automatically!

---

## Example Workflow

```bash
# Setup (once per project)
kspec /init
kspec /analyse
kspec /apply-standards

# Feature development (specify name only once!)
kspec /create-spec "User Authentication API"  # Sets current spec
kspec /create-tasks                           # Uses current spec
kspec /execute-tasks                          # Uses current spec
kspec /harvest-memory                         # Uses current spec

# Start another feature
kspec /create-spec "Payment Processing"       # New current spec
kspec /create-tasks                           # Uses new spec
kspec /execute-tasks                          # Uses new spec
```

For detailed command documentation, examples, and troubleshooting, see **[COMMANDS.md](COMMANDS.md)**.

# 📁 Directory Structure

After running `/init`:

```
.kiro/
  steering/
    product.md                    # Product overview, users, features
    tech.md                       # Technology stack, frameworks, tools
    structure.md                  # Project structure, naming, architecture
    api-standards.md              # REST conventions, auth, documentation
    testing-standards.md          # TDD approach, test types, coverage
    security.md                   # Auth, data protection, input validation
  agents/
    kspec-analyse.json
    kspec-apply-standards.json
    kspec-create-spec.json
    kspec-create-tasks.json
    kspec-execute-tasks.json
    kspec-harvest-memory.json

.kspec/
  .current_spec                   # Points to current spec folder
  .rules_fingerprint              # Steering docs fingerprint
  instructions/
    core/
      pre-flight.md
      analysis.md
    meta/
      feature.md
  standards/
    tech-stack.md                 # Derived from steering
    code-style.md                 # Derived from steering
  specs/
    DD-MM-YYYY-feature-slug/
      spec.md
      spec-lite.md
      tasks.md
      execution.log
  tasks/
  memory/
    template.md
    decisions.md
    glossary.md
    follow-ups.md
  examples/
    spec-lite.example.md
    tasks.example.md

kspec
install-kspec.sh
```

---

# ⚙️ Environment Variables

| Variable | Purpose |
|---------|---------|
| `QOS_DATE` | Override date for spec folders (DD-MM-YYYY) |
| `QOS_FAST=1` | Add `--no-interactive` to CLI (CI/headless) |
| `QOS_FORCE=1` | Allow `/init` to overwrite agents |
| `QOS_ALLOW_EXEC=1` | Allow interactive command exec |
| `QOS_AUTO_EXEC=1` | Auto-execute suggested commands |
| `QOS_EXEC_DRY_RUN=1` | Show commands without executing (default) |

---

# 🌐 Kiro CLI Integration

kspec is designed to run **natively** on Kiro CLI.

Examples:

```bash
kiro-cli chat --agent kspec-analyse
kiro-cli chat --agent kspec-create-spec
```

Agent resolution priority:

1. `.kiro/agents/*.json` (project-level)
2. `~/.kiro/agents/*.json` (user-level)
3. Built-in Kiro agents

### Amazon Q CLI Compatibility

kspec also supports the Q CLI:

```bash
q chat --agent kspec-analyse
```

---

# 🧪 Example Workflow

```bash
kspec /init

kspec /analyse "User Authentication API"
kspec /apply-standards

kspec /create-spec "User Authentication API"
kspec /create-tasks "User Authentication API"

kspec /execute-tasks "User Authentication API"

kspec /harvest-memory
```

---

# 🔧 Why kspec?

- Enforces consistent engineering delivery  
- Enables AI-assisted workflows without losing control  
- Makes specs, tasks, standards, and decisions version-controlled  
- Works identically for every project  
- Bridges architecture, documentation, and implementation  
- Creates predictability across teams  

---

# 📄 License

MIT (or update based on your organisation).

---

# 🤝 Contributing

PRs are welcome.

---

# 🙋‍♂️ Support

Open an issue or contact the maintainers for help integrating kspec into your organisation.
