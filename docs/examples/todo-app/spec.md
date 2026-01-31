# Specification: CLI Todo App with Categories

**Created:** 2026-01-24
**Status:** Completed

## Overview

A command-line todo application that allows users to manage tasks with category organization, persistent storage, and filtering capabilities.

## Requirements

### Functional Requirements

#### FR1: Todo Management
- **FR1.1**: Add a new todo with description
- **FR1.2**: Mark a todo as complete
- **FR1.3**: Delete a todo
- **FR1.4**: List all todos (with status indicators)

#### FR2: Category Support
- **FR2.1**: Assign a category when creating a todo (optional, defaults to "general")
- **FR2.2**: Filter todos by category
- **FR2.3**: List all categories with todo counts

#### FR3: Persistence
- **FR3.1**: Store todos in a JSON file (`~/.todos.json`)
- **FR3.2**: Load todos on startup
- **FR3.3**: Save after every modification

### Non-Functional Requirements

#### NFR1: Usability
- **NFR1.1**: Commands should complete in < 100ms
- **NFR1.2**: Error messages should be clear and actionable
- **NFR1.3**: Help text available via `--help`

#### NFR2: Reliability
- **NFR2.1**: Graceful handling of corrupted JSON
- **NFR2.2**: No data loss on crash (atomic writes)

## User Interface

### Command Reference

```bash
# Add todo
todo add "Buy groceries" --category shopping
todo add "Fix login bug"  # defaults to "general"

# List todos
todo list                   # all todos
todo list --category work   # filter by category
todo list --done            # show completed
todo list --pending         # show pending only

# Complete todo
todo done 1                 # mark todo #1 as done

# Delete todo
todo delete 1               # remove todo #1

# Categories
todo categories             # list all categories with counts

# Help
todo --help
```

### Output Format

```
$ todo list
  ID  Status  Category   Description
  ──────────────────────────────────────────
  1   [ ]     shopping   Buy groceries
  2   [x]     work       Fix login bug
  3   [ ]     general    Call mom

$ todo categories
  Category    Count
  ─────────────────
  general     1
  shopping    1
  work        1
```

## Data Model

```json
{
  "todos": [
    {
      "id": 1,
      "description": "Buy groceries",
      "category": "shopping",
      "done": false,
      "createdAt": "2026-01-24T10:00:00Z"
    }
  ],
  "nextId": 2
}
```

## Technical Constraints

- **Language**: Node.js (matches kspec ecosystem)
- **Dependencies**: Minimal (prefer stdlib)
- **Storage**: JSON file in home directory
- **Testing**: Node.js built-in test runner

## Out of Scope

- Due dates / reminders
- Priority levels
- Multiple users / sync
- GUI / web interface
- Subtasks / nested todos

## Contract

The spec agent automatically generates this contract based on the requirements. `kspec verify` validates these rules before AI verification.

```json
{
  "output_files": [
    "package.json",
    "bin/todo.js",
    "src/store.js",
    "src/commands.js",
    "test/todo.test.js"
  ],
  "checks": [
    {
      "type": "contains",
      "file": "package.json",
      "text": "\"bin\":"
    },
    {
      "type": "contains",
      "file": "bin/todo.js",
      "text": "#!/usr/bin/env node"
    },
    {
      "type": "contains",
      "file": "src/commands.js",
      "text": "function add("
    },
    {
      "type": "contains",
      "file": "src/commands.js",
      "text": "function list("
    },
    {
      "type": "not_contains",
      "file": "src/store.js",
      "text": "console.log"
    }
  ]
}
```

## Acceptance Criteria

1. All FR requirements pass automated tests
2. All commands complete in < 100ms
3. Data persists across sessions
4. Corrupted JSON handled gracefully (reset with warning)
5. Zero external runtime dependencies
