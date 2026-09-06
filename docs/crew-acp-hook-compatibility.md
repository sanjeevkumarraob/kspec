# Kiro CLI V3 Hook Compatibility with Kiro Crew ACP

This guide defines the compatibility check for kspec's project-local V3 hooks when Kiro CLI runs in a Kiro Crew-managed ACP session.

> The test verifies **project workflow instrumentation only**. It does not test, replace, bypass, or configure Kiro Crew's policy enforcement. Crew policy and tool approvals remain the governing execution boundary.

## Why this test exists

kspec writes standalone V3 hook configuration to `.kiro/hooks/kspec.json`. Current Kiro CLI V3 documentation defines project-local hook files in `.kiro/hooks/*.json` and supports the lifecycle triggers kspec uses. Kiro Crew also has its own home-scoped hook import path and starts Kiro CLI through ACP. The two mechanisms must not be conflated.

The question for this test is narrow: **does a project-bound Kiro Crew ACP session allow Kiro CLI to discover and execute the normal project-local V3 hooks?**

## Test prerequisites

| Requirement | Purpose |
|---|---|
| Kiro CLI with V3 support | Runs the generated standalone V3 hook configuration. |
| A local Kiro Crew instance | Starts a project-bound ACP session. |
| A disposable repository initialized with `kspec init --engine v3` | Provides `.kiro/hooks/kspec.json` and kspec workflow artifacts. |
| A writable test worktree | Allows inspection of the generated `CONTEXT.md` and harmless task artifact changes. |

The automated kspec unit suite validates that the generated V3 hook format and trigger vocabulary are correct. This matrix is a live cross-product test, so it must be run against the exact Kiro CLI and Crew versions used by a team.

## Test matrix

| Scenario | Trigger | Observable project-level signal | Pass criterion |
|---|---|---|---|
| New Crew ACP session for the test repository | `SessionStart` | `.kiro/CONTEXT.md` is regenerated or its content/mtime reflects the active workflow | The context-refresh hook runs within the project worktree. |
| Create a harmless file through the session | `PostFileCreate` | The configured hook action is recorded or produces its expected project-local effect | The event reaches the generated project hook. |
| Save a harmless change to a tracked test file | `PostFileSave` | The configured hook action is recorded or produces its expected project-local effect | The event reaches the generated project hook. |
| Execute a completed task operation in the session | `PostTaskExec` | The configured task-progress action is recorded or produces its expected project-local effect | The event reaches the generated project hook. |
| Attempt a deliberately denied destructive command in a disposable worktree | `PreToolUse` | kspec's project-level guard returns its configured blocking response | The hook is reached; Crew policy may independently block earlier, which should be recorded as a policy-layer result rather than a hook failure. |

## Procedure

1. Create a disposable repository and run `kspec init --engine v3`.
2. Create a minimal active specification with `requirements.md`, `tasks.md`, and a known incomplete task.
3. Record the contents and modification time of `.kiro/CONTEXT.md` before opening the Crew session.
4. Start a Crew ACP session explicitly bound to that repository worktree.
5. Run the first four scenarios above using harmless changes only.
6. For `PreToolUse`, use a disposable worktree. Record whether Crew policy blocks the command before Kiro CLI's project hook can observe it; that result confirms policy ordering rather than invalidating the hook configuration.
7. Save the exact Kiro CLI version, Crew version, operating system, session type, project path, observed outputs, and logs with the test report.

## Result interpretation

| Outcome | Interpretation | Follow-up |
|---|---|---|
| All project signals appear | Project-local V3 hooks operate under the tested Crew ACP configuration. | Document the validated version pair and permit hooks for non-security workflow instrumentation. |
| CLI direct session passes but Crew ACP session does not | A cross-product discovery or working-directory difference exists. | File a focused compatibility issue with versions, logs, and the smallest fixture. Do not claim the hook trigger vocabulary is invalid. |
| Crew policy blocks a command before an expected hook signal | Expected layered governance behavior. | Keep Crew policy authoritative; choose a harmless observability scenario for hook discovery testing. |
| Neither direct CLI nor Crew ACP recognizes a hook | Likely fixture, configuration, or CLI-version issue. | Check the Kiro V3 hook file format and CLI version before diagnosing Crew behavior. |

## Boundaries after validation

A successful hook test permits kspec to use project hooks for local context refresh and workflow instrumentation. It does **not** make a repository hook a cross-host lock, an authorization decision, a replacement for Crew policy, or a durable Crew run record. The portable `kspec status --json` contract and the Crew-specific `kspec crew-result` envelope remain the intended handoff interfaces.
