# Complete tenant-grant contract integration

Status: active
Milestone: M04 - Semantic Twin and Live UI
Issue: #98

## Goal

Restore connected inspectors for valid operators advertising four or five grants.

## Scope

Vendor merged platform baseline.21 at `a1ca9e24035efdffca69ae50c2118228257936e4`,
regenerate the official Effect client and generation provenance, add adapter and
production-browser regressions, and guard discovery cardinality in contract checks.

## Design decisions

Preserve byte-identical upstream ownership, exact provenance, closed grant names,
nonempty unique grants, same-origin sessions and runtime authorization. Never
remove legitimate grants or manually patch generated schemas to make tests pass.

## Acceptance criteria

- [x] Reproduce four/five-grant decoder rejection before regeneration.
- [x] Vendor only the reviewed baseline version and grant-bound corrections.
- [x] Pass focused adapter and contract-sensor regressions, typecheck and build.
- [x] Reach connected inspector readings with all five grants in a browser fixture.
- [ ] Pass complete acceptance, browser, measured-quality and image groups on CI.

## Acceptance evidence

Failed control, as expected: the previous generated client rejects both new
four/five-grant tests with `invalid-response` before regeneration.

Passed locally: all 23 tenant-reader adapter tests, 92 contract sensor fixtures,
exact snapshot/client provenance checks, app and E2E TypeScript compilation,
production build/byte budgets, formatting, architecture, boundaries and harness
policy. All five production tenant-discovery browser scenarios passed, including
catalogue, inspector property selector and committed-reading fixture visibility
for an operator advertising all five grants. Documentation checks passed after
recording explicit verification outcomes.

The build measures 428,166 raw / 120,484 gzip non-map JavaScript bytes, within the
unchanged 440,000 / 125,000 limits. No budgets, privileges or security gates change.

Pending/not run locally: complete acceptance/coverage/mutations, full browser,
measured-quality and image groups; these run on CI. Partial local checks are not
canonical group acceptance. Browser fixtures are synthetic and do not qualify real
OIDC, devices or deployment. Deployment PR #32 remains open until this correction
is merged, its reviewed source is pinned, and installed product verification passes.

## Out of scope

New grants, security exceptions, payload-budget changes, deployment promotion,
persistent D06 and full-profile qualification. After merge, deployment PR #32 must
pin the reviewed UI revision and rerun its real HTTPS/OIDC/TCP product scenario.
