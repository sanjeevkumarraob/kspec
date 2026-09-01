# Workflow Snapshot Contract

`kspec status --json` emits a **fresh, repository-derived workflow snapshot**. It is intended to let Kiro Crew, Kiro CLI extensions, CI jobs, and other tools understand the current kspec workflow without copying project state into a second task system.

> **The snapshot is descriptive, not authoritative for execution.** The repository's requirements, design, tasks, and active-spec selection remain the source of truth. Kiro Crew remains responsible for session management, task orchestration, schedules, checkpoints, runtime permissions, and approvals.

## Usage

```bash
# Resolve the selected active specification
kspec status --json

# Resolve one specific specification without changing .kiro/.current
kspec status 2026-09-01-feature --json
```

The command writes exactly one JSON document to standard output when `--json` is supplied. It does not write a manifest or modify a specification.

## Contract goals

| Goal | Design choice |
|---|---|
| Avoid state drift | Derive the output from repository artifacts each time the command runs. |
| Support portable consumers | Emit paths relative to the project root, never host-specific absolute paths. |
| Support safe optimistic handoff | Include a content fingerprint over the inputs used to derive status. |
| Preserve Kiro boundaries | List next-step candidates as advisory information only; the output never grants permission to execute. |
| Evolve safely | Include `schemaVersion`; consumers should reject unsupported major versions and ignore unknown fields in supported versions. |

## Snapshot fields

| Field | Meaning |
|---|---|
| `schemaVersion` | Version of this snapshot format. The initial contract version is `1`. |
| `kind` | Stable document discriminator: `kspec-workflow-snapshot`. |
| `projectRoot` | The root from which all paths are relative. The current value is `.`. |
| `activeSpec` | The selected or explicitly requested specification, including its stable directory name, repository-relative path, and detected format. It is `null` if no specification can be resolved. |
| `stage` | Derived lifecycle phase: `uninitialized`, `requirements`, `design`, `tasks`, `build`, `verify`, or `complete`. `complete` is terminal — it is derived from the `done` event recorded in the spec's `metrics.json` and carries an empty `next.candidates`, so a scheduled consumer has an explicit stopping condition. A `tasks.md` that exists but contains no checkboxes reports `tasks`, not `verify`, because no work was ever scheduled. |
| `artifacts` | Repository-relative paths to the requirements, design, tasks, and generated context artifacts when present. |
| `progress` | Aggregate task totals, progress by chunk where `tasks.md` contains chunk headings, and the first incomplete chunk/task. |
| `next.candidates` | Candidate kspec commands appropriate to the derived stage. These are suggestions, **not authorizations**. |
| `freshness` | SHA-256 digests of the input artifacts plus an aggregate digest. |

The formal contract is published as [JSON Schema](../schemas/kspec-workflow-snapshot.schema.json).

## Freshness protocol

A consumer should use the snapshot as a short-lived read model:

1. Invoke `kspec status [spec] --json` and retain `freshness.value`.
2. Before any consequential work, invoke the command again for the same spec.
3. Continue only when the new `freshness.value` matches the observed value, or deliberately re-evaluate the current snapshot.

The aggregate value is a SHA-256 digest of the ordered input descriptors. Each descriptor contains the repository-relative artifact path, the byte length, and its own SHA-256 content digest. This is stronger than relying on timestamps and does not require a long-lived cache.

## Task identity and progress

Current `tasks.md` entries are free-text checkboxes and do not have stable task IDs. The contract therefore reports aggregate and per-chunk `{ total, done, remaining }` counts rather than synthesizing positional task IDs. A future stable task identity format, if introduced, will be designed as a separately versioned and backward-compatible enhancement.

## Security and privacy

The snapshot contains only derived workflow information and repository-relative file paths. It must not be treated as a place for credentials, raw environment variables, Crew session transcripts, conversational memory, or an approval bypass. Avoid putting ticket URLs or other internal references into snapshot fields unless a later schema revision explicitly defines an appropriate privacy model.

Consumers must apply their own runtime authorization rules. In particular, a Kiro Crew integration must still rely on Kiro Crew's policy and tool-approval mechanisms for any operation it performs.

## Kiro Crew integration guidance

The portable snapshot is the **kspec core interface**. A Crew-specific integration should sit above it:

| Concern | Responsible layer |
|---|---|
| Resolve requirements, design, tasks, phase, and progress | kspec snapshot |
| Kiro-native project instructions and workflow conventions | kspec skills, steering, and hooks |
| Session, retry, checkpoint, and schedule management | Kiro Crew |
| Tool permissions and approval decisions | Kiro Crew policy and approvals |
| Crew session correlation and outcome provenance | A Crew adapter or run-result record |
| Dashboard, scheduled checks, and review-handoff interface | Optional Crew App |

When a kspec command runs inside a Crew-managed session, an optional adapter may record the Crew session key as execution provenance. That volatile integration detail is intentionally excluded from this portable snapshot.

## Compatibility policy

Version `1` is additive-only within its major version. Consumers should ignore fields they do not recognize, must verify `kind`, and should fail safely when `schemaVersion` is unsupported. The initial implementation intentionally does not persist this output; a consumer that needs durable audit or execution records should maintain them in its own appropriate runtime layer while retaining a reference to the snapshot fingerprint used as input.
