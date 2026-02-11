---
name: kspec-tdd
displayName: "Test-Driven Development"
description: "Test-driven development best practices, patterns, and workflows for spec-driven projects"
keywords: ["tdd", "testing", "red-green-refactor", "test-first", "unit-test", "integration-test"]
author: kspec
version: 1.0.0
---

# kspec TDD Power

Test-driven development practices for use with kspec's spec-driven workflow. Guides agents through the Red-Green-Refactor cycle and provides patterns for common testing scenarios.

## Onboarding

When this power is active, the agent should:

1. Identify the project's test framework (node:test, Jest, Vitest, Mocha, pytest, etc.)
2. Check for existing test configuration and coverage thresholds
3. Follow the TDD cycle for every implementation task

## The TDD Cycle

### Step 1: Red (Write Failing Test)

Before writing any implementation code:

1. Read the task requirements from `tasks.md`
2. Write a test that captures the expected behavior
3. Run the test to confirm it FAILS (this validates the test itself)
4. If the test passes without new code, the test is wrong or the feature already exists

### Step 2: Green (Minimal Implementation)

1. Write the MINIMUM code to make the failing test pass
2. Do not add extra functionality, error handling, or optimization yet
3. Run tests to confirm the new test passes
4. Confirm no existing tests broke

### Step 3: Refactor (Clean Up)

1. Improve code structure without changing behavior
2. Remove duplication
3. Improve naming and readability
4. Run ALL tests after each refactoring step
5. Commit when tests pass

## Testing Patterns

### Unit Tests

- Test one function/method per test case
- Use descriptive test names: `it('returns null when user not found')`
- Arrange-Act-Assert structure in every test
- Mock external dependencies (database, HTTP, filesystem)
- Test behavior, not implementation details

### Integration Tests

- Test component interactions (e.g., service + database)
- Use real dependencies where practical (test databases, in-memory stores)
- Clean up state between tests (before/after hooks)
- Test error paths and edge cases

### Test Organization

```
test/
  unit/           # Fast, isolated tests
  integration/    # Component interaction tests
  e2e/            # Full user flow tests
  fixtures/       # Shared test data
  helpers/        # Shared test utilities
```

### Naming Conventions

- Test files: `{module}.test.{ext}` or `{module}.spec.{ext}`
- Describe blocks: Name of the module or function under test
- It blocks: Expected behavior in plain English

## Common Anti-Patterns to Avoid

1. **Testing implementation** - Test what a function returns, not how it works internally
2. **Brittle assertions** - Do not assert on exact formatting or order when irrelevant
3. **Shared mutable state** - Each test should set up its own state
4. **Giant setup blocks** - If setup is complex, the code under test needs refactoring
5. **Ignoring edge cases** - Always test: empty input, null, boundary values, error conditions
6. **Snapshot overuse** - Snapshots hide the intent; prefer explicit assertions

## Coverage Guidelines

- Aim for 80%+ line coverage on new code
- 100% coverage on critical paths (auth, payments, data mutation)
- Coverage is a guide, not a goal; 100% coverage with bad tests is worthless
- Untested code should be a conscious, documented decision

## Steering Instructions

When building with TDD:

- ALWAYS write the test first, run it, confirm it fails, then implement
- Mark each task complete in tasks.md only AFTER tests pass
- Commit after each Red-Green-Refactor cycle
- If a test is hard to write, the API design needs improvement
- Use the project's existing test framework and conventions
- Run the full test suite before marking a task complete
- When fixing bugs, write a failing test that reproduces the bug FIRST
