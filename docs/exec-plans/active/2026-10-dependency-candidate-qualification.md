# Qualify dependency candidates before recording approval

## TL;DR

Gather actual upgrade test results before maintainer approval, using an isolated
candidate workspace and unchanged gates. Keep the required check job blocked
until original-source review is recorded. Repair the current reviewed tool/action
drift and prevent Node declaration/runtime major mismatch.

Status: active (implementation complete; PR review and merge pending). Final group verdicts belong to the source-bound handoff receipts.
Milestone: M02 - Product Foundation

## Goal

Avoid repeated opaque Dependabot failures caused by approval preflight stopping
every job before tests can run. Separate candidate compatibility evidence from
original-source acceptance while preserving all existing checks and review barriers.

## Scope

- Explicit candidate qualification for coordinated critical npm-tool proposals.
- Disposable exact-source workspace with independent complete Git objects/history,
  refs, original staged index and raw tracked/new working files.
- Fresh frozen install, scanner setup, policy verification, unchanged selected
  group and artifact inspection in that workspace.
- Candidate receipts with original/isolated source identities and bounded outcomes.
- Candidate acceptance collection in check, retaining nonzero pending-review status.
- Candidate routes for browser, browser-quality and Windows structural CI jobs.
- Publication refusal for candidate receipts and source/index/ref/policy drift.
- Current reviewed Vite, Playwright and merged Action pin repair.
- Coordinated exact Node declaration versions matching the execution runtime major.
- Positive, deliberately invalid and actual subprocess fixtures; guide updates.

## Design decisions

Original manifests and workflow changes are proposals. The reviewed source
registry changes only through a documented maintainer review decision. The temporary
workspace substitutes eligible exact npm-tool pins into its private registry to
exercise existing sensors; it never writes that proposal back into approval.

Candidate eligibility includes the existing compiler, AST parser, dependency-cruiser,
Vite, Axe, archive parser, Vitest and Playwright roles. Unknown/mutable/inconsistent
declarations fail. Action, Node-major and pnpm changes require review first. Preserve
independent compiler/parser decisions, security scopes, calibrated browser limits
and publication permissions.

A receipt marked kind: dependency-candidate can set qualificationPass only for a
complete stable run; completePass remains false. A renamed candidate cannot publish
a guide. The check job collects candidate acceptance tests but remains blocked until
original review is current. The other three required jobs can expose qualification
results. No Dependabot identity bypass, automatic merge or privileged PR workflow
is introduced.

Use Node 24 declarations with Node 24 execution. The proposed Node 26 declarations
compiled current code successfully; the reason for alignment is that newer ambient
types can permit APIs unavailable on the supported runtime. This was not an observed
compilation failure.

The isolated source, index, refs and repository policy are captured immediately
after the single private registry substitution. Recheck that prepared baseline
after every stage and artifact inspection; install-time changes cannot become
a new test baseline. The original checkout is checked independently.

## Current repair and upstream provenance

