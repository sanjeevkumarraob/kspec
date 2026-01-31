---
name: kspec-contract
description: Enforce structured outputs and checks in kspec
author: kspec
version: 1.0.0
---

# kspec Contract Power

This power helps you define and enforce contracts in your kspec specifications. Contracts ensure deterministic outputs and invariants.

## Usage

Add a `## Contract` section to your `spec.md` with a JSON block defining:
- `output_files`: List of files that must exist.
- `checks`: List of content checks (contains/not_contains).

## Schema

```json
{
  "output_files": [
    "path/to/file1",
    "path/to/file2"
  ],
  "checks": [
    {
      "type": "contains",
      "file": "path/to/file1",
      "text": "required string"
    },
    {
      "type": "not_contains",
      "file": "path/to/file2",
      "text": "forbidden string"
    }
  ]
}
```

## Example

```markdown
## Contract

\`\`\`json
{
  "output_files": ["package.json"],
  "checks": [
    {
      "type": "contains",
      "file": "package.json",
      "text": "\"name\": \"my-app\""
    }
  ]
}
\`\`\`
```
