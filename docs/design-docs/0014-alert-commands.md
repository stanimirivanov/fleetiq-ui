# Revision-aware alert configuration and operator intent

Status: accepted for M05-PR14a/#106 and M05-PR14b/#107

## Context

The published API separates immutable rule revisions, optimistic activation state
and lifecycle observations. An old successful receipt may be replayed after later
state changes. Its existence cannot establish the current selection or health.

## Decision

Reuse the existing Promise/AbortSignal and managed Effect transport pattern, with
one alert-feature command owner. Capture immutable commands; block duplicate
submission and mutation during pending or uncertain completion. A denied replay
cannot prove an earlier ambiguous command failed, so uncertainty remains sticky
until confirmed. Retry only through explicit exact replay; never reconstruct a
command from edited inputs. Disposal aborts and ignores non-cooperative completions.

Rule configuration uses an exact URL-owned configure ID because no rule catalogue
exists. Load the head and retained latest definition before editing a successor.
An authorized 404 permits revision 1; denial/unavailability never becomes absence.
Read review requires alerts.read; writes independently require alerts.manage.
Advisory discovery grants disable controls but never authorize a backend mutation.
The small typed grammar pins release/scope/target/property/unit and output slot 0.
Thresholds stay exact strings; normalized decimal magnitude/fraction bounds are
checked without binary floating point. Durations are bounded event-time integers.

Activate/deactivate using the observed generation and explicit revision/null.
Append does not activate. Refresh the current head after confirmed writes, and
render retry receipts as historical evidence, not the current selected state.
All browser writes retain same-origin sessions and CSRF through the shared runtime.
Unsafe legacy numeric attribution clocks fail validation instead of being rounded.

## Consequences

Authoring and acknowledgement are separate PR14 review slices as allowed by the
approved plan. No new dependency, calculator editor, expression language, bulk
operation, delivery or installed qualification is added. Unknown command outcome
is retained only in the mounted scope; explicit navigation discards that local
recovery state, so its warning remains visible. Actor-bound ownership comes from
the existing protected route boundary.

The generator reuses equivalent primitive constraints in referenced parameters,
including their original defaults. Negative and equivalence fixtures preserve the
published contract. No backend snapshot bytes change for these selected operations.

## Exact-version acknowledgement (PR14b, issue #107)

Treat acknowledgement as an independent audited operator annotation, not lifecycle
resolution or notification suppression. App composition supplies the current actor
expectation; the command JSON contains only the displayed expected_version. The
writer rejects foreign version/actor receipts and unsafe/noncanonical i64 text.
Optional annotations must match the exact transition they annotate. Historical
annotations remain attributed even after a later phase; they do not acknowledge
that later version. A closed observation cannot initiate a new acknowledgement.

Reuse the command owner introduced by PR14a. After confirmation, retain the receipt
in the selected rule scope and refresh detail/history. On a version race, expose
conflict and require an explicit current-alert refresh. Every write independently
requires alerts.acknowledge; neither metadata, management nor telemetry implies it.
The existing actor-keyed protected boundary disposes receipts on account changes.
