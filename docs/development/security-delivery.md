# Browser trust and secure delivery

## TL;DR

Run pnpm security:install once to install the checksummed scanner, then pnpm check
and pnpm e2e, then pnpm verify --group browser-quality. Publication additionally requires pnpm guide:generate and
pnpm guide:release --require-clean against the same source revision.
Source, history and textual artifacts are scanned; scans never certify pixels.
Keep policy changes reviewable and require external Code Owner protection.

For a pre-push source/dependency and production-image security gate, run
`pnpm security:preflight`; see [local security preflight](image-security.md).
It shares the CI scan policy and cannot replace full image qualification.

## Architectural controls

[The graph rules](../../.dependency-cruiser.cjs) reject runtime and type-only
production imports of tests/E2E fixtures and framework, SDK, UI, demo and transport
dependencies from feature/shared models. Promise and AbortSignal read-port
contracts remain valid. Tests have their own ownership; they may exercise adapters.

[The AST policy](../../tools/boundaries/policy.mjs) registers real product owners
and exact adapter privileges. The graph includes their sources; adding a real
package requires registration, not an empty placeholder package.
TypeScript 7 is the compiler; the separate typescript-parser alias pins the
maintained TypeScript 6 compiler API for static analysis.

The call-site sensor detects bare/qualified fetch, XMLHttpRequest, EventSource,
WebSocket, known HTTP client imports and unmanaged Effect execution. Its fixtures
cover local named, namespace, destructured and bound aliases and local shadows.
Parsing and extraction failures reject qualification.
Dynamic computed properties, custom cross-module executors and arbitrary data
flow remain review obligations. This is bounded syntax analysis, not a runtime sandbox.

Privileges belong to one exact file with an owner and rationale:

- The shared managed browser HTTP adapter owns validated same-origin reads,
  structured failure, cancellation and runtime disposal.
- The exact map lifecycle adapter owns the SDK, local worker and bounded public
  same-origin style read. Static raster/vector resources stay under `/maps/`;
  alternative style transports are rejected before SDK execution.
- Synthetic signal playback owns a joined cancellable fiber, with execution
  permission only. It has no transport permission.
- The exact backend-pinned generated client has a separate import allowance,
  protected by contract provenance and deterministic regeneration.

Native login navigation and ordinary DOM work remain permitted outside models.
New maps or streams need explicitly reviewed adapters and lifecycle tests.
The production Playwright observer exercises valid reads/logout and deliberate
forbidden requests, including intercepted requests. It detects test violations;
it does not add a production firewall or qualify a real OIDC provider.

## Secret and dependency review

[Security policy](../../tools/security/policy.json) has no advisory exceptions. The user approved one exact [public storage identifier false-positive allowance](secret-false-positive-review.md); every other secret value remains enforced.
The checksummed Gitleaks release and default rules are pinned in tooling.
Install it with pnpm security:install; missing, incorrect or failed tooling never
produces a clean scan. Diagnostics expose finding metadata, not secret values.

Source scanning includes tracked/new unignored files, index blobs and Git history.
CI fetches full history. Trusted PR/push bases come from validated GitHub event
metadata and ancestry, not an assumed parent of a synthetic merge. Current and
trusted-base policies both apply. Local/manual scans cover all history.
A base predating this harness uses strict defaults with only that explicitly approved public-identifier classification; it cannot authorize a broader exception. This bootstrap is documented, not an independent
attestation of the scanner source.

pnpm security:dependencies queries the maintained registry advisory service from
a disposable snapshot of the committed lock and importer manifests. Ambient
ignore lists, registry redirection or missing/malformed audit output cannot turn
an incomplete review into a pass. All severities are reviewed; an exception needs
exact identity/version/path, rationale, owner and review expiry. Any accepted
exception must also be allowed by the trusted policy.
Dependabot proposes package and GitHub Action updates; upgrades must requalify
the sensors. The compatible Solid 1.9.17 patch removes the locked Seroval
advisories without a vulnerability exception.

## Reviewing GitHub Action updates

