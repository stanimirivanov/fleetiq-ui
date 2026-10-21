# D06: qualify pnpm parser resolution

Status: active (issue #74; implementation complete, final qualification pending).
Milestone: M02 - Product Foundation.

[Issue #74](https://github.com/stanimirivanov/fleetiq-ux/issues/74) tracks this slice.

## Goal

Unblock exact-source UX qualification for D06 without changing tool pins or gates.

## Scope

Correct dependency-cruiser's installed-parser lookup and qualify pnpm's shared
virtual-store layout with positive and deliberately invalid fixtures. Isolate
synthetic mutation subprocesses from persistent transformed-module caching. Let
header controls derive accessible names from their visible content and keep
selected asset button names consistent with their visible state.

## Design decisions

- Follow Node lookup order for repository-owned ancestors of the resolved tool.
- Preserve metadata-only inspection, exact identity/version checks and nearest
  package precedence. Keep external ancestor and NODE_PATH packages excluded.
- Disable persistent transform caching only for mutation subprocesses, where the
  on-disk source stays unchanged while the load hook supplies mutant bytes.
- Remove redundant brand/search name overrides rather than hiding visible text
  or excluding the accessibility rule. Match selected asset names to the visible
  Selected label. Preserve visible design and behavior.
- Do not change dependency declarations, lockfiles or publication authorization.

## Acceptance criteria

- The frozen installation qualifies the actual shared-store TypeScript parser.
- Wrong, malformed and broken shared-store parsers fail. A correct shared parser
  cannot hide a wrong closer parser. External shared stores cannot qualify.
- All three real positive controls pass and all three deliberate mutants fail
  their required assertions, including after normal component tests warm caches.
- All existing rendered WCAG, performance, resource and page-error controls pass
  without changes to their rules, workloads or thresholds.
- Required harness/browser groups produce source-bound verification evidence.

## Acceptance evidence

All 40 installed-tool fixtures pass, including the actual frozen installation.
The positive shared-store fixture reproduced the pre-fix installed-pin-mismatch;
malformed/broken cases reproduced incorrect fallback to the native compiler.
The first complete acceptance attempt passed all 780 harness tests and all 207
component tests, then rejected a surviving mutant caused by Vitest's persistent
transform cache. With that cache disabled only in mutation subprocesses, all
three positive controls pass and all three deliberate regressions are killed.
The browser group passed all 44 production and 24 development scenarios before
measured accessibility identified brand/search label-content-name mismatches.
Removing the redundant accessible-name overrides cleared both findings in a
synthetic loopback check; the real measured group must confirm the final markup.
Final authoritative group results belong in the issue/PR verification record.

The reviewed D06 chart packages were published independently from deployment main
at revision 7c51685608c61851319ac7313b4a1739cc0ec89b in
[run 39628417018](https://github.com/stanimirivanov/fleetiq-deploy/actions/runs/39628417018).
Their receipt hashes and exact source bindings were checked. This does not qualify
the unpublished UX artifact or a persistent installation.

## Out of scope

UX publication before merge, environment promotion and live Kubernetes mutation.
D06 remains incomplete until the UX artifact and persistent installation qualify.
