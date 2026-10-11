# FleetIQ UX harness audit and hardening plan

## TL;DR

At the audited revision, the SolidJS app had credible dependency, reactivity, contract, and browser
verification controls. Their coverage is narrower than the supplied audit claims:
type-only prohibited imports, framework imports in pure models, and raw transport
outside the shared runtime passed isolated probes. The docs sensor currently fails
on Git-ignored IDE content. Complete three harness PRs: self-validating context and
verification; executable trust boundaries and secure delivery; measured browser
quality. Keep semantic design review and real deployment qualification explicit.

Status: active (agreed; PR1 and PR2 completed; PR3 pending)
Milestone: M02 - Product Foundation
Audit date: 11 October 2026
Audited revision: 8761f7c8c958f5d92111e8fc3e6b279edacd3004

## Goal

Reduce recurring architecture drift and false confidence by pairing each important
guide with a reliable sensor, proving that sensor detects deliberate violations,
and recording verification against the revision actually reviewed or published.

## Scope

Reviewed root guidance, routed architecture and development guides, package scripts,
Biome and dependency-cruiser configuration, custom checks and tests, Vitest and
Playwright setup, contract generation, guide assembly, and both GitHub workflows.
Compared the supplied audit with this checkout and used read-only checks plus
isolated disposable fixtures. No product or workflow implementation is included in
this audit. Remote branch protection and agent-host permissions were not inspected.