Dependabot updates workflow pins; it does not authorize a new executable in
[the reviewed action registry](../../tools/verification/reviewed-dependencies.json). Review the
official release tag, commit and action.yml, then update that exact registry entry
alongside the workflows. Workflows use only the reviewed repository and major-version reference; arbitrary commits, patch tags and unreviewed majors are rejected. Reviewed commit metadata is historical evidence, not an immutable pin of an upstream major tag.
Use [dependency upgrade review](dependency-upgrades.md) for the read-only preflight,
coordinated manifests and installed-tool qualification. Run delivery-policy fixtures
and the canonical groups before handoff.

On 13 October 2026, Checkout 7.0.1 was verified against its official release tag
at [commit 3d3c42e](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1).
Its [action definition](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/action.yml)
retains Node 24 and introduces allow-unsafe-pr-checkout, defaulting to false.
Our workflow_run publication already requires a successful same-repository main
push and its exact SHA. No unsafe checkout opt-in is needed. The sensor rejects
that opt-in, stale/unreviewed pins, persistent credentials and shallow history.

## Capture and artifact retention

Guide recording is opt-in and limited to the loopback test server.
Browser contexts use empty storage, block service workers/live sockets, and deny
unmocked API traffic. Page-owned contract fixtures can provide synthetic responses.
Production-shell, connected-contract and development-sample guide modes are
accepted. Connected-contract labels production-UI demonstrations with synthetic,
validated metadata responses and a simulated fixed sign-in return; it grants no
additional network or recording permissions.
Never reuse an authenticated browser profile or point recordings at live identity.

The artifact inspector rejects links/junctions, unknown formats, empty content,
unsafe archive entry paths and excessive decompression. Maintained yauzl inspects
ZIP entries; bounded textual content, including Playwright trace archives, goes
through the pinned secret detector before retention. The trace viewer's
.webmanifest is accepted only as a UTF-8 JSON object and its original bytes remain
fully scanned. Malformed manifests and other unknown formats still fail. Failure uploads require the
inspection step's success; no inspection means no upload.

PNG/WebM signatures and regular-file ownership validate expected media, not the
privacy of visible content. Screenshots/video still require synthetic capture and
human review. Live capture would need a separately approved policy and redaction;
it is not enabled by this change.

## Exact-source guide publication and recovery

Quality verification is PR-only. Guide workflow completion events from PRs cannot
publish; the manual main-branch trigger checks out an explicit SHA and reruns
acceptance plus both browser suites before generation. The retained legacy main-push
completion condition is inactive while quality has no push trigger.
Fork, PR, failed and non-main automatic runs cannot publish.
Actions use reviewed major-version references, credentials are not persisted,
quality permissions are read-only, and only deployment has Pages write authority.

The generator qualifies the shell-free pinned launcher, requires current group
evidence, validates chapter/mode/order/media coverage and scans the assembled
output. It records an ignored ready marker containing source and evidence/output
hashes. Release rechecks source, evidence, content and scan results; publication
also rejects dirty sources. Stale, modified, missing or malformed evidence blocks
release. A locally dirty checkout may generate for review but cannot publish.

Cleanup traverses only verified owned output and rejects linked ancestors before
destructive operations. Recovery fixtures cover launch/nonzero exit, incomplete
media/assembly and preservation of unrelated files.

## Limits and administration

Policy, fixtures and runner remain writable repository code. Dual-base policy
evaluation does not independently protect a deliberately modified scanner.
Require successful quality jobs, Code Owner review, stale approval dismissal,
limited bypass rights and a protected Pages environment in GitHub. These remote
settings are not verified by local tests. Host tool/credential permissions remain
outside repository Markdown.

Measured performance, rendered accessibility and critical behavior coverage
belong to the remaining harness PR. No scan, mock journey or source hash proves
production readiness, visual privacy or deployment capacity.

Measured quality adds the third exact-source qualification group. Raw component coverage/test reports stay ignored and are not uploaded. Only validated category/count/timing quality receipts and inspected synthetic browser artifacts are retained. See [measured browser quality](measured-browser-quality.md).

Production image delivery additionally follows [the image publication guide](image-publication.md). Image reports have their own inspected retention root and cannot substitute for canonical UX verification receipts.
