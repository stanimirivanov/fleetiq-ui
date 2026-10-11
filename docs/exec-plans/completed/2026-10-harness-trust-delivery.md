# Enforce browser trust boundaries and secure delivery

## TL;DR

PR2 of the accepted UX harness sequence makes model/transport boundaries
executable, adds source/history/advisory and artifact gates, and qualifies guide
publication at its exact revision. PR3 remains measured browser quality.

Status: completed
Milestone: M02 - Product Foundation

## Goal

Prevent frontend changes from bypassing owned model/transport boundaries and
prevent unqualified browser evidence or guide output from being published.

## Scope

Complete graph/AST boundary controls and adversarial fixtures; checksummed source,
index/history secret scanning and maintained advisory review; update automation;
immutable CI actions and inspected retention; exact-source guide generation,
release evidence, output ownership, synthetic capture and recovery tests.
The product contract and existing screen behavior remain unchanged.

## Design decisions

- Retain Solid, Effect v4, dependency-cruiser, Biome and current ownership.
  Use explicit TypeScript 6 AST tooling beside the native TypeScript 7 compiler.
- Preserve Promise/AbortSignal read ports and exact-file execution-only permission
  for the synthetic cancellable stream; prohibit its network access.
- Use maintained Gitleaks, registry pnpm audit and yauzl. Never substitute custom
  secret regexes or silently ignore scanner/network failures.
- Evaluate current and trusted-base exception policy; require external owner
  protection for writable sensors. A pre-harness base uses strict defaults with only the explicitly user-approved public storage identifier classification.
- Upgrade Solid to a compatible patched release rather than force an unsupported
  serializer range or add an advisory exception.
- Require full acceptance and browser evidence at the exact publication SHA.
  Keep local generation reviewable while requiring clean sources for publication.
- Synthetic capture and human review protect media; text scans do not certify
  screenshots/video. Validate file ownership and media headers separately.

## Acceptance criteria

- Real-tool runtime/type-only/model-SDK/test imports and AST transport/execution
  bypass fixtures fail with their expected policy; approved adapters, shadows,
  read-port contracts and native auth navigation pass.
- Source/index/history secrets and disallowed advisories fail without leaking
  values; missing tools, invalid trusted bases, network failure and malformed
  reports cannot produce clean verdicts.
- Workflow mutation tests reject mutable actions, widened permissions, credential
  persistence, skip/bypass paths and unqualified uploads/publication.
- Generator/release failure, missing/invalid/empty media, wrong modes/order, stale
  evidence and linked output fixtures reject release and preserve unrelated data.
- Canonical acceptance, browser groups, guide generation and release inspection
  run against final source; frozen installation reproduces declared tooling.

## Acceptance evidence

- Passed: pnpm check, all 16 acceptance stages on Windows. There were 385
  harness regressions, 170 Solid component tests across 28 files, 60 guide recovery
  and release tests, 3 theme tests and 4 view-size fixtures, without failures or
  skips. TypeScript checks, design tokens, pinned contract bytes and build passed.
- Passed: actual dependency extraction of 188 sources and 708 dependencies;
  browser AST analysis of 160 production sources. Runtime/type-only/model/test
  violations, known aliases, omitted ownership and disabled extraction controls
  have deliberately invalid real-tool fixtures.
- Passed: pnpm e2e, 34 production and 24 development scenarios without retries,
  including valid connected reads/logout and actual forbidden browser requests.
- Passed: source/index/history inspection with checksum-qualified Gitleaks 8.30.1
  and the exact user-approved public storage identifier allowance. No advisory
  exception was added. The isolated audit qualified three frozen importers with
  zero advisories; the deliberately vulnerable old lock still reported two.
- Passed: a fresh disposable frozen installation, 327 packages, followed by
  actual graph and AST scans against the copied Git-owned sources. Compiler
  7.0.2 and explicitly declared parser 6.0.3 reproduced without ambient tooling.
  The owned temporary checkout was removed.
- Passed: real pnpm guide:generate, all six recording journeys and chapters,
  96 PNG screenshots and six WebM videos. The assembled inventory has 123 files
  plus its readiness marker. Local pnpm guide:release validated the exact source,
  both complete group reports and output hashes; all four retention roots passed
  textual/archive inspection. Media headers were checked, not certified private.
- Passed negative control: pnpm guide:release --require-clean rejected this
  uncommitted checkout. A clean source is required for hosted publication; local
  review does not grant publication permission.
- Completion documentation is followed by another canonical acceptance/browser
  run and guide regeneration/release inspection, binding current evidence to the
  final documented source. Bounded JSON receipts and readiness metadata remain
  ignored under .verification/ and dist/user-guide/.
- Not-run: hosted Linux/Windows CI, clean GitHub Pages publication, real OIDC
  deployment and remote required-check/Code Owner/environment protection.
  Those external settings remain explicit administration obligations.

Parent sequence: [Harness hardening](../active/2026-10-harness-hardening.md).

## Out of scope

Real-provider OIDC qualification, new backend endpoints, native mobile, map/stream
APIs, universal static alias analysis, independent signed attestation, live
recordings and the measured browser-quality work reserved for PR3.
