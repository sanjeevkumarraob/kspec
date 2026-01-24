# Example: Building a Todo App with kspec

This walkthrough shows kspec in action, from initial spec to completed implementation.

## Scenario

You want to build a simple CLI todo app with categories. Let's see how kspec structures this work.

## Step 1: Initialize kspec

```bash
$ kspec init

🚀 Welcome to kspec!

Date format for spec folders:
> YYYY-MM-DD (2026-01-22) - sorts chronologically

Command execution during build:
> Ask for permission (recommended)

Create steering doc templates?
> Yes

✅ kspec initialized!
```

## Step 2: Analyse Codebase (Optional for New Projects)

```bash
$ kspec analyse
```

For a new project, this creates initial steering docs. For existing projects, it analyzes your tech stack.

## Step 3: Create Specification

```bash
$ kspec spec "CLI Todo App with Categories"
```

This creates two files:
- `spec.md` - Full specification (see [spec.md](./spec.md))
- `spec-lite.md` - Concise version (see [spec-lite.md](./spec-lite.md))

## Step 4: Verify Specification

```bash
$ kspec verify-spec

✅ Spec verification passed
- All requirements are testable
- No ambiguous language detected
- Scope is appropriate for single feature
```

## Step 5: Generate Tasks

```bash
$ kspec tasks
```

Creates `tasks.md` with atomic, TDD-oriented tasks (see [tasks.md](./tasks.md)).

## Step 6: Verify Tasks

```bash
$ kspec verify-tasks

✅ Task verification passed
- All spec requirements have corresponding tasks
- Tasks follow TDD pattern
- No orphan tasks detected
```

## Step 7: Build

```bash
$ kspec build
```

The AI executes each task:

```
[kspec] Starting task 1/8: Set up project structure
[kspec] Writing test: test/cli.test.js
[kspec] Implementing: src/cli.js
[kspec] Running tests... ✅ 1 passed
[kspec] Task 1/8 complete

[kspec] Starting task 2/8: Implement todo storage
...
```

## Step 8: Final Verification

```bash
$ kspec verify

✅ Implementation verification passed
- All tests passing (24/24)
- All spec requirements implemented
- No drift detected from specification
```

## Step 9: Complete and Harvest Learnings

```bash
$ kspec done
```

Creates/updates `memory.md` (see [memory.md](./memory.md)) with learnings for future projects.

## Files in This Example

| File | Purpose |
|------|---------|
| [spec.md](./spec.md) | Full specification |
| [spec-lite.md](./spec-lite.md) | Concise spec for context preservation |
| [tasks.md](./tasks.md) | Implementation tasks with TDD approach |
| [memory.md](./memory.md) | Learnings harvested after completion |

## Key Takeaways

1. **Spec first** - We defined exactly what we wanted before any code
2. **Verification at each step** - Caught issues early, not after implementation
3. **TDD built-in** - Every task writes tests first
4. **Learnings captured** - Future todo apps benefit from this experience
