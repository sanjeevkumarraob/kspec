# Contributing to kspec

Thanks for your interest in contributing to kspec! 🎉  
This project aims to provide a practical, opinionated Spec-Driven Development (SDD) workflow on top of Kiro CLI (and Q CLI).

This document explains how to:

- Set up a development environment
- Make changes safely
- Follow project conventions
- Propose ideas and report issues

---

## Ways to Contribute

You can contribute in several ways:

- Fix bugs or improve error handling
- Improve documentation and examples
- Add new checks, templates, or steering examples
- Enhance the kspec workflow / commands
- Help with tests or CI improvements

If you're not sure where to start, you can:

- Look for `good first issue` or `help wanted` labels
- Open an issue with a proposal and ask for feedback

---

## Development Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/-AU/data-kspec.git
   cd data-kspec
   ```

2. **Install kspec locally**

   ```bash
   chmod +x install-kspec.sh kspec
   ./install-kspec.sh
   ```

3. **Create a test project**

   From somewhere outside the repo:

   ```bash
   mkdir -p ~/tmp/kspec-test
   cd ~/tmp/kspec-test
   kspec /init
   ```

4. **Run basic workflow**

   ```bash
   kspec /analyse
   kspec /create-spec "Example Feature"
   kspec /create-tasks "Example Feature"
   kspec /execute-tasks "Example Feature"
   ```

If any of these steps fail, please open an issue with logs and environment details (OS, shell, `kiro-cli --version` or `q --version`).

---

## Project Structure (High Level)

Relevant pieces to be aware of:

- `kspec` — main CLI script
- `install-kspec.sh` — installer
- `.kiro/steering/` (in projects) — steering docs (authoritative rules)
- `.kiro/agents/` (in projects) — per-project kspec agents
- `.kspec/` (in projects) — standards, specs, tasks, memory, templates

When you're modifying the repo, you're usually changing:

- The `kspec` script itself
- Installer behavior
- Default steering / standards templates
- Documentation (README, WALKTHROUGH, COMMANDS, etc.)

---

## Coding Guidelines

The core kspec implementation is Bash plus configuration files. Please:

- Keep scripts POSIX/Bash compatible (no exotic shell-specific features)
- Avoid unnecessary dependencies
- Prefer small, composable functions
- Provide clear error messages and use `set -euo pipefail` where appropriate

When adding or changing logic:

- Try to preserve existing UX: avoid surprising users.
- Be explicit about env variables that affect behavior.
- Avoid hardcoding org-specific assumptions where possible; make them configurable.

---

## Workflow for Changes

1. **Create a branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**

   - Update `kspec` and/or `install-kspec.sh`
   - Update or add documentation (README, WALKTHROUGH, etc.)
   - Add or adjust steering templates if relevant

3. **Test in a clean project**

   ```bash
   mkdir -p ~/tmp/kspec-feature-test
   cd ~/tmp/kspec-feature-test
   kspec /init
   kspec /analyse
   kspec /create-spec "Test Feature"
   kspec /create-tasks "Test Feature"
   kspec /execute-tasks "Test Feature"
   ```

4. **Run shellcheck (if available)**

   ```bash
   shellcheck kspec install-kspec.sh
   ```

5. **Commit and push**

   ```bash
   git commit -am "feat: your feature summary"
   git push origin feat/your-feature-name
   ```

6. **Open a Pull Request**

   Include:

   - A short summary of the change
   - Any breaking changes
   - Screenshots or terminal logs for tricky flows
   - How reviewers can reproduce your test scenario

---

## Documentation Changes

Good documentation is part of the UX.

If your change affects behavior, please update:

- `README.md` — overview and quickstart
- `COMMANDS.md` — detailed command behavior
- `WALKTHROUGH.md` — end-to-end example(s)
- `TROUBLESHOOTING.md` — if you add or change common failure modes

---

## Design Principles

kspec tries to follow a few principles:

- **Steering-first** — `.kiro/steering/` is the authority; `.kspec/standards/` should follow it.
- **Per-project agents** — `.kiro/agents/` is version-controlled with the repo.
- **Spec-driven** — features should have specs and tasks before major implementation.
- **Safe defaults** — no destructive commands or auto-execution unless explicitly enabled.

Please keep these in mind when designing new features.

---

## Reporting Issues

If you encounter a problem:

- Check existing issues to see if it's already reported.

When opening a new issue, include:

- kspec version / git commit hash
- Kiro or Q CLI version
- OS and shell
- The command you ran
- The full error/output (or relevant snippets)
- Any custom environment variables you set
