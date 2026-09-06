# Kiro Crew Run Result Contract

`kspec crew-result` emits a **Kiro Crew-specific run-result envelope**. It allows a Crew-facing skill, App, workflow, or reporting layer to record what happened in a run and associate that outcome with an active kspec workflow—without adding Crew session data to kspec's portable workflow snapshot.

> **This command emits data; it does not persist, schedule, authorize, retry, or approve work.** Kiro Crew owns those execution responsibilities. kspec's requirements, design, tasks, and active-spec pointer remain authoritative for workflow state.

## Usage

```bash
# A completed result for the active specification
kspec crew-result \
  --status completed \
  --summary "Implemented the requested change and ran the suite." \
  --artifact .kiro/specs/2026-09-01-feature/review.md

# Bind a run result to the fingerprint observed before the Crew run began
kspec crew-result 2026-09-01-feature \
  --status needs_review \
  --input-fingerprint 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  --summary "Implementation is ready for maintainer review." \
  --artifact .kiro/specs/2026-09-01-feature/review.md
```

| Option | Meaning |
|---|---|
| `[spec]` | Optional exact or resolvable specification directory name. It is read only and does not change `.kiro/.current`. |
| `--status` | One of `completed`, `failed`, `needs_review`, or `cancelled`. `needs-review` is accepted as an input alias and normalized to `needs_review`. |
| `--summary` | Optional one-line or short text outcome, limited to 4 KiB. Put long logs and reports in a repository artifact instead. |
| `--artifact` | Optional repeatable path to an existing file within the project root. Paths are normalized to repository-relative form and duplicates are removed. |
| `--input-fingerprint` | Optional SHA-256 snapshot fingerprint captured at run admission. It binds the result to the workflow state the Crew run observed before execution. |

The formal contract is published as [JSON Schema](../schemas/kspec-crew-run-result.schema.json).

## Output semantics

| Field | Meaning |
|---|---|
| `generatedAt` | The time the result was emitted. It belongs to the execution envelope, not the portable workflow snapshot. |
| `consumer.name` | Always `kiro-crew` in this adapter contract. |
| `consumer.sessionKey` | The optional `KIROCREW_SESSION_KEY` inherited by a kspec command run inside a Crew-managed session. It is `null` outside such a session. |
| `workflow.inputFingerprint` | The snapshot fingerprint supplied at run admission, or `null` if the caller did not bind an input state. |
| `workflow.outputFingerprint` | A newly derived snapshot fingerprint at result emission. A difference from the input fingerprint means source workflow artifacts changed during the run. |
| `result` | Normalized outcome status, small summary, and repository-local reviewable artifacts. |

## Recommended Crew adapter flow

A Crew integration can use the contracts as a narrow, reviewable bridge:

1. Run `kspec status <spec> --json` at admission and retain `freshness.value` as the input fingerprint.
2. Let Crew execute the approved task under Crew's normal session, policy, tool-approval, checkpoint, and retry model.
3. Write detailed reports to reviewed repository artifacts where appropriate.
4. Run `kspec crew-result <spec> --input-fingerprint <value> ...` at the end of the execution.
5. Store or present the resulting envelope in the Crew-owned run/audit layer. If `inputFingerprint` and `outputFingerprint` differ, show that source artifacts changed and request reconciliation when needed.

The command validates that each reported artifact is a **non-empty existing regular file** whose canonical filesystem location resolves below the canonical repository root. It therefore rejects project-root directories, arbitrary host paths, and in-repository symlinks that point outside the worktree. It does not write a session transcript and does not create a second lock or distributed coordination mechanism.

## Security boundary

The session key is **correlation metadata**, not an authorization credential or a replacement for Crew audit records. Do not place secrets, prompt transcripts, personal data, or permissions in the result envelope. Do not treat `status: completed` as an approval or a permit to merge, deploy, or perform another consequential action.

If a Crew App later consumes this contract, its backend must be installed and operated as trusted code. It should apply its own path validation and follow Crew's normal policy/approval controls for every action. The adapter contract deliberately does not override or replicate those controls.

## Relationship to the workflow snapshot

| Contract | Purpose | Persistence owner |
|---|---|---|
| [`kspec status --json`](workflow-snapshot.md) | Derived, portable description of present workflow state | None; output is freshly computed from repository artifacts. |
| `kspec crew-result` | Crew-specific record of one execution outcome and optional session correlation | A Crew adapter, App, workflow run, or other Crew-owned audit layer. |

Keeping the two documents separate prevents Kiro Crew lifecycle details from becoming a required part of kspec’s project model, while preserving a deterministic handoff between interactive Kiro CLI work and persistent Crew work.
