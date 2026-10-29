# 0011: Signal-binding authoring and attribution review

## TL;DR

Author exact device/endpoint/signal → asset/property facts using immutable revisions.
Registered endpoints, sampled observations, configured bindings and recorded
telemetry provenance are distinct evidence. Reuse the shared command lifetime and
runtime. No value conversion, automatic reprocessing or latest-head inference is
introduced. D06 and full-profile qualification remain deferred.

## Boundaries and discovery

The assets feature owns a pure binding draft/port, a validated managed-runtime
adapter, separate source/target selection controllers and focused presentation.
App composition injects the port into the existing metadata provider. There are
no device-feature imports, second HTTP runtime or new backend contract. Browser
generation selects two existing operations: append and exact binding revision GET.

- Registered device endpoints require metadata.read. Lookup verifies the exact
  tenant/device identity and bounded unique endpoints. A registered endpoint is
  not proof of any emitted signal. Protocol-neutral signal names remain explicit
  editable input for custom devices.
- Observed-source inspection is a separate explicit action requiring protocol.manage.
  The diagnostic sample carries decoder identity, observation time and truncation
  across at most 64 messages, 64 outputs per message and 128 source tuples.
  Empty observations and empty binding candidates do not establish sensor inventory,
  complete capabilities, liveness or an unassigned source. Sample choices can only
  select currently registered endpoints. Revocation cancels and hides diagnostics.
- Target lookup reads the asset, its exact pinned type, then the selected supported
  property definition. Eligibility requires exact ID/version membership. A property
  with the same name or another version is not interchangeable. Kind/unit evidence
  is displayed; compatibility with a signal's actual measurement is not guessed.

Changing source or target identity clears subordinate selections. Existing scoped
read ownership suppresses late non-cooperative completion; no derived state is
synchronized through effects. All source/property data remains behind validated
read boundaries. No per-row discovery requests are introduced.

## Append, correction and authoritative review

Authoring requires explicit metadata.read and metadata.manage hints for the selected
current tenant page. These hints never authorize a request; the server checks each
operation. Observed discovery does not become a prerequisite for custom signals.

Binding IDs and full u64 decimal revisions are explicit. Revision 1 creates the
lineage; a correction names an exact successor after reviewing authoritative state.
Half-open effective intervals use exact safe integer Unix milliseconds; unsupported
precision is rejected. The server owns tenant authorization, actor attribution,
recorded time and same-tenant endpoint/property membership validation.

The existing command owner freezes complete content, blocks double submission,
never retries automatically and cancels on scope loss/unmount. Definite rejection
stays editable; ambiguous outcomes lock fields and permit only deliberate exact
replay after evidence review. Receipt identity/revision mismatches are failures.

Acknowledgement requests fresh target and exact-source snapshots at the command's
effective start and receipt known time, selecting the binding and its exact revision.
A receipt does not claim the subsequent read succeeded. Binding metadata changes
do not reprocess existing observations or rewrite readings/provenance. Review
committed telemetry independently through the target inspector.

## Immutable lineage review

An explicit ID/revision lookup reads that immutable fact independently of snapshot
cutoffs. It never substitutes the head, enumerates complete history or attributes
an actor absent from the read representation. Recorded time comes from the fact;
original actor evidence is shown on acknowledged command receipts.

Snapshot records link to exact revision review. The URL owns binding_revision;
duplicate, missing or invalid revision identity is rejected before reads. Changing
binding selection clears the prior exact-revision selection unless a new pair is
explicit. Tenant/source changes cannot reuse another scope's retained evidence.

## Verification and budget

Model, real-runtime adapter, selection lifecycle and POM tests cover exact tuples,
unsupported properties, temporal/revision errors, separate permissions, cancellation,
late evidence, conflicts, denied writes and frozen replay. The new controllers
have 100% measured lines/statements/functions/branches, added as new ratchets while
all existing floors remain unchanged. Dedicated accessibility scenarios cover both
themes and desktop/narrow layouts, including conflict state.

The connected guide covers registered versus observed sources, pinned target
compatibility, initial attribution/snapshot review, correction/immutable history,
and conflict/exact-replay recovery. Contract fixtures are synthetic and do not
qualify live devices, provider configuration or installed infrastructure.

Initial complete output measured 427,963 raw / 120,343 gzip non-map JS bytes,
exceeding the previous 425,000 / 120,000 caps. On 2026-10-29 the owner approved
440,000 raw / 125,000 gzip non-map JavaScript bytes for this complete feature. Map/worker, CSS, resource and security limits stay unchanged.
Heavy complete suites and guide generation remain CI work.

Final production footprint: 428,166 raw / 120,479 gzip non-map JavaScript bytes.
