# Verification and harness ownership

## TL;DR

Install the checksummed detector with pnpm security:install. Run focused checks while developing, then pnpm check. Run pnpm e2e for browser
behavior or verification workflow changes. Each canonical group produces fresh,
ignored JSON evidence bound to the current revision and source bytes. A failed,
unavailable or interrupted run, or differing initial/final source snapshots,
cannot pass the selected group.
Read scoped guidance before editing an owner. Harness changes need deliberately
invalid fixtures and code-owner review.

## Discover relevant context

[AGENTS.md](../../AGENTS.md) and the [documentation map](../README.md) route to the
[architecture](../../ARCHITECTURE.md), [frontend structure](frontend-structure.md),
[testing](testing.md), [contract ownership](../../contracts/http/README.md) and
[plans](../PLANS.md). Scoped working agreements sit beside app composition,
features, shared code, browser scenarios and tools.

The documentation sensor requires visible Markdown routes. Root instructions have
a 900-word budget; scoped instructions a 400-word budget. Context guidance cannot
restrict the agent host's tools, network or filesystem permissions.

## Canonical inventory

[The catalogue](../../tools/verification/catalogue.mjs) owns explicit check IDs,
package scripts and required CI routes. Use pnpm verify --list to inspect groups.

| Command | Checks | Intended use |
| --- | --- | --- |
| pnpm check | Harness fixtures/policy, quality configuration, scoped coverage/obligations, assertion mutants, output budgets, style, graph/AST boundaries, view size, docs, design, contract, source/history secrets, advisory review, types, unit/component tests, guide tests, build | Complete acceptance group |
| pnpm verify --group structural | Harness fixtures/policy, quality configuration, style, graph/AST boundaries, view size, docs, design, contract | Portable harness qualification |
| pnpm verify --group product | Types, unit/component tests, build | Focused product feedback |
| pnpm e2e | Built-production and development browser scenarios | Browser behavior and sample isolation |
| pnpm verify --group browser-quality | Production-fixture accessibility/rendering/resource checks and actual page-error fixture qualification | Measured browser regression envelope |
| pnpm image:qualify | Producer fixtures/policy and real OCI/runtime/browser/TLS/scan/registry checks | Source-owned D03 artifact qualification |
| pnpm verify --group security | Source/index/history secret scans and frozen-lock registry audit | Focused security feedback |

pnpm verify defaults to acceptance. Existing individual scripts remain available
for focused feedback; they do not establish a complete-group verdict. Acceptance
does not imply browser qualification; CI requires all three groups. No group establishes
production readiness, real-provider OIDC behavior or live-fleet performance.
The browser-quality group qualifies only the calibrated rendering envelope.

Use the reviewed Node major, pinned pnpm, Git and a frozen install. The runner launches pnpm's
native executable directly or its resolved JavaScript entry through Node, avoiding
Windows shell-shim quoting. PATH symlinks and .mjs entries are supported; cmd, bat
and PowerShell shims are never executed through a shell. It qualifies
actual tool versions and selected canonical commands before execution. Missing
prerequisites produce not-run evidence. Install Playwright Chromium and use the
documented [port overrides](testing.md) if a browser port is occupied.

## Dependency upgrade preflight

All groups first validate registered declarations against the
[reviewed registry](../../tools/verification/reviewed-dependencies.json).
Run pnpm dependencies:review for coordinated candidate pins and review instructions.
Malformed or inconsistent inventory is blocked. Root/E2E Node declaration versions
must match each other and the declared runtime major.

Pending npm major-tool proposals can run the unchanged group in an owned
disposable workspace through pnpm dependencies:qualify --group followed by
product, structural, browser or browser-quality. The snapshot preserves complete
Git history/refs, staged index and raw current source files; only its private
registry receives coordinated exact candidate tool pins. It performs a fresh frozen
install, scanner setup, policy check, selected group and artifact inspection.
Action, Node-major and pnpm proposals require review first.

Exact coordinated npm patch/minor updates run normal original-source verification
against their declared installed versions. Historical registry drift is informational;
complete receipts record declared status and can qualify publication. Actual failures
and major/runtime/action changes retain their gates. No actor-name exemption or
automatic registry write is involved. Read [upgrade policy](dependency-upgrades.md)
for eligibility, source-bound generator maintenance, review and recovery.