- Vite 8.3.2 to 8.3.4: reviewed development-server, CSS/HMR, preload and build fixes.
  Installed engines support Node 24; production/dev checks and bundle limits remain
  required. [8.3.3 release](https://github.com/vitejs/vite/releases/tag/v8.3.3),
  [8.3.4 release](https://github.com/vitejs/vite/releases/tag/v8.3.4).
- Playwright 1.63.0 to 1.64.0: Chromium changes to 156.0.8078.4; release also changes
  device screen forwarding, JSX compilation, hidden iframe visibility and explicit
  missing-snapshot behavior. Qualify browser scenarios and measured negative
  controls without raising limits. [Release](https://github.com/microsoft/playwright/releases/tag/v1.64.0).
- Setup Node 7.1.0: official tag resolves to
  949feb2413d6458794dcd2491c4babbbce0c15c1; exact action definition uses Node 24.
  Review includes v7 ESM/auth-export changes and v7.1 validation/retries.
  [Release](https://github.com/actions/setup-node/releases/tag/v7.1.0),
  [exact action definition](https://raw.githubusercontent.com/actions/setup-node/949feb2413d6458794dcd2491c4babbbce0c15c1/action.yml).
- Upload Artifact 7.0.2: official tag resolves to
  cf430e030ddbb5b0abf93d22962f4752f3646cd9; exact definition uses Node 24 and
  retains archived-upload defaults. Preserve inspected inputs and existing upload
  permissions. [Release](https://github.com/actions/upload-artifact/releases/tag/v7.0.2),
  [exact action definition](https://raw.githubusercontent.com/actions/upload-artifact/cf430e030ddbb5b0abf93d22962f4752f3646cd9/action.yml).
- Root/E2E @types/node 26.6.5 proposals return to existing 24.19.1; other dependency
  bumps remain. Inventory now enforces runtime/declaration coherence.
- Jest DOM 7.0.1 requires Node at least 22 and DOM Testing Library as a peer;
  installed DOM peer 10.4.2 resolves from the actual owner. Component assertions
  remain required. [v7 breaking changes](https://github.com/testing-library/jest-dom/releases/tag/v7.0.0),
  [7.0.1 release](https://github.com/testing-library/jest-dom/releases/tag/v7.0.1).
- Effect generator/platform 4.0.2 peers match installed Effect 4.0.2. Generator
  changelog lists dependency updates; exact committed client reproduction already
  passed. [Generator changelog](https://raw.githubusercontent.com/Effect-TS/effect/main/packages/tools/openapi-generator/CHANGELOG.md),
  [Platform release](https://github.com/Effect-TS/effect/releases/tag/@effect%2Fplatform-node@4.0.2).

## Acceptance criteria

- Coordinated eligible npm proposals run the unchanged selected checks.
- Original registry, source, index, refs and local policy remain unchanged.
- Every candidate install is frozen and resolves the exact proposed tools.
- Security, harness policy, actual negative controls and artifact scans remain required.
- Inconsistent, unknown, unsafe-checkout and action/runtime/manager proposals fail.
- Candidate failure, missing evidence or drift cannot report qualification success.
- Pending review keeps check nonzero even after passing candidate acceptance tests.
- Other required jobs return candidate outcomes without granting original acceptance.
- Candidate and ordinary pending-review receipts cannot qualify guide publication.
- Current repaired sources pass full acceptance, browser and measured browser groups.
- Copy-ready handoff records source-bound evidence and exact limitations.

## Acceptance evidence

Upstream release tags and Action definitions were checked against official sources.
The current repair passed 104 focused registry/inventory tests, current read-only
inventory review, frozen install, web/E2E typechecking, exact generated contract
verification, formatting and diff checks.

Candidate coordinator, policy, publication, process and retention controls passed
focused positive and invalid probes. A real isolated CLI product qualification
ran a frozen install, types, unit tests, 175 component tests, build and artifact
inspection. It returned qualification success while both retained receipts kept
completePass false; the private successful acceptance receipt was discarded.
The supplied source registry and staged index stayed unchanged.

Git split-index bookkeeping emits the in-memory CE_UPDATE_IN_BASE flag; accepting
that exact flag preserves canonical staging while intent-to-add, hidden and unknown
flags remain rejected. The final workspace fixtures include this compatibility
case and ownership, partial-history, source/index/ref drift controls.

The final handoff must include fresh complete pnpm check, pnpm e2e, pnpm verify
--group browser-quality and artifact inspection results at the unchanged source
identity. Their ignored .verification receipts are authoritative; preliminary
runs interrupted or invalidated by source edits are not acceptance evidence.
Earlier receipts from the merged harness PR do not qualify this changed source.

## Windows checkout identity regression

The Windows structural job exposed a Git/Node path-spelling mismatch when the
runner TEMP directory uses a DOS 8.3 alias. The original display-string comparison
rejected the same physical repository before isolation. Compare native canonical
directory names and exact device/file IDs after rejecting links; leave checkout,
index, history, source-drift and cleanup checks intact.

Regression qualification must exercise a real owned Windows short-path fixture
without changing filesystem settings or global Git configuration. Positive snapshot
assertions and unrelated-root, linked-ancestor and invalid-checkout controls remain
mandatory. Fresh source-bound group receipts, rather than earlier run results,
establish acceptance for this repair.

## Out of scope

Automatic approval/merge, new publishers, Node/pnpm major upgrades, remote GitHub
ruleset changes, scanner/advisory exceptions, changed coverage/performance limits,
product features and user-guide regeneration.
