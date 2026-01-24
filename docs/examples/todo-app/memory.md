# Learnings: CLI Todo App with Categories

**Completed:** 2026-01-24

## Technical Learnings

### JSON Storage
- Use `JSON.parse` with try-catch; corrupted files are common
- Atomic writes prevent data loss: write to `.tmp`, then `rename()`
- Store `nextId` separately to avoid ID collisions after deletions

### CLI Design
- `process.argv.slice(2)` for clean argument parsing
- Minimal flag parsing can be done without dependencies
- Exit codes: 0 = success, 1 = user error, 2 = system error

### Performance
- File I/O is the bottleneck; sync operations are fine for small files
- JSON.stringify/parse are surprisingly fast (< 1ms for small data)
- Avoid reading file multiple times per command

## Process Learnings

### Specification
- "Default category" requirement was worth specifying explicitly
- "Out of scope" section prevented scope creep when AI suggested due dates
- Table format in spec clarified exact output expectations

### Testing
- Test corrupted file handling early; easy to forget
- Test empty state (no todos) separately from populated state
- ID handling edge cases: what happens after delete?

## Recommendations for Future Projects

### Add to tech.md
- For CLI tools: always implement --help first
- For file storage: always use atomic writes

### Add to testing.md
- Test file corruption scenarios
- Test empty/edge states, not just happy path

### Patterns to Reuse
- Store pattern: `{ data: [], nextId: 1 }` for any entity
- Atomic write: `writeFileSync(path + '.tmp'); renameSync()`
- CLI structure: commands.js exports { add, list, done, delete }
