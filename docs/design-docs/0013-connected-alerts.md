# Connected alert lifecycle and calculator evidence

Status: accepted for M05-PR13, issue #104

## Context

Merged backend baseline.26 publishes bounded alert observations and exact
calculator evidence under independent alerts.read and telemetry.read permissions.
The development preview has severity, labels and trends that these endpoints do
not publish. Those synthetic fields cannot be projected onto production records.

## Decision

Use the existing managed Effect v4 BrowserApi and Solid read-controller pattern;
no dependency is added. The alert feature owns pure port/model/query contracts,
generated-schema decoding plus scope/precision/invariant checks, and presentation.
App composition owns the actor-keyed session boundary and tenant selector. Tenant
discovery is advisory; an alerts-only operator is never blocked by metadata.read.
A protected 401 invalidates the common session. A calculator 403 remains local.

URL fields own tenant, phase (open by default), queue cursor, exact rule/revision,
history cursor, evaluation selection and output cursor. Tenant/filter/queue changes
clear dependent selections. Each page requests 20 records, with explicit first/next
navigation and no automatic history walk. Pages and detail are separate observations,
not a transactional snapshot. Evidence selection must match the latest transition
or a transition on the current validated history page; arbitrary evaluation IDs
cannot initiate a read. Definition release/scope/target/property/slot and evaluation
clock/input/output identities are checked before presentation. All decimal values,
i64 clocks and lifecycle counters retain their original strings.

Controllers hide previous scope synchronously, abort superseded requests and ignore
late results from non-cooperative readers. Actor changes dispose protected views.
Missing, empty, denied, invalid and unavailable states stay distinct and retry is
explicit. Null output references mean unknown evidence, never false or healthy.
The browser renders at most 20 of the bounded 1,024 retained input references and
discloses that truncation. Output pages expose exact retained decimal text.

## Contract generation and consequences

Pin platform commit c74e65d63f67b01968f7822ab3a6dd269d622b57 byte-for-byte.
Select five additional reads (36 operations total), excluding rule writes and
acknowledgement commands. Discovery accepts all nine published grants. The exact
upstream identifier regex defect needs a narrowly checked private generation
translation; unexpected drift fails. Primitive schema compaction retains validation
constraints and keeps documentation in the published artifact. See the
[contract notes](../../contracts/http/README.md) for adapter and equivalence tests.

Development sample content remains behind the explicit Vite development flag;
production preview query parameters cannot bypass the session boundary. No rule
editing, acknowledgement UI, SSE, delivery integrations, inferred severity, fleet
totals or synthetic fallback is added. Real OIDC/deployment qualification remains
an installation concern; browser tests use owned synthetic contract fixtures.

## Verification

API tests reject malformed, mismatched and non-advancing evidence. Controller tests
prove cancellation/unmount/late-result suppression; production scenarios cover
bounded paging, independent denial/retry, loading/empty/invalid responses and sample
isolation. The quality project covers desktop/narrow light/dark accessibility and
keyboard filtering under existing byte, latency, heap and node budgets.
