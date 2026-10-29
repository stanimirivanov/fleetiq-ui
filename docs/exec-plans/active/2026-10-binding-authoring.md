# Signal-binding authoring and attribution review

Status: active
Milestone: M04 - Semantic Twin and Live UI
Issue: #96

## TL;DR

Implement product-plan PR 32 as one source-to-property authoring and review slice.
Heavy checks run on CI; D06 and full-profile qualification remain deferred.

## Goal

Append and correct explicit attribution facts, with honest discovery scopes,
compatible pinned target properties and immutable revision review.

## Scope

- Registered endpoint and separately authorized bounded observation discovery.
- Pinned target type/property eligibility and explicit temporal revision forms.
- Shared command ownership, audit receipts and authoritative snapshot refresh.
- Exact immutable revision review with URL-owned identity and safe selection reset.
- Pure/adapter/controller tests, POM procedures, required guide and accessibility.

## Design decisions

Follow [0011](../../design-docs/0011-binding-authoring.md). Reuse the runtime and
command owner. Do not infer complete inventory, compatibility, latest revision,
reprocessing or telemetry resolution from binding metadata. The owner approved 440,000 raw / 125,000 gzip non-map JavaScript bytes on
2026-10-29; existing security/resource/coverage limits remain enforced.

## Acceptance criteria

- [x] Author exact source-to-supported-property revisions and corrections.
- [x] Distinguish registered, observed, configured and committed evidence.
- [x] Preserve receipt, conflict, denied and unknown-outcome semantics.
- [x] Cancel source/property work and hide late evidence on scope/permission loss.
- [x] Add immutable review, complete guide and bounded accessibility scenarios.
- [x] Record approved non-map feature budget (440,000 raw / 125,000 gzip); final footprint below.
- [x] Complete final focused checks and record their status in the PR.
- [ ] Pass complete CI acceptance, browser, browser-quality and image groups.

## Acceptance evidence

Local verification passed: seventeen focused model/adapter/controller/query tests;
eight production binding/guide/preceding commissioning journeys; one desktop/light
binding accessibility smoke; 136 contract, route, quality and guide sensor fixtures;
app/E2E compilation; contract/provenance, formatting, architecture, boundaries,
view-size, docs and canonical harness policy checks. Both new controllers measured
100% of lines/statements/functions/branches. The production build/byte gate passed
at 428,166 raw / 120,479 gzip non-map JS bytes, below approved 440,000 / 125,000.
Complete acceptance/component coverage/mutations, full browser/quality/image suites
and complete guide generation remain CI work. Partial passes are not full-group
acceptance. Contract fixtures do not qualify real providers, devices, capacity or D06.

## Out of scope

New APIs, source inventory inference, value transformations, unit conversion,
definition editing, automatic semantic reprocessing, D06 and full-profile qualification.

## Coverage follow-up

The focused metadata-query suite initially measured 52/57 branches (91.22%),
below the unchanged 95% floor. Add direct invalid-filter, Unicode-length boundary,
control-character, empty-navigation and explicit revision-pair regressions.
The focused suite now measures 55/57 branches (96.49%) and 100% lines, statements
and functions, independent of incidental coverage from other suites. Existing
percentage floors remain unchanged; minimum denominators increase to 47 lines,
53 statements, 16 functions and 57 branches. New assertions are mandatory in the
coverage harness. jsdom timing output is informational; pool/isolation settings
are unchanged. Complete acceptance remains for CI.
