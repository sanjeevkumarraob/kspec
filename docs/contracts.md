# kspec Contracts

Contracts allow you to enforce structured outputs and invariants in your specifications. This ensures that the implementation satisfies specific deterministic requirements, making agent handoffs safer and preventing regression.

## The Concept

In agentic workflows, "context loss" is a major challenge. An agent might forget to create a specific configuration file or might leave behind debug code.
A **Contract** is a JSON-based agreement in your `spec.md` that explicitly lists:
1.  Files that *must* be created.
2.  Text patterns that *must* (or *must not*) appear in specific files.

`kspec verify` checks these contracts *before* asking the LLM to verify, providing a reliable automated baseline.

## Schema Reference

Add a `## Contract` section to your `spec.md` with a JSON code block:

```json
{
  "output_files": [
    "Start by listing expected files here"
  ],
  "checks": [
    {
      "type": "contains",
      "file": "path/to/file",
      "text": "string that must exist"
    },
    {
      "type": "not_contains",
      "file": "path/to/file",
      "text": "string that must NOT exist"
    }
  ]
}
```

## Examples

### 1. Greenfield Project (New Weather CLI)

**Scenario**: You are building a new CLI tool and want to ensure the project structure is correct from the start.

**spec.md**:
```markdown
# Weather CLI Spec

## Requirements
...

## Contract

\`\`\`json
{
  "output_files": [
    "package.json",
    "README.md",
    "bin/weather.js",
    "src/lib/api.js"
  ],
  "checks": [
    {
      "type": "contains",
      "file": "package.json",
      "text": "\"bin\": {"
    },
    {
      "type": "contains",
      "file": "bin/weather.js",
      "text": "#!/usr/bin/env node"
    }
  ]
}
\`\`\`
```

### 2. Brownfield Project (Legacy E-commerce Refactor)

**Scenario**: You are refactoring a legacy API. You want to ensure you don't accidentally delete the legacy config file or leave `console.log` debug statements.

**spec.md**:
```markdown
# Refactoring Payment Gateway

## Requirements
...

## Contract

\`\`\`json
{
  "output_files": [
    "config/legacy-payments.json",  // MUST NOT be deleted
    "src/new-payment-service.ts"
  ],
  "checks": [
    {
      "type": "not_contains",
      "file": "src/new-payment-service.ts",
      "text": "console.log"
    },
    {
      "type": "contains",
      "file": ".env.example",
      "text": "STRIPE_SECRET_KEY="
    }
  ]
}
\`\`\`
```

## Integration

When you run `kspec verify`, the CLI automatically parses the contract:
1.  **Validates** that all `output_files` exist.
2.  **Runs** all `checks` against file content.
3.  **Reports** pass/fail status to you and the `kspec-verify` agent.

If the contract fails, the agent is informed, allowing it to fix the specific issues (e.g., "Missing file: bin/weather.js") before attempting more complex verification.
