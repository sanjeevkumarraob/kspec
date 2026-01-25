# CLI Todo App with Categories (Summary)

**Purpose:** CLI todo manager with categories and persistence.

## Core Features
- Add/complete/delete todos
- Optional category assignment (default: "general")
- Filter by category, list categories with counts
- JSON storage in ~/.todos.json

## Commands
```
todo add "text" [--category X]
todo list [--category X] [--done|--pending]
todo done <id>
todo delete <id>
todo categories
```

## Constraints
- Node.js, minimal dependencies
- < 100ms response time
- Graceful JSON corruption handling

## Out of Scope
Due dates, priorities, sync, GUI, subtasks