The framework is the distinction between guides and sensors in
[Birgitta Boeckeler's article on Martin Fowler's site](https://martinfowler.com/articles/harness-engineering.html),
OpenAI's [repository knowledge and structural enforcement approach](https://openai.com/index/harness-engineering/),
and Mitchell Hashimoto's [fast verification feedback loop](https://mitchellh.com/writing/my-ai-adoption-journey).
These support prioritizing executable constraints and reliable feedback; the
specific proposals below follow from this repository's evidence.

## Implementation progress

The [completed first PR](../completed/2026-10-harness-context-verification.md)
implements context and verification hardening. Its canonical gates and clean
frozen installation passed. [The completed trust and delivery PR](../completed/2026-10-harness-trust-delivery.md) adds graph/AST trust boundaries, source/history/advisory controls and exact-source guide release. PR3 (measured browser quality) remains pending. Findings below describe the dated baseline;
upgraded coverage is recorded separately, preserving the original audit.

## Design decisions

- Keep Solid, Effect v4, the existing feature/model/api/ui layout, Biome,
  dependency-cruiser, Vitest, and Playwright. A harness upgrade does not require Nx
  or a new application framework.
- Use existing maintained tooling before adding a custom detector. When call-site
  analysis requires an AST, review and pin a maintained parser explicitly. Do not
  implement a TypeScript parser with regular expressions or assume the native
  TypeScript 7 compiler provides a programmatic AST API.
- The architecture tool currently resolves a TypeScript 6.0.3 parser while the
  root compiler is TypeScript 7.0.2. The committed lockfile has no 6.0.3 entry,
  and dependency-cruiser declares no TypeScript dependency. Local graph extraction
  therefore depends on an available parser not reproducibly declared by this lock.
  This is an ambient-parser concern, not proof that application compilation or
  TypeScript 7 syntax is broken. Qualify a clean frozen install with known-invalid
  import fixtures and explicitly pin any required parser support.
- Keep check outcomes passed, failed, and not run distinct. Missing prerequisites
  and partial runs cannot produce an acceptance pass.
- Scoped instructions improve discovery. Repository checks can validate their
  links and budgets, but cannot prove an agent reads them or constrain its tools.
  Filesystem, network, credential, and publication permissions belong to the host,
  CI runner, and repository administration.
- Structural constraints do not prove SOLID, responsibility cohesion, useful tests,
  accessibility, or visual design. Record the remaining review obligations instead
  of assigning a misleading overall deterministic percentage.

## Assessment across the four pillars

- **Context engineering:** the root map is lean and useful. Scoped routing,
  source discovery and plan lifecycle are not independently protected; ignored
  IDE context currently contaminates verification.
- **Guides and constraints:** ownership and read-port boundaries are documented
  clearly. Type-only edges, pure-model dependencies and raw transport have
  measurable gaps. No repository text substitutes for host permission controls.
- **Sensors and verification:** structural and behavior checks execute in CI, but
  most custom sensors lack persistent adversarial tests. Verification provenance,
  artifact release, security review and measured browser budgets need gates.
- **Progressive hardening and recovery:** view and guide tests demonstrate the
  right direction, and partial-output cleanup exists. Expand that feedback to
  every load-bearing control and record reviewed/deferred obligations explicitly.

## Harness drift report

Classification: **deterministic** means the named tool verifies a bounded property;
**partial** means a sensor exists with material scope or assurance gaps;
**agent/review** means the guide relies on judgment or reported evidence;
**unverified/deferred** means no corresponding gate is configured here.

| Stated intent | Actual mechanism | Classification and gap |
|:--|:--|:--|
| Lean, current context | Root [AGENTS](../../../AGENTS.md), [documentation map](../../README.md), architecture and frontend guides | Agent/review. Good short entry points; no scoped agreements or tests of canonical routes. |
| Inward dependencies and independent features | [dependency-cruiser rules](../../../.dependency-cruiser.cjs) run from the quality gate | Partial. Runtime edges are checked, but current options omit prohibited type-only edges. |
| Pure feature/shared models | Selected internal target paths forbidden by dependency-cruiser | Partial. Solid/Effect imports and browser globals in models passed probes; model-to-demo edges are not forbidden. |
| Public module entries and cycles | Resolved-file public-entry rules, unresolved package-import check, circular-import rule | Deterministic within the scanned graph. Not proof that public exports themselves form a good capability contract. |
| Reproducible graph extraction | Local dependency-cruiser resolves an installed TypeScript 6 parser absent from the committed lock | Partial/unqualified. Clean frozen-install extraction capability was not tested in this audit; a known-invalid import must fail on CI and local tools. |
| Complete architecture scan | Root script starts at apps/web/src | Partial. E2E ownership is outside the entry set. No packages directory currently exists; its rule is future policy, not a current bad package. |
| Product never depends on test-only code | Testing guide says fixtures are test-only | Agent/review. A product-to-E2E fixture import passed a real CLI probe. |
| No Effect in presentation | Scoped Biome restricted imports for presentation TSX | Deterministic for direct imports in these scopes. A direct Effect-import positive control failed; indirect execution and other TS files remain outside this guarantee. |
| Managed connected transport only | Shared HTTP adapter plus unit tests of same-origin, headers, bounds, timeout and disposal | Partial. Good adapter behavior tests; bare fetch and window.fetch outside the adapter passed static checks. |
| Solid tracking discipline | Biome destructured-prop and JSX iteration rules | Deterministic selected syntax. Memo versus effect choice, resource ownership and all reactive tracking remain behavioral/review concerns. |
| Small cohesive pages | [view-size gate](../../../tools/check-view-size.mjs), four checked-in tests | Deterministic name/line threshold with a rationale escape hatch. Renaming, dense lines and a long comment do not prove cohesion or review approval. |
| Semantic styling and accessible contrast | [design check](../../../tools/check-design-tokens.mjs) evaluates fourteen token pairs in both themes | Partial. Does not enforce semantic-token use at every component or inspect rendered accessibility; no dedicated adversarial sensor tests. |
| Current docs and plan lifecycle | [docs check](../../../tools/check-docs.mjs) uses existence, word-count, link regex and status substring | Partial, with a current false failure. Traverses ignored IDE documents; ignores reference links and anchors; status can be incidental fenced text. No dedicated tests. |
| Pinned contract and deterministic generation | Provenance hash/shape, thirteen operations, cookie declaration, generated-text comparison | Deterministic local consistency. Hashes do not independently authenticate an upstream revision; update provenance remains reviewed. Neither sensor has its own negative fixture suite. |
| Production sample isolation | Production Playwright cases and development-only activation | Deterministic tested browser behavior. Historical bundle searches in plans are observations, not a permanent output-content gate. |
| Browser and PEV verification | Quality workflow runs check and browser jobs; completed plans record commands/outcomes | Partial. No authoritative check inventory, machine-readable revision-qualified outcomes, or parsed CI consistency sensor. GitHub required-status enforcement is external and unverified. |
| Complete and safe guide publication | Required chapter/mode/step checks, assembly tests, generator cleanup, same-repository successful-main-push automatic trigger | Partial. Only three assembly tests; no generator failure/cleanup tests. Manual dispatch omits full acceptance at the publication SHA. Media checks follow symlinks and accept empty files. |
| Credentials and known vulnerabilities excluded | Security guidance, exact application dependency versions and frozen lockfile | Agent/review for credentials and advisories. No source/history secret scan, artifact release check, advisory policy or update automation in UX. Quality workflow permissions are not explicitly minimized; Actions use movable major tags. |
| Performance, test sufficiency and operational visibility | Honest deferred capacity statements, functional tests | Unverified/deferred. No scoped coverage floor, calibrated UI latency/memory or bundle budget, rendered accessibility gate, or browser-error obligation. |

## Corrections to the supplied audit

1. Dedicated custom-sensor tests exist for view size and guide assembly, not for
   every sensor. Removed temporary violation probes in a completed plan are useful
   past evidence; they are not continuously running regression tests.
2. Transport policy tests are Vitest unit tests of the adapter, not browser-based
   OIDC qualification. Connected production browser journeys intercept HTTP.
   [The testing guide](../../development/testing.md) explicitly preserves that distinction.
3. The reported source-code-full.txt artifact is absent and not tracked here.
   Avoid adding blanket zero-byte or unreferenced-document prohibitions for a
   defect that is not present.
4. The platform now has trusted-base secret scans and bypass fixtures. Reuse its
   lessons; do not describe both repositories as currently lacking scanning.
5. Node is selected by major version and Actions by major tags in CI. Exact library
   pins and a lockfile are strengths, but do not constitute vulnerability review.
   Release-age exclusions alone do not establish an explicit repository delay.
6. A scoped AGENTS file cannot turn model context loading into a deterministic
   action. Mechanical route integrity and actual host permissions are separate.

## Vulnerability breakdown

These are harness assurance gaps, not findings of an exploited vulnerability or
leaked production credential.

- **Boundary bypass:** the graph misses type-only edges; model allowlists do not
  express purity; another module can bypass the safe HTTP runtime. Tests of the
  approved adapter remain green when a bypass is added elsewhere.
- **Sensor weakening:** most checks lack permanent violation fixtures. Removing a
  rule, changing its scope, or deleting important tests can reduce assurance while
  aggregate commands still pass. Writable checks do not independently attest
  their own integrity; ownership and trusted-base review are required.
- **Context and evidence drift:** ignored local IDE content can break acceptance;
  a plan can pass status checking with incidental text. Reports are not tied to a
  revision/toolchain, and documented command/CI drift has no dedicated sensor.
- **Delivery trust:** manual guide publication is not fully qualified at its SHA.
  Source/history secrets and known advisories have no configured gate. Failure
  artifacts can contain browser payloads; generic text scanning cannot certify
  screenshots or video. Capture policy and synthetic/contract-mocked fixtures
  are necessary alongside scanning.
- **Unmeasured product cost:** no performance envelope or scoped quality ratchet
  catches a slower UI or diminished test coverage. Functional green tests do not
  establish fleet-scale capacity, useful coverage, or operational observability.

## Proposed implementation sequence

Each item is one complete, independently reviewable harness PR in **M02 - Product
Foundation**. The audit is complete; the implementations below remain proposed.
The connected operator user guide remains the next agreed product slice in M04.

### PR 1 - Make harness context and verification self-validating

**Goal:** make the agent's map and acceptance evidence reliable before expanding
architectural and security controls.

**Scope:**

- Add short scoped agreements for app composition, features, shared boundaries,
  and browser/guide tooling where their responsibilities differ. Route to
  canonical guides rather than duplicating the full rules.
- Discover tracked and relevant unignored sources consistently. Exclude ignored
  IDE/generated workspaces; include new untracked source that a PR would add.
  Replace Markdown regex interpretation with a maintained parser, controlled URI
  decoding, heading checks, and canonical filesystem containment.
- Validate actual rendered guidance routes, plan metadata/required evidence
  structure, and bounded context size. A completed plan must truthfully reference
  verification or explicitly recorded material limitations.
- Introduce one small check catalog and runner for fast structural, product and
  browser groups. Preserve existing commands; emit ignored metadata-only evidence
  with SHA/dirty state, tools, commands, outcomes, and blockers. Record results on
  failures too and reject source changes during an acceptance run.
- Qualify the compiler and architecture-parser combination from a clean frozen
  install. A fixture must establish actual extracted runtime/type edges and fail
  when a mandatory rule or parser capability disappears; an empty graph cannot
  pass as architectural evidence.
- Wire canonical gate groups into CI; parse relevant workflow commands and
  permissions to detect drift. Add CODEOWNERS/PR prompts for harness policy and
  an administrator checklist for required statuses/Code Owner review.
- Commit isolated positive/negative tests for docs, design, contract provenance
  and generation, plus actual installed lint/import rules. Prove disabling or
  narrowing a rule fails its fixtures. Add a Windows Node harness lane alongside
  Linux, preserving strict artifact bytes and path/casing checks.

**Acceptance criteria:**

- Ignored .idea content cannot fail docs validation; an unignored broken source
  link, encoded escape, missing heading, junction escape and fake plan status fail
  with actionable diagnostics. Valid LF/CRLF and Markdown syntax remain accepted.
- Missing tools, failing stages and incomplete verification never become a pass;
  JSON evidence contains no credentials, browser payloads or one-time URLs.
- Changed CI wiring, missing canonical routes and a removed mandatory sensor are
  detected by checked-in fixtures. All current aggregate commands remain available.
- CODEOWNERS is not represented as proof of external branch protection. The PR
  records which administrator settings were verified and which remain unverified.

**Out of scope:** product changes, universal document style policing, blanket
artifact deletion, and claiming that a local catalog independently protects itself.

### PR 2 - Enforce browser trust boundaries and secure delivery

**Goal:** prevent ordinary frontend edits from bypassing model/transport boundaries
and require qualified, safe evidence before retention or publication.

**Scope:**

- Include type-only dependency edges and all registered production owners in the
  architecture graph. Reject product imports of E2E/test fixtures, framework/SDK
  dependencies in pure models, and model imports of demo/transport/UI code.
  Preserve Promise/AbortSignal read-port types; purity constrains execution, not
  the presence of a cancellation contract. Register package owners when they
  actually exist instead of creating empty ones.
- Detect raw transport and unmanaged execution outside explicitly owned adapters.
  Cover bare and qualified fetch, XMLHttpRequest, EventSource/WebSocket and network
  client imports, including representative aliases. Permit narrowly registered
  future map/stream adapters with an owner and rationale. Keep native login
  navigation, approved DOM work and generated code distinct.
- Use current lint/import tooling where adequate and a reviewed maintained AST
  parser where necessary. Test syntactic variants and known limits; no twenty-line
  regex claim of universal enforcement. Keep runtime behavior tests as a separate
  defense and test illegal browser requests through Playwright.
- Add pinned source/history secret scanning with redacted diagnostics, trusted
  base selection, checksummed tooling and bypass fixtures. Add dependency/advisory
  review with explicit reviewed exceptions and update automation. Minimize workflow
  permissions and checkout credential persistence; pin Actions to immutable SHAs.
- Make automatic and manual guide publication require full acceptance at the exact
  publication SHA. Preserve the existing successful-main-push/fork exclusion.
- Define capture and artifact release policy. Inspect textual trace/archive content
  before upload; default guide evidence to synthetic/contract-mocked data. Treat
  live identity recordings separately; never claim a scanner certifies pixels.
- Test generator launch, nonzero exit, malformed/missing media, ordering/mode,
  cleanup and output ownership. Reject links/junctions escaping owned output and
  empty or incorrect media, without following them during destructive operations.

**Acceptance criteria:**

- Runtime and type-only forbidden edges fail real-tool fixtures. Pure model SDK
  imports, product-to-test imports and transport bypass examples fail; approved
  adapters and native auth navigation pass. Failures name the owning policy.
- Synthetic secrets and disallowed dependencies fail; approved fixtures pass.
  Scan or prerequisite failures cannot be reported as clean reviews.
- Both publication triggers qualify their exact SHA. Failed acceptance, scanning,
  generation or evidence validation prevents publication and unsafe uploads.
- Failure tests preserve unrelated files, remove only owned partial output and
  leave the repository contract/app behavior unchanged.

**Out of scope:** changing OIDC semantics, actual live-provider qualification,
assuming all aliasing/evasion can be solved statically, and adding map/stream APIs.

### PR 3 - Gate measured browser quality and preserve recovery evidence

**Goal:** detect UI regressions in responsiveness, accessibility, critical behavior
and production output without turning noisy measurements into arbitrary policy.

**Scope:**

- Define critical behavior obligations for session/account invalidation, logout
  failure, tenant/source/cutoff changes, stale completion, cancellation, parsing
  and cursor navigation. Add scoped coverage reporting/floors only after measuring
  owned modules; exclude generated code and do not equate coverage with usefulness.
  Use focused mutation/negative cases to prove the critical assertions matter.
- Add a permanent production-output/sample-isolation and bundle-size budget with
  reviewed scope. Do not rely on historical searches or blanket string matching
  that can conflict with generated legitimate examples.
- Add rendered accessibility checks to representative production journeys, retaining
  keyboard, narrow-layout and theme assertions plus human visual review.
- Create a separate production-fixture performance lane for catalogue and registry,
  with seeded bounded data, fixed desktop/narrow viewports, fixed tool versions,
  warm-up, repeated samples and retained raw timings. Calibrate broad interaction,
  navigation and resource-growth thresholds before making them blocking. Keep
  backend/network latency and browser rendering measurements distinguishable.
- Fail unexpected page errors and establish redacted failure-category/lifecycle
  observations for cancellation and teardown. Populate a control/debt register
  with owners, review triggers and explicitly deferred performance or operational
  claims. Extend recovery fixtures whenever a failed gate reveals an escape.

**Acceptance criteria:**

- A deliberate missing session/cancellation assertion or degraded critical branch
  is detected by focused evidence; coverage deletion cannot silently improve a
  percentage by omitting an owned source file.
- Accessibility, bundle and sample-isolation violations fail representative
  fixtures. Passing token contrast alone is never declared full WCAG compliance.
- A deliberate measurable slowdown/resource leak fails the calibrated lane;
  ordinary Linux CI variation and a fixed narrow viewport remain repeatable.
  Evidence records workload, measurements, limits and revision.
- Quality and browser gates consume the new checks without hiding not-run outcomes.
  Capacity for live fleet telemetry, geodetic maps and real OIDC stays explicitly
  unqualified until corresponding contracts/deployments/workloads exist.

**Out of scope:** arbitrary global coverage percentages, timing assertions in every
functional test, k6 tests of nonexistent backend workloads, a full observability
platform, and promising future fleet capacity from small mock fixtures.

## Audit acceptance evidence

- Passed: pnpm style:check; Biome checked 257 files without applying fixes.
- Passed: git diff --check; only this audit and its active-plan index changed.
- Passed: pnpm architecture; 198 modules and 402 dependencies checked.
- Passed: pnpm view:check; four regression tests and thirteen guarded views.
- Passed: pnpm design:check; selected token contrast pairs in Light and Dark.
- Passed: pnpm contract:check; pinned provenance and regenerated output match.
- Passed: pnpm guide:test; three assembly regression tests.
- Failed: pnpm docs:check. The only reported violation is an audit document under
  Git-ignored .idea/tmp. This is the source-scope defect included in PR 1; the
  ignored document was preserved.
- Initial restricted-process runs of architecture and contract generation could
  not read installed package links. Authorized read-only reruns passed; this was
  a local process permission limitation, not an architecture/contract finding.
- Isolated CLI probes: model Solid/Effect/browser-global use, bare/qualified fetch,
  product-to-E2E fixture import, and type-only model-to-app/generated imports passed
  the current rules. Runtime model-to-app and direct presentation Effect imports
  failed their expected rules, proving the controls and fixture extraction were
  active. Disposable fixtures were removed; source was not modified.
- Not run: complete pnpm check, browser suites, guide generation/publication, live
  provider qualification, performance measurement, clean frozen-install parser
  qualification and remote protection checks.
  This is an audit, not a product acceptance or deployment-capacity claim.

## Remaining review and administration

Human review remains necessary for domain ownership, meaningful decomposition,
SOLID trade-offs, visual hierarchy, useful narration, workload realism, exception
approval and recovery semantics. Tool/secret access belongs to the execution host;
GitHub rulesets, environments and private vulnerability reporting require verified
repository administration. Each PR reports these limits rather than changing the
classification to deterministic solely because guidance or a test file exists.