Ordinary receipts include dependencyReview and installedTools status/counts.
Exact installed metadata is checked in each owner, including dependency-cruiser's
private parser, and resampled after execution. Guide qualification requires current
review/install status with zero issues and no proposed changes. Candidate receipts
are explicitly marked kind: dependency-candidate, retain completePass: false and
cannot establish publication acceptance; legacy or incomplete receipts also fail.

## Plan, execute, verify

1. Inspect the branch and preserve existing changes. Read scoped guidance and
   record the goal, milestone, boundaries and acceptance criteria.
2. Implement the complete slice. Demonstrate a sensor gap with a deliberate
   invalid fixture, then make that fixture fail for the expected diagnostic
   while a positive control passes.
3. Run focused checks, inspect output and correct failures. Run required canonical
   groups against final sources; inspect the evidence.
4. Report passed, failed and not-run separately. Complete the slice's plan with
   results and limitations; preserve an unfinished parent sequence.

Parsed execution plans require status, milestone, goal, scope and acceptance
evidence (or evidence), matching the historical common format. New plans also
include design decisions, acceptance criteria and out of scope under the
contribution guide. Those additional sections remain author/reviewer-owned;
historical plans are not rewritten to invent missing decisions.

## Evidence and incomplete runs

Ignored .verification/ JSON records the group, timestamps, versions, revision,
dirty state, aggregate source digest and check statuses, exit codes and durations.
It stores no stdout/stderr, source content, environment, HTTP payloads or tokens.
Ordinary commands still print human output.

Candidate-prefixed receipts retain bounded qualification stages, proposed exact
tool roles, original source identity and isolated candidate identity. A successful
qualificationPass is diagnostic test evidence with completePass: false. Original
checkout/index/ref/policy drift and failed temporary cleanup invalidate it.
Candidate output is never an original-source acceptance receipt, including after
renaming the file.

The source digest covers tracked and new unignored files, hashing raw bytes and
paths before and after verification. Ignored generated evidence does not affect
it. A stable dirty checkout can pass; differing final bytes of already-dirty
content invalidate the verdict. This comparison does not detect transient edits
that are reverted before the final snapshot. Git redirection variables are cleared for inventory and revision
reads so another checkout cannot supply a misleading source identity.

Disposable Git fixtures must supply their own scan environment and event commits;
they cannot inherit the enclosing workflow's PR or push revisions. Exercise
fixture-owned CI event files as well as local full history. Never disable trusted
event selection globally to make fixture tests pass.

A launched nonzero command is failed; missing prerequisites or launch failures
are not-run. After an incomplete stage, remaining checks are not-run. Interrupted
children close before the final snapshot. Different final sources reject acceptance even
when every command returned zero. A selected-group pass never implies an
unselected group passed.

Temporary roots remain owned. Evidence is created exclusively, and its directory
cannot be replaced by a link. Source/link sensors inspect exact casing and
canonical containment, including Windows junctions, before reading targets.
Quality CI retains bounded JSON and inspected synthetic browser artifacts for seven days. Every upload requires successful textual/archive inspection under the [capture and delivery policy](security-delivery.md). Scanning does not certify pixels.

Evidence is an observation, not a signed independent attestation against an actor
who can change the runner and its policy together.

## Sensor qualification and dependencies

pnpm harness:test covers positive/negative docs, tokens, contract/provenance,
generated bytes, actual architecture/lint tools, policy and runner outcomes.
Graph/model/type-only and AST transport fixtures now cover the registered production owners. Security fixtures exercise real pinned detection, validated trusted bases and advisory/artifact bypasses. Existing view-size and expanded guide recovery tests remain in their named acceptance stages.

- Markdown/GFM parsing covers links, references, heading anchors, encoded paths,
  exact casing, visible routes, budgets and plan metadata. Git discovery excludes
  ignored IDE documents, includes new sources and handles intentional tracked
