# Browser domain boundaries

The [local glossary](../GLOSSARY.md) extends the
[shared product model](https://github.com/stanimirivanov/fleetiq-platform/blob/main/docs/architecture/domain-model.md).
The owner endorsed this scope on 21 November 2026; historical decision statuses
in [design records](design-docs/README.md) remain unchanged.

| Module     | Owns                                                                             | Relevant record                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| App        | Session/tenant scope, managed runtime and feature composition                    | [Browser identity](design-docs/0004-browser-safe-semantic-metadata.md)                                                           |
| Assets     | Catalogue, registry, relationships, bindings, property evidence, map and history | [Property evidence](design-docs/0006-connected-property-evidence.md), [binding authoring](design-docs/0011-binding-authoring.md) |
| Devices    | Communication registration, routes and observed diagnostics                      | [Commissioning](design-docs/0010-registry-commissioning.md)                                                                      |
| Alerts     | Rule authoring, lifecycle evidence and exact acknowledgement                     | [Alerts](design-docs/0013-connected-alerts.md), [commands](design-docs/0014-alert-commands.md)                                   |
| Operations | Sampled work evidence and authorized fenced recovery                             | [Recovery model](../apps/web/src/features/operations/model/recovery.ts)                                                          |
| Shared     | Product-neutral browser utilities                                                | [Architecture](../ARCHITECTURE.md)                                                                                               |

Features remain independent; app composition coordinates their ports. The UI
consumes the exact platform snapshot in [source.json](../contracts/http/source.json),
validates unknown responses and preserves exact identity/version scope. Platform
owns authorization on every operation; advisory grants guide controls and manage
does not imply read. Session or tenant changes invalidate protected browser state.

The fleet view is a tenant projection, not a managed fleet membership aggregate.
Local page filters do not establish tenant totals. Explicit coordinate mappings
assign presentation roles; names cannot establish latitude or longitude semantics.
Quality, freshness, location validity and connection liveness are separate. Current
invalid evidence does not silently select an older good position.

Metadata review cutoffs do not create a multi-request snapshot or change current
property reads into historical reads. Metadata review times support safe integer
milliseconds; telemetry times and counters preserve exact decimal strings. See
[contract boundaries](../contracts/http/README.md) for the supported representations.

Ambiguous commands retain exact content for deliberate replay. A command receipt
can be historical and does not prove the current head or a successful refresh.
Acknowledging an alert neither resolves its condition nor suppresses notifications.
History, restored selections and numeric summaries retain explicit coverage and
representation; absence of evidence must not become fabricated empty success.

Shared open decisions about correction and reinterpretation remain with platform.
Existing design records already cover the browser trade-offs; this consolidation
adds no duplicate ADR and does not ratify every implemented proposal.
