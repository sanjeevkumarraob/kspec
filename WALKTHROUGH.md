# kspec Walkthrough: Building a User Authentication API

This walkthrough demonstrates the complete kspec workflow using a realistic scenario: building a user authentication API for a Node.js/Express application.

## Scenario Overview

You're working on a web application that needs user authentication. The requirements are:
- JWT-based authentication
- User registration and login endpoints
- Password hashing with bcrypt
- Rate limiting for security
- OpenAPI specification for the API

## Prerequisites

1. Install kspec (clone the repo and run install script)
2. Ensure you have Kiro CLI installed and configured
3. Navigate to your project root directory

## Step-by-Step Walkthrough

### Phase 1: Initialize kspec

Start by initializing kspec in your project:

```bash
kspec /init
```

**What happens:**
- Creates `.kspec/` directory structure
- Scaffolds templates and standards files
- Creates Kiro CLI agents in `.kiro/agents/`
- Sets up Project Steering in `.kiro/steering/`

**Expected output:**
```
Initialized .kspec templates
Initialized Project Rules in .kiro/steering
Agent written: .kiro/agents/kspec-analyse.json
Agent written: .kiro/agents/kspec-apply-standards.json
Agent written: .kiro/agents/kspec-create-spec.json
Agent written: .kiro/agents/kspec-create-tasks.json
Agent written: .kiro/agents/kspec-execute-tasks.json
Agent written: .kiro/agents/kspec-harvest-memory.json
kspec init complete.
```

**Directory structure created:**
```
.kiro/
├── steering/                # Authoritative project rules
│   ├── 01-coding-standards.md
│   ├── 02-api-guidelines.md
│   ├── 03-security.md
│   └── 04-testing.md
└── agents/                  # Per-project kspec agents
    ├── kspec-analyse.json
    ├── kspec-apply-standards.json
    ├── kspec-create-spec.json
    ├── kspec-create-tasks.json
    ├── kspec-execute-tasks.json
    └── kspec-harvest-memory.json

.kspec/
├── specs/                   # Feature specifications (AU date-based folders)
├── instructions/
│   ├── core/               # Core workflow templates
│   └── meta/               # Pre/post-flight checklists
├── standards/              # Derived standards (from steering)
├── memory/                 # Decisions, glossary, follow-ups
└── examples/              # Example templates
```

### Phase 2: Check Status

Check your kspec setup:

```bash
kspec /status
```

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

Current Spec: (none)

Steering Fingerprint: a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4

Initialized: yes
Specs: 0
```

### Phase 3: Analyze Repository (Read-Only)

Analyze your existing codebase to understand the tech stack and identify standards:

```bash
kspec /analyse
```

**What happens:**
- Scans your repository for technology indicators
- Identifies architecture, domains, and boundaries
- Finds risks, hotspots, and technical debt
- Proposes updates to steering and standards docs
- **Read-only** - no files are modified

**Example output for a Node.js project:**
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
- .kspec/standards/tech-stack.md: Add Node.js 18+, Express 4.x, Jest
- .kspec/standards/code-style.md: Add ESLint rules, Prettier config
- .kiro/steering/03-security.md: Add password hashing requirements

Next recommended kspec phase: run /apply-standards
```

### Phase 4: Apply Standards

Apply the proposed changes to align standards with steering and reality:

```bash
kspec /apply-standards
```

