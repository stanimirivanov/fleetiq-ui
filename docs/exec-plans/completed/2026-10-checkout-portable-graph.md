# Qualify Checkout 7 and portable production graph ownership

## TL;DR

Accept only the verified Checkout 7.0.1 commit and repair path alias handling in
the production graph sensor. Keep action trust, sample exclusion and final-byte
verification enforced.

Status: completed (implementation; final canonical qualification recorded at handoff)
Milestone: M02 - Product Foundation

## Goal

Repair the reported rebased Checkout PR failures on Linux and Windows without
weakening immutable action review or production sample isolation.

## Scope

- Synchronize the reviewed action registry with Dependabot's existing workflow pins.
- Reject Checkout's unsafe fork option and retain all current delivery constraints.
- Resolve configured and graph filesystem aliases before comparing source ownership.
- Exercise real Vite builds, positive controls and deliberate policy/graph violations.

## Design decisions

The delivery failures were an intentional trust mismatch: workflows had moved to
Checkout 7.0.1 while the registry still approved 6.1.0. Verify the new SHA against
the official upstream tag and action definition. Keep Node 24, full history,
non-persistent credentials, exact publication revision and same-repository main
trigger requirements. Do not enable the new unsafe-fork option.

The separate Windows graph failure occurred in the second temporary Vite build;
it does not implicate Checkout. The original sensor compared lexical path strings.
Native realpath expands Windows short names and canonicalizes module/root paths
before ownership classification. A real aliased-root build exercises that mismatch
and a subsequent sample import must still fail. Virtual IDs are excluded; missing
real files and empty owned graphs remain incomplete verification.

## Acceptance criteria

- Actual quality and guide YAML passes using the verified Checkout commit.
- Retired/mutable/unreviewed actions and unsafe checkout settings are rejected.
- Real aliased-root production builds pass and imported sample owners fail.
- Missing real source paths and empty owned graphs cannot emit a qualifying manifest.
- Canonical acceptance, functional browser and measured browser groups pass final sources.

## Acceptance evidence

The initial focused run reproduced both action-registry failures locally; its
ordinary Windows Vite fixture passed, so hosted path failure is tracked separately.
Official git ls-remote confirmed the 7.0.1 tag points to the workflow SHA. Focused
policy tests passed after synchronization. New alias and unavailable-graph fixtures,
including final canonical group receipts, are qualified and reported at handoff.
An actual Windows build using mixed long and 8.3 paths reproduced the original
missing-graph diagnostic; the repaired sensor passed that same build. The hosted
runner's complete filesystem environment is not locally reproduced;
GitHub must rerun this PR after commit/push. Local group evidence does not claim
that GitHub executed the upgraded action or that remote protection is configured.

## Out of scope

Other Dependabot upgrades, broad action allowlists, disabling sensors, changing
browser budgets, product behavior, user-guide regeneration and remote publication.
