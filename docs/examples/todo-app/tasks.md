# Tasks: CLI Todo App with Categories

## Implementation Tasks

- [x] **Task 1: Set up project structure**
  - Create package.json with bin entry
  - Create src/cli.js, src/store.js, src/commands.js
  - Create test/ directory
  - Test: CLI runs and shows help

- [x] **Task 2: Implement todo storage (FR3)**
  - Create store.js with load/save functions
  - Store in ~/.todos.json
  - Handle missing file (create empty)
  - Handle corrupted JSON (reset with warning)
  - Test: load/save round-trip works
  - Test: corrupted file handled gracefully

- [x] **Task 3: Implement "add" command (FR1.1, FR2.1)**
  - Parse description and optional --category
  - Default category to "general"
  - Assign incrementing ID
  - Save to store
  - Test: add without category
  - Test: add with category
  - Test: IDs increment correctly

- [x] **Task 4: Implement "list" command (FR1.4, FR2.2)**
  - Display all todos in table format
  - Show ID, status, category, description
  - Support --category filter
  - Support --done and --pending filters
  - Test: list all
  - Test: list by category
  - Test: list done/pending

- [x] **Task 5: Implement "done" command (FR1.2)**
  - Mark todo by ID as complete
  - Error if ID not found
  - Save to store
  - Test: mark existing todo done
  - Test: error on invalid ID

- [x] **Task 6: Implement "delete" command (FR1.3)**
  - Remove todo by ID
  - Error if ID not found
  - Save to store
  - Test: delete existing todo
  - Test: error on invalid ID

- [x] **Task 7: Implement "categories" command (FR2.3)**
  - List all unique categories
  - Show count of todos per category
  - Test: categories with multiple todos
  - Test: empty categories list

- [x] **Task 8: Final polish (NFR1, NFR2)**
  - Add --help flag with usage info
  - Ensure all commands < 100ms
  - Implement atomic writes (write to temp, rename)
  - Add clear error messages
  - Test: help output
  - Test: performance benchmark

## Completion

All 8 tasks completed. Total tests: 24 passing.
