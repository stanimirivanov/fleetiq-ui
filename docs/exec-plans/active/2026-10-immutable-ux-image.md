# Immutable UX/static-edge publication

Status: active (issue #71; implementation and PR review pending).
Milestone: M02 - Product Foundation.

## TL;DR

D03 of the Kubernetes delivery plan moves production UI packaging into its source
repository. Qualify one OCI artifact, then let an authorized maintainer publish
those exact bytes. This slice creates no Kubernetes workload or environment.

## Goal

Deliver an immutable production static-edge image with runtime backend routing,
same-origin browser identity behavior and source-bound qualification evidence.

## Scope

- Locked production build and digest-pinned nonroot Caddy runtime. The Caddy
  binary is rebuilt from its pinned source release with patched Go and x/net
  while retaining the official runtime layout.
- External TLS termination, private HTTP proxying, cache/header/host boundaries,
  deep links, readiness and read-only/drop-capability execution.
- Real image tests, existing bundle budgets, image scan, SBOM/provenance,
  digest-preserving transfer and manual maintainer publication.
- Existing UX acceptance, browser and measured-quality gates remain required.

## Design decisions

Use maintained BuildKit, Caddy, Skopeo and Trivy interfaces. Scan original OCI
blobs through a single-runtime entrypoint; do not scan Docker re-exported tars.
Use an owned private registry and a standard verified Docker import to exercise
the production payload without host registry/daemon trust changes.
Keep environment routing out of browser compilation. The gateway owns TLS;
the backend owns authentication, authorization and CSRF decisions.
Action references use reviewed major versions as requested; image/tool pins use
digests. Quality CI is PR-only. Publication is a separate manual operation for
the exact current merged main revision with passing reviewed-tree CI.

## Acceptance criteria

- [x] Actual image traffic proves routes, cache/header/cookie semantics and errors.
- [x] Nonroot/read-only/no-capability execution, probe and graceful stop pass.
- [x] Built files satisfy production graph, integrity and size budgets.
- [x] Source, OCI digest, SBOM/provenance and fresh security evidence agree.
- [x] Publication refuses unreviewed sources, insufficient authority and drift.
- [x] Canonical UX groups and image qualification pass or disclose blockers.

## Acceptance evidence

The complete image group passed locally on the candidate source, including
the fresh high/critical vulnerability threshold, original OCI scan, browser,
HTTPS, registry roundtrip, and owned cleanup. Focused producer and publication
fixtures passed. UX acceptance, browser, and measured-quality scenarios have
also passed locally; the final source-bound receipts and limitations belong in
the pull request. No publication or deployment has been performed.

PR #72 feedback replaces the unavailable cached Skopeo digest with a version-tagged
remote pin and checks tool availability before building. The user approved normal
acceptance for coordinated npm patch/minor upgrades; actual checks remain required,
major changes retain review, and generator-only drift uses source-bound provenance.

## Out of scope

Kubernetes packaging, activation, certificate provisioning, real OIDC/browser
installation qualification and product feature changes remain later plan slices.
