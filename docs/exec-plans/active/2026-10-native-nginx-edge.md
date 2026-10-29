# Native NGINX edge migration

Status: active
Milestone: M04 - Semantic Twin and Live UI
Issue: #100

## Goal

Remove unpatched runtime JOSE v3 and unblock the final installed product slice.

## Scope

Official minimal native NGINX image, source-owned configuration/renderer, retired
Caddy Go module, equivalent native HTTP/SSE/browser/TLS probes, scanner/producer
fitness rules and the deployment PR #32 handoff.

## Design decisions

Follow [0012](../../design-docs/0012-native-nginx-edge.md). Preserve root isolation,
backend authentication, exact artifact provenance, disclosure controls and all
high/critical/secret rejection. No product payload budgets change.

## Acceptance criteria

- [x] Verify the official runtime digest/version and complete native checks.
- [x] Pass exact-image scan and package/SBOM coverage without exceptions.
- [x] Pass HTTP, browser, TLS/hostname, streaming, outage and shutdown probes.
- [x] Pass focused policy/negative fixtures and relevant source checks.
- [ ] Pass remaining full quality groups on CI.

## Acceptance evidence

Passed locally on 2026-10-29:

- `pnpm image:qualify`: all three image checks passed; 47 regression tests.
- Exact OCI index `sha256:c93d6cfa729345058a6ba490bf6f5924474a3c3d7e7e6bfc564974759559f4ec`;
  runtime manifest `sha256:d87f9243663e01327c9ea12675904fd1454cb49137d47bb4784aff49cb48623b`.
- Fresh original-image scan: 21 OS packages; zero high/critical findings, zero
  secret findings, no language-specific binaries. NGINX coverage is mandatory.
- Real HTTP/cookie/forwarding/CSP/MIME/body-limit, streaming handshake, packaged
  browser, trusted TLS/wrong-host rejection, outage, invalid-input, shutdown,
  OCI round-trip and owned-resource cleanup checks passed.
- Biome, documentation, architecture, browser boundaries, harness catalogue and
  whitespace checks passed; frontend typecheck/build ran inside the image build.

Local evidence: `.verification/image-14824-00f18468-38bd-4119-832b-2e89b9c536c6.json`
and `dist/image-reports/12855699-108d-471e-b287-a85b27851ff1/` (ignored artifacts).
The two earlier native failures exposed unused-module temporary paths under the
read-only root and a nested SSE location without its own proxy handler. Both are
fixed, covered by rejecting fixtures, and exercised in the successful final run.

Pending: remaining full application/browser/measured-quality groups on CI and
post-merge deployment PR #32 source/config handoff. This local artifact is not a
published or promoted release; installed M04 acceptance remains incomplete.

## Out of scope

New UI features, crypto forks, advisory exceptions, publication/promotion,
persistent D06 and full-profile qualification. Deployment PR #32 remains open
until a merged UI revision is pinned and its installed product gate passes.