deletions.
- Architecture probes execute installed dependency-cruiser and Biome with copied
  production configs. They check named runtime/type-only violations, valid public
  entries, cycles, graph completeness and extraction capabilities. Missing tools
  or omitted sources fail. The JSON reporter exit status alone cannot prove a
  clean graph.
- Token fixtures preserve every light/dark contrast threshold. Contract fixtures
  preserve exact provenance, operations, cookie security and generated bytes;
  generation check mode cannot write.
- Launcher fixtures exercise real subprocesses, native binary dispatch, Corepack
  links, .mjs entries, exact-version rejection and unavailable children.
- Fresh Git checkout fixtures prove LF text and unchanged binary bytes even with
  core.autocrlf=true and core.eol=crlf. The root .gitattributes default covers new
  tooling extensions; intentional CRLF test inputs are synthesized by fixtures.
- YAML fixtures reject missing/conditional canonical jobs, command bypasses,
  unfrozen installs, event filters and unregistered execution overrides.

Native TypeScript 7.0.2 remains the application compiler. Dependency-cruiser
18.5.0 needs a JavaScript compiler API; a workspace package extension supplies
TypeScript 6.0.3 specifically to that tool. A separately declared typescript-parser alias supplies the maintained AST API to the browser boundary sensor; yauzl 3.4.0 inspects archive entries. The wrapper qualifies TS/TSX parsing
and type-only extraction. Upgrade parser and compiler independently and qualify
known-invalid imports after a clean frozen install.

New development-only, MIT-licensed pins are unified 11.0.5, remark-parse 11.0.0,
remark-gfm 4.0.1, github-slugger 2.0.0 and yaml 2.9.1. These replace custom parsing,
introducing no browser runtime dependency. Review lockfile changes and upstream
advisories on upgrade. See the maintained
[remark parser](https://github.com/remarkjs/remark/tree/main/packages/remark-parse),
[YAML parser](https://github.com/eemeli/yaml) and
[pnpm package extensions](https://pnpm.io/settings#packageextensions).

Qualified Solid fixtures cover destructured component parameters and incorrect
JSX array mapping; body destructuring and derived/lifecycle state still need
review. Pure-model dependency and browser-global execution controls and bounded raw-transport/Effect call-site checks are now executable. Arbitrary cross-module aliases and dynamic computed properties still need review.
Cohesion and appropriate abstractions remain review responsibilities.

## CI and external administration

Quality CI requires Linux acceptance, functional and measured browser scenarios,
and Windows structural qualification from frozen installs. The check job retains
original-source acceptance; eligible maintenance updates need no second registry edit. Browser, browser-quality
and harness-windows use explicit candidate qualification routes so eligible
dependency proposals expose behavioral results before review. Parsed policy
verifies these exact routes, the required check barrier and read-only permissions.
CODEOWNERS assigns harness/configuration changes to the current maintainer.

A GitHub administrator must separately require successful check, browser, browser-quality and
harness-windows and image jobs on main; code-owner review; stale-review dismissal; suitable
bypass restrictions; least-privilege workflow permissions; and publication
approvals. These external settings have not been verified locally. CODEOWNERS and
a passing sensor cannot attest they are enabled.

Both guide triggers rerun acceptance and browser qualification at the exact publication SHA, then validate generation, source/evidence/output hashes and artifact inspection. Publication requires clean sources. Actions use reviewed major-version references and checkouts keep no credentials. See [trust and delivery](security-delivery.md) for exception policy, recovery and remaining self-attestation limits. Measured browser quality is enforced by the separate browser-quality group; real identity deployments remain unqualified.

## Measured browser-quality qualification

Run pnpm verify --group browser-quality for the dedicated production-fixture lane. Full acceptance now includes complete critical coverage registration, named behavior obligations, assertion mutation qualification and final output budgets. Browser scenarios must use the owned error-observing fixture. Three source-bound groups are required before guide generation/publication. See [measured quality](measured-browser-quality.md) for workload, caps, recovery and [control owners](harness-controls.md).

The [image delivery group](image-publication.md) adds exact-source artifact qualification. PR-only quality CI includes its mandatory image job. Publication is a separate manual current-main operation; no environment is deployed. Image report JSON is inspected separately from canonical .verification receipts.
