---
name: kspec-code-review
displayName: "Code Review"
description: "Code review checklists, patterns, and quality standards for thorough reviews"
keywords: ["code-review", "review", "quality", "checklist", "pull-request", "pr"]
author: kspec
version: 1.0.0
---

# kspec Code Review Power

Structured code review guidance for AI agents and human reviewers. Complements the kspec-review agent with detailed checklists and patterns.

## Onboarding

When this power is active, the agent should:

1. Read `.kiro/steering/` docs to understand project-specific standards
2. Check the current spec (if any) to understand the intent of changes
3. Apply the review checklist systematically

## Review Checklist

### 1. Correctness

- [ ] Does the code do what the spec/task requires?
- [ ] Are edge cases handled (null, empty, boundary values)?
- [ ] Are error conditions handled and surfaced appropriately?
- [ ] Does the logic match the acceptance criteria?

### 2. Security

- [ ] No hardcoded secrets, API keys, or passwords
- [ ] Input validation on all user-provided data
- [ ] SQL parameterization (no string concatenation in queries)
- [ ] No eval(), Function(), or dynamic code execution
- [ ] Authentication/authorization checked on all protected routes
- [ ] Sensitive data not logged or exposed in error messages
- [ ] Dependencies from trusted sources with no known vulnerabilities

### 3. Testing

- [ ] Tests exist for new functionality
- [ ] Tests cover happy path AND error paths
- [ ] Tests are independent (no shared mutable state)
- [ ] Test names describe expected behavior
- [ ] No skipped tests without explanation
- [ ] Integration tests for cross-component changes

### 4. Code Quality

- [ ] Functions have a single responsibility
- [ ] No duplicate code (DRY but not at the expense of readability)
- [ ] Variable and function names are descriptive
- [ ] Comments explain WHY, not WHAT
- [ ] No TODO/FIXME without a tracking issue
- [ ] Consistent with project's existing patterns and style

### 5. Performance

- [ ] No N+1 query patterns
- [ ] No unnecessary synchronous operations blocking the event loop
- [ ] Large data sets paginated or streamed
- [ ] Database queries use appropriate indexes
- [ ] No memory leaks (unclosed connections, growing arrays, unbounded caches)

### 6. API Design

- [ ] Public APIs are documented
- [ ] Breaking changes are versioned or flagged
- [ ] Error responses follow consistent format
- [ ] Input/output types are explicit

### 7. Operations

- [ ] Logging is sufficient for debugging but not excessive
- [ ] Configuration is externalized (not hardcoded)
- [ ] Database migrations are reversible

## Review Verdicts

- **APPROVE** - Code is ready to merge. Minor nits can be noted but should not block.
- **REQUEST_CHANGES** - Specific issues must be addressed before merge.
- **COMMENT** - Questions or suggestions that do not block merge.

## Review Output Format

```
## Review: [Brief Summary]

**Verdict**: APPROVE | REQUEST_CHANGES | COMMENT

### Issues (if REQUEST_CHANGES)
1. **[Category]** `path/to/file.js:42` - Description of issue
   - Suggestion: How to fix it

### Observations
- Positive observations about good patterns used
- Suggestions for future improvements (non-blocking)

### Spec Compliance
- Requirements covered: X/Y
- Missing: [list any gaps]
```

## Steering Instructions

When reviewing code:

- Review against the spec first, style second
- Be specific: reference file paths and line numbers
- Suggest fixes, do not just identify problems
- Distinguish blocking issues from style preferences
- If no spec exists, review against steering docs and general best practices
- Check git diff for accidental file additions (debug files, IDE config, .env)
- Acknowledge good work; reviews are not just for finding faults
