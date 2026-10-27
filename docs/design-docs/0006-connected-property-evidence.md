# ADR 0006: Connect exact property evidence in the inspector

## TL;DR

Use the existing managed same-origin runtime for a dedicated assets telemetry
read port. Select one exact installed property, keep values/times/counters exact,
and separate current snapshots, bounded history and immutable interpretation
provenance. No live transport or sample fallback is introduced.

Status: proposed, 27 October 2026. Milestone: **M04 - Semantic Twin and Live UI**.

## Decision

Pin merged backend baseline.18 at the revision recorded in contract provenance.
Generate only the three additional consumed operations: current property snapshot,
bounded hot history and exact interpretation. The full bundled artifact stays
byte-identical to upstream. Existing generation patches and checks remain intact.

The assets feature owns pure evidence values/query/ordering/drawing rules, a
validated telemetry adapter and focused Solid controllers/presentation. The
app-composed metadata reader exposes an optional independent telemetry port;
existing metadata-only integrations remain explicit and compatible. All reads
use the same managed BrowserApi, scopes, operation/body limits and AbortSignal.
No feature imports identity implementation or runs Effect in presentation.

Select from the exact asset-type's declared property references, resolving only
the chosen definition. The chooser shows at most 100 matching options plus an
already-selected reference; local search narrows this disclosure. Property/version,
explicit window, opaque page cursor and selected interpretation belong to the
URL. Missing window defaults to one hour ending at the explicit effective cutoff;
the form displays the exact resulting bounds. Applying a window freezes those
bounds in the URL. Changing scope clears cursors and interpretation selection.
Current readings are independent of metadata review cutoffs/history windows.

The boundary validates generated schemas and exact tenant/asset/property/version,
kind/unit agreement, signed-i64 times, selected event-time basis, numeric ranges,
complete identity ordering, uniqueness and cursor advancement. Opaque tokens are
passed unchanged; they are not decoded as authorization or client-side identity.
Returned exact interpretation tokens must match the requested reference.

## Presentation and limits

Retain the persistent shell and existing three-pane inspector. The centre pane
contains the selected property's committed reading, historical chart/table and
original attribution; metadata identity, relationships and bindings remain
available. Source quality, snapshot-time age and committed pending work are
separate indicators. Generation/revision/processed counters are exact strings.
Freshness describes the server evaluation instant; explicit refresh reassesses
age. A future timestamp remains future, never a positive health signal.

History uses a half-open window of at most seven days, with fifty rows per page.
Pages and current snapshots are independent database reads; late facts behind a
cursor require restarting the window. Do not collapse corrected interpretations
or imply retraction of another target. Empty materialization/history does not
establish missing sources, silence or complete unresolved-work coverage.

Integers, arbitrary-precision decimals, timestamps and revisions retain exact
strings. Drawing supports at most 100 numeric points, 256-character numeric
representations and bounded decimal scale. BigInt arithmetic normalizes to bounded
pixel coordinates; only those coordinates become Number. Unsupported scales,
single points and nonnumeric values retain the exact accessible table. Lines are
visual guides, not invented measurements or interpolation promises.

Read ownership reuses account/tenant-keyed cancellation and synchronous hiding
of superseded results. Property/window/cursor changes abort old work and late
non-cooperative completions cannot restore it. A telemetry 401 invalidates the
app session; 403 leaves independently authorized metadata intact. Failures are
safe categories, never decoded error payloads or sample evidence.

## Verification and deferred work

Focused parser/model/adapter and Solid tests cover precision, hostile scope,
contradictory age, cursor/window bounds, provenance and late completion. POM
browser scenarios cover URL history, narrow layout, empty/error/denied states
and a complete narrated connected-property guide chapter. That chapter remains
labelled controlled contract evidence, not real OIDC/device/deployment qualification.
Full coverage, browser quality, production build/image and guide execution run
on CI at the owner's request. Existing gates and output budgets stay enforced.

Live subscriptions/recovery, graph commissioning, location, alerts, analytics,
D06 and full-profile qualification remain deferred.
