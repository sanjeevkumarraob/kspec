---
name: kspec-document
displayName: "Documentation"
description: "Help agents create and maintain project documentation following best practices"
keywords: ["documentation", "readme", "contributing", "changelog", "api-docs", "architecture"]
author: kspec
version: 1.0.0
---

# kspec Documentation Power

Guidance for AI agents on creating and maintaining comprehensive project documentation. Covers README files, CONTRIBUTING guides, CHANGELOGs, API docs, and architecture decision records.

## Onboarding

When this power is active, the agent should:

1. Check for existing documentation files in the project root and `docs/` directory
2. Identify gaps in documentation coverage
3. Follow the standards below

## Documentation Standards

### README.md

Every project README should contain these sections in order:

1. **Title and badges** - Project name, npm version, license, CI status
2. **One-line description** - What it does in a single sentence
3. **Why section** - Problem it solves (table format works well)
4. **Installation** - How to install
5. **Quick Start** - Minimal example to get running in under 2 minutes
6. **Usage** - Detailed usage with code examples
7. **Configuration** - All config options with defaults
8. **API Reference** - Link to generated docs or inline if small
9. **Contributing** - Link to CONTRIBUTING.md
10. **License** - License type with link

### CONTRIBUTING.md

Should include:

- Development setup (clone, install, test)
- Branch naming conventions
- Commit message format
- Pull request process
- Code style and linting rules
- Testing requirements (coverage thresholds)

### CHANGELOG.md

Follow Keep a Changelog format (https://keepachangelog.com/):

- Group changes: Added, Changed, Deprecated, Removed, Fixed, Security
- Date format: YYYY-MM-DD
- Link each version to a git diff
- Unreleased section at top for pending changes

### API Documentation

- Document every public function with: description, parameters, return type, example
- Use JSDoc or TSDoc inline comments
- Generate API reference from source when possible
- Include error cases and edge cases in examples

### Architecture Decision Records (ADRs)

Store in `docs/adr/` with format:

- `NNN-title.md` (e.g., `001-use-postgresql.md`)
- Sections: Status, Context, Decision, Consequences
- Never delete ADRs; supersede them with new ones

## Steering Instructions

When generating or updating documentation:

- Write for the reader who has never seen the project before
- Include working code examples (tested, not pseudocode)
- Keep README under 500 lines; link to detailed docs for more
- Use tables for structured information (commands, config options)
- Include both CLI and programmatic usage if applicable
- Update documentation when changing public APIs
- Do not document internal implementation details in public docs
- Use consistent heading hierarchy (h1 for title only, h2 for sections)
