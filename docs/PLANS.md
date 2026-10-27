# Execution plans

## TL;DR

FleetIQ UI follows the existing numbered milestones. Scaffold, visual-language
foundation, shell, testing, contract, and architectural hardening work belong
to **M02 - Product Foundation**. The first complete visual workspace belongs
to **M04 - Semantic Twin and Live UI**.

- [Active plans](exec-plans/active/README.md)
- [Completed plans](exec-plans/completed/README.md)
- [Technical debt](exec-plans/tech-debt-tracker.md)
- [Visual language decision](design-docs/0001-operational-visual-language.md)
- [Shell and theme decision](design-docs/0002-persistent-shell-theme.md)
- [Asset contract decision](design-docs/0003-pinned-asset-catalogue-contract.md)

Each plan records its status, goal, scope, decisions, acceptance criteria, and
evidence. Move a plan to completed only after required checks pass or material
limitations are explicitly recorded.

The [completed schematic map workbench slice](exec-plans/completed/2026-10-map-workbench.md)
pairs a filtered asset list with an illustrative site canvas and in-place
asset context. Positions remain development-only sample evidence until the
backend publishes browser-safe, geodetic location reads with timestamps and
quality.

The [completed asset inspector slice](exec-plans/completed/2026-10-asset-inspector.md)
extends asset discovery into a topology-and-evidence workspace. Its readings,
history, and provenance are development-only sample projections until the
backend publishes browser-safe detail and signal read models.

The [completed fleet overview and asset discovery slice](exec-plans/completed/2026-10-fleet-overview-asset-discovery.md)
uses clearly labelled synthetic operational data for local design review. The
published backend contract currently provides bounded asset identity pages;
location, status,
alerts, and signal views wait for backend-owned read models. Existing
[cursor navigation](exec-plans/completed/2026-10-asset-catalogue-cursor-navigation.md)
keeps sample pages reachable without inventing a fleet total or server-side
search.

The [completed read-only registry and mapping review](exec-plans/completed/2026-10-registry-mapping-review.md) completes the agreed metadata workspace trio. It makes directed relationships and exact source-to-property bindings reviewable at explicit effective and known times, with a separately connected metadata slice using the subsequently merged browser contract.

The [completed signal-stream preview](exec-plans/completed/2026-10-live-signal-preview.md) demonstrates inspector subscription lifecycle, recovery, and freshness with a deterministic development adapter. Production signal reads and streams still require their own backend-owned contracts.

The [completed Alerts triage preview](exec-plans/completed/2026-10-alerts-triage-preview.md) completes visual coverage of the fifth approved workspace with explicitly synthetic evidence. The [completed user-guide slice](exec-plans/completed/2026-10-complete-user-guide.md) records a production shell orientation and five explicitly synthetic development walkthroughs. The connected metadata slice now uses the merged browser-safe identity and semantic contract.

The [completed connected semantic metadata slice](exec-plans/completed/2026-10-connected-semantic-metadata.md)
connects catalogue, inspector, and registry in **M04 - Semantic Twin and Live UI**.
Its reads cover identity, pinned definitions, directed relationships, and exact
source/target bindings. Live operational values, locations, and alert lifecycle
remain separate backend-dependent work.

The accepted [three-PR harness sequence](exec-plans/completed/2026-10-harness-hardening.md)
in **M02** takes priority: context/verification, executable trust boundaries and
secure delivery, then measured browser quality. The
[context slice](exec-plans/completed/2026-10-harness-context-verification.md) and
[trust/delivery slice](exec-plans/completed/2026-10-harness-trust-delivery.md) are
completed; the [measured-quality slice](exec-plans/completed/2026-10-measured-browser-quality.md)
completes that sequence.

The completed [connected operator user guide](exec-plans/completed/2026-10-connected-operator-guide.md)
completes the connected-guide PR in **M04 - Semantic Twin and Live UI**.
It covers sign-in/session/account/sign-out; explicit tenant selection and denied
access; bounded catalogue/filter/cursor/history navigation; inspector identity,
external IDs, type/property definitions and unavailable readings; registry selection,
directed relationships, effective/known review times and scoped pages; exact-source
binding candidates and pinned property definitions; empty/missing/error/retry states;
and keyboard, narrow-layout, and theme use. The four connected-contract chapters
complement the existing shell and five sample chapters. Sample chapters stay separate
for planned operational capabilities beyond connected metadata. Their production UI uses synthetic contract responses; deployed provider
and backend qualification remains separate.

The active [dependency candidate qualification slice](exec-plans/active/2026-10-dependency-candidate-qualification.md)
in **M02** gathers unchanged test results before dependency approval while keeping
original-source acceptance and guide publication blocked until review is current.

The completed [operator tenant selection slice](exec-plans/completed/2026-10-operator-tenant-selection.md)
in **M02** implements delivery-plan PR 3 after backend tenant/capability discovery.
It adds explicit bounded discovery, exact action hints, URL paging, capability-aware
metadata controls, cancellation and recovery, with component and browser coverage
and an extended connected-operator guide journey.

The active [D03 immutable UX image slice](exec-plans/active/2026-10-immutable-ux-image.md) in **M02** adds source-owned static-edge packaging and publication; Kubernetes installation and real identity remain deployment-plan work.

The active [device onboarding and diagnostics slice](exec-plans/active/2026-10-device-onboarding.md)
implements product-plan PR 20 in **M03 - Extensible Device Ingestion** using the
merged baseline.15 contract. D06 and full-profile qualification remain deferred;
contract browser journeys do not qualify a deployed provider or live hardware.

Product-plan PR 25 is the [connected property evidence slice](exec-plans/active/2026-10-connected-property-evidence.md): committed readings, precise history and immutable provenance. Resumable live delivery remains PR 27; D06/full-profile qualification stay deferred.
