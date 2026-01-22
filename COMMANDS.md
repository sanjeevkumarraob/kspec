# kspec Commands Reference

Complete reference for all kspec commands with detailed explanations, examples, and best practices.

---

## Table of Contents

- [Setup Commands](#setup-commands)
  - [/init](#init)
  - [/status](#status)
- [Analysis Commands](#analysis-commands)
  - [/analyse](#analyse)
  - [/apply-standards](#apply-standards)
  - [/check-consistency](#check-consistency)
  - [/reconcile-rules-standards](#reconcile-rules-standards)
- [Feature Development Commands](#feature-development-commands)
  - [/create-spec](#create-spec)
  - [/create-tasks](#create-tasks)
  - [/execute-tasks](#execute-tasks)
  - [/harvest-memory](#harvest-memory)
- [Environment Variables](#environment-variables)

---

## Setup Commands

### `/init`

**Purpose:** Initialize kspec structure in your project

**Usage:**
```bash
kspec /init
```

**What it does:**
1. Creates `.kiro/steering/` directory with foundational steering files:
   - `product.md` - Product overview, users, features, objectives
   - `tech.md` - Technology stack, frameworks, tools
   - `structure.md` - Project structure, naming conventions, architecture
   - `api-standards.md` - REST conventions, authentication, documentation
   - `testing-standards.md` - TDD approach, test types, coverage requirements
   - `security.md` - Authentication, data protection, input validation

2. Creates `.kiro/agents/` directory with kspec agents:
   - `kspec-analyse.json`
   - `kspec-apply-standards.json`
   - `kspec-create-spec.json`
   - `kspec-create-tasks.json`
   - `kspec-execute-tasks.json`
   - `kspec-harvest-memory.json`

3. Creates `.kspec/` directory structure:
   - `instructions/` - Core workflow templates
   - `standards/` - Derived standards (from steering)
   - `specs/` - Feature specifications
   - `memory/` - Decisions, glossary, follow-ups
   - `examples/` - Example templates

**Options:**
- `QOS_FORCE=1 kspec /init` - Overwrite existing agent files

**Example:**
```bash
cd my-project
kspec /init

# Output:
# Initialized .kspec templates
# Initialized Kiro Steering docs in .kiro/steering
# Agent written: .kiro/agents/kspec-analyse.json
# Agent written: .kiro/agents/kspec-apply-standards.json
# ...
# kspec init complete.
```

**When to use:**
- Once per project, when first setting up kspec
- After cloning a repo that doesn't have kspec initialized
- When you want to reset agent files (with `QOS_FORCE=1`)

---

### `/status`

**Purpose:** Show current kspec configuration and state

**Usage:**
```bash
kspec /status
```

**What it shows:**
- CLI binary being used (kiro-cli or q)
- Current date (for folder naming)
- Environment variable settings
- Current spec folder (if any)
- Steering docs fingerprint
- Initialization status
- Number of specs created

**Example output:**
```
[kspec] kspec Status

Environment:
  CLI Binary: kiro-cli
  Date: 02-12-2025
  QOS_FAST: 0
  QOS_FORCE: 0
  QOS_AUTO_EXEC: 1 (default: 1)
  QOS_EXEC_DRY_RUN: 0
  QOS_DEBUG: 0

Current Spec: .kspec/specs/02-12-2025-user-authentication-api

Steering Fingerprint: a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4

Initialized: yes
Specs: 3
```

**When to use:**
- To check which spec you're currently working on
- To verify environment variable settings
- To confirm kspec is properly initialized
- To debug issues

---

## Analysis Commands

### `/analyse`

**Purpose:** Analyze entire repository to discover tech stack, architecture, and suggest standards

**Usage:**
```bash
kspec /analyse
```

**What it does:**
1. **Discovers tech stack:**
   - Languages, frameworks, libraries
   - Build tools, package managers
   - Test runners, linters
   - Deployment targets

2. **Identifies architecture:**
   - Bounded contexts and domains
   - Module boundaries
   - Key components and relationships

3. **Finds issues:**
   - Code quality problems
   - Technical debt
   - Security concerns
   - Performance bottlenecks

4. **Suggests improvements:**
   - Updates to `.kiro/steering/*.md`
   - Updates to `.kspec/standards/*.md`
   - Gaps in documentation

**Example output:**
```
Primary tech stack detected:
- Node.js 18+ (package.json found)
- Express.js 4.x (dependency detected)
- Jest (testing framework)
- ESLint (linting configuration)

Bounded contexts identified:
- Authentication module
- User management
- API layer

Risks and smells:
- No OpenAPI specification found
- Missing rate limiting on auth endpoints
- Password hashing not using bcrypt

Proposed standards updates:
- .kspec/standards/tech-stack.md: Add Node.js 18+, Express 4.x
- .kspec/standards/code-style.md: Add ESLint rules
- .kiro/steering/security.md: Add password hashing requirements

Next recommended kspec phase: run /apply-standards
```

**When to use:**
- After `/init` to understand your existing codebase
- When onboarding to a new project
- Periodically to keep standards current
- After major tech stack changes

**Important:**
- This is **read-only** - no files are modified
- Run this before `/apply-standards`

---

### `/apply-standards`

**Purpose:** Align `.kspec/standards` with `.kiro/steering` and repository reality

**Usage:**
```bash
kspec /apply-standards
```

**What it does:**
1. Reads `.kiro/steering/*.md` (authoritative rules)
2. Reads `.kspec/standards/*.md` (current standards)
3. Analyzes repository to understand actual tech stack
4. Identifies gaps and conflicts
5. Proposes specific edits
6. Writes updated standards files

**Deliverables:**
- Updated `.kspec/standards/tech-stack.md`:
  * Languages, frameworks, versions
  * Build tools and package managers
  * Test runners and CI/CD tools
  * Deployment targets

- Updated `.kspec/standards/code-style.md`:
  * Naming conventions
  * File/folder structure
  * Linting and formatting rules
  * Module boundaries

**Example output:**
```
Updated .kspec/standards/tech-stack.md:
+ Runtime: Node.js 18+ (LTS), Express.js 4.x
+ Testing: Jest for unit tests, Supertest for API testing
+ Build: npm scripts, nodemon for development

Updated .kspec/standards/code-style.md:
+ Naming: camelCase for variables, PascalCase for classes
+ File structure: Feature-based organization
+ Linting: ESLint with Airbnb config

Summary:
- Updated tech-stack.md with current stack
- Updated code-style.md with project conventions
- No conflicts with steering docs
- All standards now reflect repository reality
```

**When to use:**
- After `/analyse` to apply suggested changes
- When steering docs are updated
- When tech stack changes
- Periodically to keep standards in sync

---

### `/check-consistency`

**Purpose:** Check for conflicts between steering docs and standards (read-only)

**Usage:**
```bash
kspec /check-consistency
```

**What it does:**
1. Reads `.kiro/steering/*.md`
2. Reads `.kspec/standards/*.md`
3. Identifies contradictions, gaps, and outdated sections
4. Summarizes findings
5. Recommends follow-up actions

**Example output:**
```
Consistency Check Results:

Conflicts found:
- Steering requires bcrypt for passwords, but standards don't mention it
- Steering specifies TDD, but standards don't enforce test-first

Gaps identified:
- No API versioning strategy in standards
- Missing security logging requirements

Outdated sections:
- Standards reference Node.js 16, but steering requires 18+

Recommendations:
1. Run /apply-standards to sync standards with steering
2. Update .kiro/steering/security.md with bcrypt requirements
3. Add API versioning section to standards
```

**When to use:**
- Before starting a new feature
- During code reviews
- When standards seem out of sync
- As part of regular maintenance

**Important:**
- This is **read-only** - no files are modified
- Use `/reconcile-rules-standards` or `/apply-standards` to fix issues

---

### `/reconcile-rules-standards`

**Purpose:** Propose specific edits to align standards with steering

**Usage:**
```bash
kspec /reconcile-rules-standards
```

**What it does:**
1. Reads `.kiro/steering/*.md` and `.kspec/standards/*.md`
2. Proposes specific edits to bring standards into compliance
3. Summarizes recommended changes
4. Does NOT modify files (just proposes)

**Example output:**
```
Proposed edits to align standards with steering:

.kspec/standards/tech-stack.md:
- Line 15: Change "Node.js 16+" to "Node.js 18+"
- Line 23: Add "bcrypt for password hashing (cost factor 12)"

.kspec/standards/code-style.md:
- Line 8: Add "TDD required: write tests before implementation"
- Line 42: Add "ESLint with Airbnb config"

Summary:
- 4 edits proposed across 2 files
- All changes align with steering requirements
- No conflicts detected

Next step: Run /apply-standards to apply these changes
```

**When to use:**
- After `/check-consistency` identifies issues
- When you want to see proposed changes before applying
- To understand what `/apply-standards` will do

---

## Feature Development Commands

### `/create-spec`

**Purpose:** Create a feature specification with detailed requirements

**Usage:**
```bash
kspec /create-spec "Feature Name"
```

**What it does:**
1. Creates AU date-based folder: `.kspec/specs/DD-MM-YYYY-feature-slug/`
2. Sets this as the current spec (stored in `.kspec/.current_spec`)
3. Reads `.kiro/steering/*.md` and `.kspec/standards/*.md`
4. Creates `spec.md` (detailed specification)
5. Creates `spec-lite.md` (executive summary)

**Folder structure created:**
```
.kspec/specs/02-12-2025-user-authentication-api/
├── spec.md              # Detailed specification
└── spec-lite.md         # Executive summary
```

**spec.md includes:**
- Problem/Context section
- Functional Requirements (with scenarios)
- Non-Functional Requirements (performance, security, etc.)
- Constraints (technical, business, compliance)
- High-Level Design (architecture, components, data models)
- References to steering docs

**Example:**
```bash
kspec /create-spec "User Authentication API"

# Creates: .kspec/specs/02-12-2025-user-authentication-api/
# Sets as current spec
# Generates spec.md and spec-lite.md
```

**When to use:**
- At the start of every new feature
- When requirements are clear enough to document
- Before writing any code

**Important:**
- Feature name is **required** for this command
- This sets the current spec for subsequent commands
- Folder name is truncated to 50 characters

---

### `/create-tasks`

**Purpose:** Generate TDD-ready task list from specification

**Usage:**
```bash
kspec /create-tasks ["Feature Name"]
```

**What it does:**
1. Uses current spec (or finds by feature name if provided)
2. Reads `spec.md` and `spec-lite.md`
3. Generates `tasks.md` with numbered, TDD-friendly checklist
4. Includes test-first approach, dependencies, and file paths

**Task structure includes:**
- Grouped by user story or feature area
- Test to write first (TDD)
- Implementation steps
- Acceptance criteria
- Dependencies on other tasks
- File paths for changes
- Parallel execution markers `[P]`

**Task ordering:**
- Models/types first
- Services/business logic second
- API endpoints/controllers third
- UI components last
- Tests before implementation for each layer

**Example:**
```bash
# Uses current spec
kspec /create-tasks

# Or specify feature name
kspec /create-tasks "User Authentication API"
```

**Example tasks.md:**
```markdown
# User Authentication API - Tasks

## 1. Database Setup
- [ ] 1.1 Add User model with fields: id, email, passwordHash
- [ ] 1.2 Create users table migration
- **Test**: User model validates email format
- **Files**: src/models/user.model.js

## 2. Password Security
- [ ] 2.1 Install bcrypt dependency
- [ ] 2.2 Implement password hashing (cost 12)
- **Test**: Password hashing and verification work
- **Files**: src/auth/password.service.js

## 3. Registration Endpoint [P]
- [ ] 3.1 Create POST /api/auth/register
- [ ] 3.2 Validate email and password
- **Test**: Successful registration creates user
- **Test**: Invalid email returns 400
- **Files**: src/auth/auth.controller.js

Summary:
- Total tasks: 3 major, 7 sub-tasks
- Estimated complexity: Medium
- Critical path: Tasks 1-2 must be sequential
- Task 3 can run in parallel after Task 2
```

**When to use:**
- After `/create-spec` when spec is finalized
- Before starting implementation
- When you need a clear implementation roadmap

**Important:**
- Feature name is **optional** (uses current spec)
- If multiple specs exist and no current spec, you'll be prompted to select

---

### `/execute-tasks`

**Purpose:** Execute tasks with TDD guidance and automatic command execution

**Usage:**
```bash
kspec /execute-tasks ["Feature Name"]
```

**What it does:**
1. Uses current spec (or finds by feature name if provided)
2. Reads `tasks.md` and `spec.md`
3. For each task:
   - Restates goal and acceptance criteria
   - Writes test first (TDD - Red)
   - Proposes minimal code to pass test (Green)
   - Suggests refactoring if needed
   - Executes commands automatically (by default)
   - Marks task complete when tests pass

**Execution strategy:**
- Follows TDD: Red → Green → Refactor
- Writes tests before implementation
- Keeps changes minimal and focused
- Runs tests after each task
- Suggests commit messages

**Command execution:**
- **Default**: Commands executed automatically (`QOS_AUTO_EXEC=1`)
- Uses non-interactive flags (`--yes`, `-y`, etc.)
- Never deletes `.kiro/` or `.kspec/` folders
- Logs all commands to `execution.log`

**Safety features:**
- ⚠️ **NEVER** deletes `.kiro/` or `.kspec/` folders
- ⚠️ **NEVER** runs commands that would overwrite these folders
- If tools complain about existing folders, works around it
- Destructive commands require confirmation

**Example:**
```bash
# Uses current spec
kspec /execute-tasks

# Or specify feature name
kspec /execute-tasks "User Authentication API"

# Disable auto-execution
QOS_AUTO_EXEC=0 kspec /execute-tasks

# Dry run (show commands only)
QOS_EXEC_DRY_RUN=1 kspec /execute-tasks
```

**Example interaction:**
```
[kspec] Feature folder: .kspec/specs/02-12-2025-user-authentication-api

Task 1.1: Add User model

Goal: Create User model with email and password fields
Acceptance Criteria: Model validates email format

Step 1: Write the test first (TDD - Red)
Creating: tests/models/user.test.js
✓ Test file created

Step 2: Run the test (should fail)
Running: npm test tests/models/user.test.js
✗ Test failed as expected (Red phase)

Step 3: Implement minimal code (TDD - Green)
Creating: src/models/user.model.js
✓ Implementation file created

Step 4: Run the test again
Running: npm test tests/models/user.test.js
✓ Test passed (Green phase)

Task 1.1 ✓ Complete

Moving to Task 1.2...
```

**When to use:**
- After `/create-tasks` when ready to implement
- When you want guided, step-by-step implementation
- When you want automatic command execution

**Important:**
- Feature name is **optional** (uses current spec)
- Commands are executed automatically by default
- Set `QOS_AUTO_EXEC=0` to disable auto-execution
- Set `QOS_EXEC_DRY_RUN=1` for dry run mode

---

### `/harvest-memory`

**Purpose:** Capture decisions, learnings, and follow-ups from implementation

**Usage:**
```bash
kspec /harvest-memory ["Feature Name"]
```

**What it does:**
1. Uses current spec (or finds by feature name if provided)
2. Reads `spec.md`, `tasks.md`, `execution.log`
3. Analyzes git history for this feature
4. Extracts key information
5. Creates/updates memory files

**Deliverables:**

**`.kspec/memory/decisions.md`:**
- Key architectural decisions made
- Technology choices and rationale
- Trade-offs considered
- Alternatives rejected and why
- Date and context for each decision

**`.kspec/memory/glossary.md`:**
- Domain-specific terms and definitions
- Technical concepts introduced
- Acronyms and abbreviations
- Business terminology
- Links to relevant documentation

**`.kspec/memory/follow-ups.md`:**
- Technical debt identified
- Future improvements needed
- Performance optimizations to consider
- Security concerns to address
- Refactoring opportunities
- Dependencies to upgrade

**Steering doc updates:**
- Patterns that should become standards
- Suggested updates to `.kiro/steering/*.md`
- New steering docs if needed

**Example:**
```bash
# Uses current spec
kspec /harvest-memory

# Or specify feature name
kspec /harvest-memory "User Authentication API"
```

**Example output:**
```
[kspec] Running memory harvest for: .kspec/specs/02-12-2025-user-authentication-api

Created/Updated:
- .kspec/memory/decisions.md
  * Decision: Use bcrypt cost factor 12 for password hashing
    Rationale: Balance between security and performance
    Date: 2025-12-02
  
  * Decision: JWT with RS256 instead of HS256
    Rationale: Asymmetric keys allow token verification without secret
    Date: 2025-12-02

- .kspec/memory/glossary.md
  * JWT: JSON Web Token, used for stateless authentication
  * bcrypt: Password hashing algorithm with configurable cost factor
  * Rate limiting: Technique to prevent abuse

- .kspec/memory/follow-ups.md
  * [ ] Add refresh token rotation for enhanced security
  * [ ] Implement account lockout after failed attempts
  * [ ] Add email verification for new registrations

Steering Doc Updates Recommended:
- .kiro/steering/security.md: Add JWT best practices section
- .kiro/steering/api-standards.md: Add rate limiting standards

Summary:
- 2 key decisions documented
- 3 glossary terms added
- 3 follow-ups identified
- 2 steering doc updates recommended
```

**When to use:**
- After `/execute-tasks` when feature is complete
- Before moving to the next feature
- To capture institutional knowledge
- To document decisions for future reference

**Important:**
- Feature name is **optional** (uses current spec)
- Always run this after completing a feature
- Memory files accumulate knowledge over time

---

## Environment Variables

### `QOS_DATE`

**Purpose:** Override the date used for spec folder naming

**Default:** Current date in DD-MM-YYYY format

**Usage:**
```bash
QOS_DATE=15-12-2025 kspec /create-spec "Feature Name"
```

**When to use:**
- When you want to use a specific date
- When creating specs for past or future dates
- For testing purposes

---

### `QOS_FAST`

**Purpose:** Enable non-interactive mode for CI/headless environments

**Default:** 0 (interactive)

**Usage:**
```bash
QOS_FAST=1 kspec /analyse
```

**What it does:**
- Adds `--no-interactive` flag to Kiro CLI commands
- Skips prompts and confirmations
- Uses default values

**When to use:**
- In CI/CD pipelines
- In automated scripts
- In headless environments

---

### `QOS_FORCE`

**Purpose:** Allow `/init` to overwrite existing agent files

**Default:** 0 (don't overwrite)

**Usage:**
```bash
QOS_FORCE=1 kspec /init
```

**When to use:**
- When you want to reset agent files
- When agent files are corrupted
- When updating to new agent versions

---

### `QOS_AUTO_EXEC`

**Purpose:** Control automatic command execution in `/execute-tasks`

**Default:** 1 (enabled)

**Usage:**
```bash
# Disable automatic execution
QOS_AUTO_EXEC=0 kspec /execute-tasks

# Enable automatic execution (default)
QOS_AUTO_EXEC=1 kspec /execute-tasks
```

**When to use:**
- Set to 0 when you want to review commands before execution
- Set to 1 (default) for fully automated execution

---

### `QOS_EXEC_DRY_RUN`

**Purpose:** Show commands without executing them

**Default:** 0 (execute commands)

**Usage:**
```bash
QOS_EXEC_DRY_RUN=1 kspec /execute-tasks
```

**What it does:**
- Shows all commands that would be executed
- Does not actually run any commands
- Useful for previewing what will happen

**When to use:**
- When you want to see what commands will run
- For testing and debugging
- Before running in production

**Note:** Overrides `QOS_AUTO_EXEC`

---

### `QOS_DEBUG`

**Purpose:** Enable detailed debug output

**Default:** 0 (disabled)

**Usage:**
```bash
QOS_DEBUG=1 kspec /create-spec "Feature Name"
```

**When to use:**
- When troubleshooting issues
- When you need detailed logging
- For development and debugging

---

## Command Cheat Sheet

```bash
# Setup
kspec /init                                    # Initialize kspec
kspec /status                                  # Check status

# Analysis
kspec /analyse                                 # Analyze repository
kspec /apply-standards                         # Update standards
kspec /check-consistency                       # Check for conflicts
kspec /reconcile-rules-standards               # Propose fixes

# Feature Development (simplified workflow)
kspec /create-spec "Feature Name"              # Create spec (sets current)
kspec /create-tasks                            # Generate tasks (uses current)
kspec /execute-tasks                           # Execute tasks (uses current)
kspec /harvest-memory                          # Capture learnings (uses current)

# With feature name override
kspec /create-tasks "Feature Name"             # Use specific feature
kspec /execute-tasks "Feature Name"            # Use specific feature
kspec /harvest-memory "Feature Name"           # Use specific feature

# With environment variables
QOS_DATE=15-12-2025 kspec /create-spec "Feature"
QOS_FAST=1 kspec /analyse
QOS_FORCE=1 kspec /init
QOS_AUTO_EXEC=0 kspec /execute-tasks
QOS_EXEC_DRY_RUN=1 kspec /execute-tasks
QOS_DEBUG=1 kspec /create-spec "Feature"
```

---

## Best Practices

1. **Always follow the phase gates:**
   - INIT → ANALYSE → APPLY → CREATE-SPEC → CREATE-TASKS → EXECUTE → HARVEST

2. **Use current spec feature:**
   - Only specify feature name when creating new specs
   - Let kspec track your current spec automatically

3. **Review before applying:**
   - Run `/check-consistency` before `/apply-standards`
   - Use `/reconcile-rules-standards` to preview changes

4. **Capture knowledge:**
   - Always run `/harvest-memory` after completing a feature
   - Review memory files regularly

5. **Protect kspec folders:**
   - Never manually delete `.kiro/` or `.kspec/` folders
   - kspec will prevent tools from removing these folders

6. **Use environment variables:**
   - Set `QOS_FAST=1` in CI/CD
   - Use `QOS_EXEC_DRY_RUN=1` to preview commands
   - Set `QOS_AUTO_EXEC=0` for manual control

---

## Troubleshooting

### Multiple specs found

**Problem:** kspec prompts you to select a spec

**Solution:**
```bash
# kspec will show a menu:
Multiple spec folders found. Please select one:
  1) 01-12-2025-feature-a
  2) 02-12-2025-feature-b

Enter number (1-2): 1

# Or specify the feature name:
kspec /create-tasks "feature-a"
```

### Agent files not created

**Problem:** `/init` doesn't create agent files

**Solution:**
```bash
# Force recreation
QOS_FORCE=1 kspec /init
```

### Commands getting stuck

**Problem:** Commands wait for user input

**Solution:**
```bash
# Use non-interactive mode
export CI=true
kspec /execute-tasks

# Or disable auto-execution
QOS_AUTO_EXEC=0 kspec /execute-tasks
```

### Tool wants to delete .kiro/ or .kspec/

**Problem:** Initialization tools complain about existing folders

**Solution:**
- kspec will prevent this automatically
- If a tool complains, work around it (use subdirectories, etc.)
- Never manually delete these folders

---

For more examples and walkthroughs, see [WALKTHROUGH.md](WALKTHROUGH.md).
