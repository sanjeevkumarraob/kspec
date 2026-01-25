# Spec-Driven Development with kspec

A methodology for building software with AI that actually works.

## The Problem

AI coding assistants are powerful but flawed:

1. **Context Loss** - AI forgets what you're building mid-conversation
2. **Scope Creep** - Without clear specs, AI adds unnecessary features
3. **No Verification** - You ship code that doesn't match requirements
4. **Lost Learnings** - Each session starts from zero; mistakes repeat

These problems compound. A feature that should take hours takes days. Code quality suffers. You lose trust in AI-assisted development.

## The Solution: Spec-Driven Development

kspec enforces a disciplined workflow that makes AI predictable and reliable:

```
analyse → spec → verify-spec → tasks → verify-tasks → build → verify → done
```

### Principle 1: Specs Before Code

Never let AI write code without a specification.

**Without specs:**
```
You: "Build user authentication"
AI: *builds OAuth, JWT, sessions, MFA, password reset, email verification...*
You: "I just wanted basic login"
```

**With specs:**
```
spec.md defines:
- Email/password login only
- JWT tokens, 24h expiry
- No OAuth (Phase 2)
- No MFA (Phase 2)
```

The AI now has guardrails. It builds what you need, not what it assumes.

### Principle 2: Context That Survives

AI context windows are limited. Long conversations get compressed or truncated. Your requirements disappear.

**kspec's solution: CONTEXT.md**

```markdown
# CONTEXT.md (auto-generated)

## Current Spec
2026-01-24-user-auth

## Progress
Task 3/12: Implement JWT validation

## Requirements Summary
(from spec-lite.md - always fits in context)

## Key Decisions
- Using bcrypt for passwords (memory.md)
- Token refresh via sliding window (memory.md)
```

Every kspec agent reads CONTEXT.md first. When context compresses, state survives.

### Principle 3: Verify Early, Verify Often

Bugs found late cost 10x more to fix. kspec verifies at every step:

| Phase | Verification | Catches |
|-------|--------------|---------|
| After spec | `verify-spec` | Missing requirements, ambiguity |
| After tasks | `verify-tasks` | Incomplete task coverage |
| After build | `verify` | Implementation drift from spec |

Drift is caught before it compounds.

### Principle 4: Harvest and Compound Learnings

Every project teaches something. Most teams lose this knowledge.

kspec's `done` command harvests learnings into `memory.md`:

```markdown
## Learnings
- bcrypt cost factor 12 is too slow for tests; use 4 in test env
- JWT refresh tokens need separate expiry from access tokens
- Rate limiting on /login prevents brute force (add to tech.md)
```

These learnings inform future specs. Your AI gets smarter over time.

### Principle 5: Human-AI Collaboration, Not Replacement

kspec doesn't automate away developers. It structures the collaboration:

| Human Does | AI Does |
|------------|---------|
| Define requirements | Draft specifications |
| Approve specs | Generate implementation tasks |
| Review code | Execute tasks with TDD |
| Make architecture decisions | Verify against specs |

You remain in control. AI handles the tedium.

## The Workflow in Practice

### Phase 1: Analyse
```bash
kspec analyse
```
AI examines your codebase, updates steering docs (product.md, tech.md, testing.md). These docs guide all future work.

### Phase 2: Specify
```bash
kspec spec "User Authentication"
# or from Jira:
kspec spec --jira PROJ-123 "User Authentication"
```
Creates `spec.md` (detailed) and `spec-lite.md` (concise, for context preservation).

### Phase 3: Verify Spec
```bash
kspec verify-spec
```
AI checks: Are requirements complete? Any ambiguity? Any conflicts with existing code?

### Phase 4: Generate Tasks
```bash
kspec tasks
```
AI breaks spec into atomic, testable tasks with TDD approach.

### Phase 5: Verify Tasks
```bash
kspec verify-tasks
```
AI checks: Do tasks cover all spec requirements? Any gaps?

### Phase 6: Build
```bash
kspec build
```
AI executes tasks one by one:
1. Write failing test
2. Implement to pass test
3. Run tests
4. Mark task complete
5. Commit

### Phase 7: Final Verification
```bash
kspec verify
```
AI verifies: Does implementation match spec? All tests pass? Any drift?

### Phase 8: Complete
```bash
kspec done
```
Harvests learnings, updates memory, closes the loop.

## Why This Works

### For Solo Developers
- Structured process prevents "just one more feature" scope creep
- Context preservation means you can pause and resume days later
- Memory accumulates your personal best practices

### For Teams
- Specs are shareable artifacts for code review
- Tasks integrate with Jira for project management
- Steering docs ensure consistency across team members

### For Enterprises
- Bidirectional Jira sync bridges BA/PM and developers
- Audit trail from requirement to implementation
- Learnings become organizational knowledge

## Comparison to Other Approaches

### vs. Vibe Coding (No Structure)
Vibe coding works for prototypes. It fails for production:
- No verification = bugs ship
- No context preservation = repeated mistakes
- No memory = no improvement over time

### vs. Traditional TDD
TDD is great but doesn't address AI-specific problems:
- Doesn't solve context loss
- Doesn't create specs from requirements
- Doesn't integrate with project management

### vs. Other Spec Tools
kspec's unique contributions:
- **CONTEXT.md** - Survives AI context compression
- **memory.md** - Compounds learnings across projects
- **Jira integration** - Enterprise-ready from day one
- **Verification at every step** - Not just at the end

## Getting Started

```bash
npm install -g kspec
kspec init
kspec analyse
kspec spec "Your First Feature"
```

See the [README](../README.md) for complete documentation.