**What happens:**
- Reads steering docs (.kiro/steering/*.md)
- Reads current standards (.kspec/standards/*.md)
- Analyzes repo to understand actual tech stack
- Proposes and writes updated standards files
- Updates rules fingerprint

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
+ Formatting: Prettier with 2-space indentation

Summary:
- Updated tech-stack.md with current stack
- Updated code-style.md with project conventions
- No conflicts with steering docs
- All standards now reflect repository reality
```

### Phase 5: Create Feature Specification

Create a specification for the authentication feature:

```bash
kspec /create-spec "User Authentication API"
```

**What happens:**
- Creates date-based folder: `.kspec/specs/02-12-2025-user-authentication-api/`
- Sets this as the current spec (stored in `.kspec/.current_spec`)
- Reads steering docs and standards
- Creates detailed `spec.md` and condensed `spec-lite.md`

**Example folder structure:**
```
.kspec/specs/02-12-2025-user-authentication-api/
├── spec.md              # Detailed specification
└── spec-lite.md         # Executive summary
```

**Example spec.md content:**
```markdown
# User Authentication API Specification

## Problem/Context
Building JWT-based authentication system for web application.
Current system has no authentication, need secure user management.

## Functional Requirements

### FR-1: User Registration
- System SHALL accept email and password for new users
- System SHALL validate email format
- System SHALL enforce password strength (min 8 chars, uppercase, lowercase, number)
- System SHALL hash passwords with bcrypt (cost factor 12)

### FR-2: User Login
- System SHALL authenticate users with email/password
- System SHALL return JWT token on successful login
- System SHALL return 401 on invalid credentials

### FR-3: Token Management
- System SHALL use JWT with RS256 algorithm
- System SHALL set token expiration to 1 hour
- System SHALL provide refresh token endpoint

## Non-Functional Requirements

### NFR-1: Security
- Password hashing with bcrypt (cost 12)
- JWT tokens with RS256
- Rate limiting: 5 attempts per minute per IP
- Input validation and sanitization

### NFR-2: Performance
- Login response time < 200ms
- Registration response time < 500ms

## Constraints
- Node.js 18+ runtime
- Express.js 4.x framework
- No external auth providers (OAuth future phase)

## High-Level Design

### API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

### Components
- User Model (data layer)
- Auth Controller (business logic)
- Auth Middleware (JWT verification)
- Rate Limiter (security)

## References
- .kiro/steering/01-coding-standards.md: Follow ESLint rules
- .kiro/steering/02-api-guidelines.md: OpenAPI spec required
- .kiro/steering/03-security.md: Password hashing, input validation
- .kiro/steering/04-testing.md: TDD approach, unit + integration tests

Next step → run: kspec /create-tasks "User Authentication API"
```

### Phase 6: Generate Tasks (Simplified!)

Convert the specification into actionable, TDD-ready tasks.

**Note:** You don't need to specify the feature name anymore!

```bash
kspec /create-tasks
```

**What happens:**
- Uses the current spec (set in Phase 5)
- Reads spec.md and spec-lite.md
- Generates numbered, TDD-friendly task list
- Includes test-first approach, dependencies, and file paths

**Example tasks.md:**
```markdown
# User Authentication API - Tasks

## 1. Database Setup
- [ ] 1.1 Add User model with fields: id, email, passwordHash, createdAt
- [ ] 1.2 Create users table migration
- **Test**: User model validates email format
- **Files**: src/models/user.model.js, migrations/001_create_users.js

## 2. Password Security
- [ ] 2.1 Install bcrypt dependency
- [ ] 2.2 Implement password hashing function (cost 12)
- [ ] 2.3 Implement password comparison function
- **Test**: Password hashing and verification work correctly
- **Files**: src/auth/password.service.js, tests/auth/password.test.js

## 3. Registration Endpoint
- [ ] 3.1 Create POST /api/auth/register endpoint
- [ ] 3.2 Validate email format and password strength
- [ ] 3.3 Hash password before storage
- [ ] 3.4 Return 201 with user data (no password)
- **Test**: Successful registration creates user
- **Test**: Invalid email returns 400
- **Test**: Weak password returns 400
- **Test**: Duplicate email returns 409
- **Files**: src/auth/auth.controller.js, tests/auth/register.test.js

## 4. Login Endpoint
- [ ] 4.1 Create POST /api/auth/login endpoint
- [ ] 4.2 Verify credentials against database
- [ ] 4.3 Generate JWT token on success
- [ ] 4.4 Return 401 on invalid credentials
- **Test**: Valid credentials return JWT
- **Test**: Invalid credentials return 401
- **Test**: JWT contains correct user data
- **Files**: src/auth/auth.controller.js, tests/auth/login.test.js

## 5. JWT Implementation
- [ ] 5.1 Install jsonwebtoken dependency
- [ ] 5.2 Create JWT signing function (RS256)
- [ ] 5.3 Create JWT verification middleware
- [ ] 5.4 Handle token expiration
- **Test**: Valid tokens allow access
- **Test**: Invalid tokens return 401
- **Test**: Expired tokens return 401
- **Files**: src/auth/jwt.service.js, src/middleware/auth.middleware.js

## 6. Rate Limiting
- [ ] 6.1 Install express-rate-limit dependency
- [ ] 6.2 Configure rate limiter (5 attempts/minute)
- [ ] 6.3 Apply to auth endpoints
- **Test**: Rate limiting blocks excessive requests
- **Files**: src/middleware/rate-limit.middleware.js

## 7. OpenAPI Documentation
- [ ] 7.1 Create api/auth.openapi.yaml
- [ ] 7.2 Document all endpoints with examples
- [ ] 7.3 Add security schemes (JWT)
- **Test**: Spec validates with OpenAPI tools
- **Files**: api/auth.openapi.yaml

Summary:
- Total tasks: 7 major, 23 sub-tasks
- Estimated complexity: Medium
- Critical path: Tasks 1-4 must be sequential
- Tasks 5-7 can run in parallel after Task 4

Next step → run: kspec /execute-tasks
```

### Phase 7: Execute Tasks (Simplified!)

Execute the tasks with TDD guidance.

**Note:** Again, no feature name needed!

```bash
kspec /execute-tasks
```

**What happens:**
- Uses the current spec automatically
- Guides through each task step-by-step
- Follows TDD: Red → Green → Refactor
- Executes commands automatically (QOS_AUTO_EXEC=1 by default)
- Logs all commands to execution.log
- **CRITICAL**: Never deletes .kiro/ or .kspec/ folders

**Example interaction:**
```
[kspec] Feature folder: .kspec/specs/02-12-2025-user-authentication-api

Starting execution for: User Authentication API

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task 1.1: Add User model

Goal: Create User model with email and password fields
Acceptance Criteria: Model validates email format

Step 1: Write the test first (TDD - Red)
Creating: tests/models/user.test.js

[Test code generated...]

Step 2: Run the test (should fail)
Running: npm test tests/models/user.test.js
✗ Test failed as expected (Red phase)

Step 3: Implement minimal code (TDD - Green)
Creating: src/models/user.model.js

[Implementation code generated...]

Step 4: Run the test again
Running: npm test tests/models/user.test.js
✓ Test passed (Green phase)

Step 5: Refactor if needed
No refactoring needed at this stage.

Task 1.1 ✓ Complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Moving to Task 1.2...
```

**Safety Features:**
- If a tool tries to delete .kiro/ or .kspec/, execution stops
- Non-interactive commands are used (--yes flags)
- Destructive commands require confirmation
- All commands logged to execution.log

### Phase 8: Harvest Memory (Simplified!)

Capture decisions and learnings from the implementation.

**Note:** No feature name needed!

```bash
kspec /harvest-memory
```

**What happens:**
- Uses the current spec automatically
- Reads spec, tasks, and execution log
- Analyzes git history for this feature
- Creates/updates memory files

**Example output:**
```
[kspec] Running memory harvest for: .kspec/specs/02-12-2025-user-authentication-api

Reading feature documentation...
Analyzing implementation decisions...
Extracting glossary terms...
Identifying follow-ups...

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
  * Rate limiting: Technique to prevent abuse by limiting request frequency

- .kspec/memory/follow-ups.md
  * [ ] Add refresh token rotation for enhanced security
  * [ ] Implement account lockout after failed attempts
  * [ ] Add email verification for new registrations
  * [ ] Consider adding OAuth providers (Google, GitHub)

Steering Doc Updates Recommended:
- .kiro/steering/03-security.md: Add JWT best practices section
- .kiro/steering/02-api-guidelines.md: Add rate limiting standards

Summary:
- 2 key decisions documented
- 3 glossary terms added
- 4 follow-ups identified
- 2 steering doc updates recommended
```

## Simplified Workflow Summary

The new workflow is much simpler - you only specify the feature name once:

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

## Working with Multiple Specs

If you have multiple specs and no current spec is set, kspec will prompt you:

```bash
$ kspec /create-tasks

Multiple spec folders found. Please select one:
  1) 01-12-2025-user-authentication-api
  2) 02-12-2025-payment-processing

Enter number (1-2): 1

[kspec] Feature folder: .kspec/specs/01-12-2025-user-authentication-api
```

## Environment Variables

Customize kspec behavior:

```bash
# Use custom date for folder naming
QOS_DATE=15-12-2025 kspec /create-spec "Payment Processing"

# Enable non-interactive mode for CI
QOS_FAST=1 kspec /analyse

# Force overwrite existing agent files during init
QOS_FORCE=1 kspec /init

# Disable automatic command execution
QOS_AUTO_EXEC=0 kspec /execute-tasks

# Show commands without executing (dry run)
QOS_EXEC_DRY_RUN=1 kspec /execute-tasks
```

## Best Practices

### 1. Follow the Phase Gates
Always follow the sequence: INIT → ANALYSE → APPLY → CREATE-SPEC → CREATE-TASKS → EXECUTE → HARVEST

### 2. Use Current Spec Feature
- Let kspec track your current spec automatically
- Only specify feature name when creating new specs
- Switch specs by creating a new one or selecting from the prompt

### 3. Review Standards Regularly
- Run `/analyse` periodically to keep standards current
- Run `/apply-standards` after major tech stack changes

### 4. Leverage Memory System
- Always run `/harvest-memory` after completing a feature
- Review memory files to capture institutional knowledge

### 5. Protect kspec Folders
- Never manually delete .kiro/ or .kspec/ folders
- kspec will prevent tools from removing these folders

## Troubleshooting

### Common Issues

**Multiple specs found:**
```bash
# kspec will prompt you to select one
kspec /create-tasks
# Or specify the feature name to find it
kspec /create-tasks "User Authentication"
```

**Agent files not created:**
```bash
# Force recreation of agent files
QOS_FORCE=1 kspec /init
```

**Commands getting stuck:**
```bash
# Use non-interactive mode
export CI=true
kspec /execute-tasks
```

**Tool wants to delete .kiro/ or .kspec/:**
```bash
# kspec will prevent this automatically
# If a tool complains, work around it (use subdirectories, etc.)
```

## Example Project Structure After Completion

```
your-project/
├── .kiro/
│   ├── steering/
│   │   ├── 01-coding-standards.md
│   │   ├── 02-api-guidelines.md
│   │   ├── 03-security.md
│   │   └── 04-testing.md
│   └── agents/
│       ├── kspec-analyse.json
│       ├── kspec-apply-standards.json
│       ├── kspec-create-spec.json
│       ├── kspec-create-tasks.json
│       ├── kspec-execute-tasks.json
│       └── kspec-harvest-memory.json
├── .kspec/
│   ├── .current_spec                    # Points to current spec
│   ├── .rules_fingerprint               # Steering docs fingerprint
│   ├── specs/
│   │   └── 02-12-2025-user-authentication-api/
│   │       ├── spec.md
│   │       ├── spec-lite.md
│   │       ├── tasks.md
│   │       └── execution.log
│   ├── standards/
│   │   ├── tech-stack.md
│   │   └── code-style.md
│   ├── memory/
│   │   ├── decisions.md
│   │   ├── glossary.md
│   │   └── follow-ups.md
│   └── examples/
├── src/
│   ├── models/
│   │   └── user.model.js
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── password.service.js
│   │   └── jwt.service.js
│   └── middleware/
│       ├── auth.middleware.js
│       └── rate-limit.middleware.js
├── tests/
│   ├── models/
│   └── auth/
├── api/
│   └── auth.openapi.yaml
└── package.json
```

This walkthrough demonstrates how kspec provides structure and guidance for feature development with a simplified, context-aware workflow.
