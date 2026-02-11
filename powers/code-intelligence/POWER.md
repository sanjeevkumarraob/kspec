---
name: kspec-code-intelligence
displayName: "Code Intelligence"
description: "Configure and use code intelligence with tree-sitter and LSP for enhanced AI assistance"
keywords: ["code-intelligence", "tree-sitter", "lsp", "language-server", "indexing", "navigation"]
author: kspec
version: 1.0.0
---

# kspec Code Intelligence Power

How to set up and use Kiro's code intelligence features for enhanced AI understanding of your codebase. Code intelligence provides structural awareness (symbols, references, definitions) beyond simple text search.

## Onboarding

When this power is active, the agent should:

1. Check if code intelligence is initialized (run `/code status`)
2. If not initialized, inform the user about `/code init`
3. Leverage code intelligence for navigation, refactoring, and understanding

## What Code Intelligence Provides

### Tree-Sitter (Built-in, No Setup)

- **Symbol extraction** - Functions, classes, methods, variables, types
- **Scope analysis** - Where variables are defined and used
- **Syntax-aware search** - Find all function definitions (not just text matches)
- **18 languages** - JS, TS, Python, Rust, Go, Java, C/C++, Ruby, and more

### LSP (Optional, Enhanced)

Language Server Protocol provides deeper intelligence:

- **Go-to-definition** - Jump to where a symbol is defined
- **Find references** - Find all usages of a symbol across the codebase
- **Type information** - Full type inference and checking
- **Diagnostics** - Real-time errors and warnings
- **Auto-complete** - Context-aware suggestions

## Setup

### Initialize

Inside Kiro IDE or kiro-cli:

```
/code init
```

Scans your project and sets up tree-sitter indexing. For projects with an LSP server, it configures the language server connection.

### Verify

```
/code status
```

Shows which languages are indexed and whether LSP is active.

### Supported Languages

| Language | Tree-Sitter | Common LSP |
|----------|-------------|------------|
| JavaScript/TypeScript | Built-in | tsserver |
| Python | Built-in | pylsp, pyright |
| Rust | Built-in | rust-analyzer |
| Go | Built-in | gopls |
| Java | Built-in | jdtls |
| C/C++ | Built-in | clangd |

## How kspec Agents Use Code Intelligence

### During Analysis (`kspec analyse`)

Understand project structure, key abstractions, and module relationships.

### During Spec Writing (`kspec spec`)

Reference existing interfaces, type definitions, and module boundaries.

### During Building (`kspec build`)

Accurate imports, type-aware code generation, follow existing patterns.

### During Review (`kspec review`)

Check architectural patterns, verify all callers updated, type safety across boundaries.

## Steering Instructions

When code intelligence is available:

- Use `/code` commands before making structural changes to understand impact
- Reference specific symbols by their fully-qualified names in specs
- During refactoring, use find-references to ensure all usages are updated
- Do not manually re-index; Kiro handles incremental updates automatically
- If code intelligence seems outdated, run `/code init` to re-index
