# Asset and temporal relationship commissioning

Status: active
Milestone: M04 - Semantic Twin and Live UI
Issue: #94

## TL;DR

Implement product-plan PR 31 as one connected registry commissioning slice.
Heavy suites run on CI; D06 and full-profile qualification remain deferred.

## Goal

Create assets and append/correct directed temporal relationships without weakening
exact identity, authorization, immutable history or command outcome semantics.

## Scope

- Pure command validation and a managed-runtime gateway over existing contracts.
- Responsive asset/identifier and relationship forms with bounded exact definition
  discovery, audit receipts and authoritative review refresh.
- Conflict/denial/ambiguous outcomes, frozen replay, duplicate and scope guards.
- Focused model/adapter/owner tests, complete POM journeys, an executable guide
  chapter and commissioning accessibility scenarios.

## Design decisions

Follow [0010](../../design-docs/0010-registry-commissioning.md). Keep reads and
commands separate, never infer permission or a latest revision, and retain exact
u64 text. Effective times use exact safe integer milliseconds with half-open
intervals. Owner approved 425,000 raw JS bytes; gzip remains 120,000.

## Acceptance criteria

- [x] Select exact discovered definitions and register typed asset identities.
- [x] Append explicit directed revisions and temporal corrections with audit receipts.
- [x] Preserve conflict, denial and ambiguous-result distinctions without auto retry.
- [x] Cancel owned work and suppress late receipts on scope loss/unmount.
- [x] Add focused regressions, required operator guide and browser-quality scenarios.
- [x] Complete focused final verification and record measured output.
- [ ] Pass full CI acceptance, browser, browser-quality and image groups.

## Acceptance evidence

Local verification passed: eleven model/adapter/Solid tests; four production
commissioning and guide journeys; one desktop/light accessibility smoke; the
production build/byte gate; focused contract/guide/quality sensors; contract
regeneration/provenance; app/E2E compilation; style, docs, architecture, boundaries,
view-size and canonical harness policy. New command-owner coverage measured
100% lines/functions, 97.43% statements and 96.77% branches. Final non-map output
is 410,739 raw / 116,750 gzip bytes, within the approved 425,000 / 120,000 caps.
Full acceptance, complete browser/quality/image groups and complete guide generation
remain CI work; individual passes are not full-group acceptance. Contract fixtures
do not qualify providers, live devices, production capacity, D06 or an installation.

## Out of scope

Signal-binding authoring, definition editing, new backend contracts, bulk commands,
optimistic local evidence, cryptographic exceptions, D06 and full-profile qualification.
