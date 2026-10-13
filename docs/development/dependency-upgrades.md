# Dependency upgrade review

## TL;DR

Run pnpm dependencies:review after rebasing a dependency PR. Qualify coordinated
npm-tool candidates before deciding whether to approve them. Candidate runs use
the unchanged checks in an isolated workspace; they never approve the original
registry. The required check job collects candidate acceptance evidence but stays
blocked until maintainer review is recorded. Action, Node and pnpm changes need
review before candidate qualification.

## Sources of truth

[The reviewed registry](../../tools/verification/reviewed-dependencies.json)
owns the accepted Node major, pnpm version, critical harness tool versions and
official action release commits. Manifest and workflow declarations are candidate
inputs, rather than sources of approval. Compiler and AST parser are independent
decisions. Parser, coverage and workflow consumers derive their expectations from
this registry; there is no second executable version list to synchronize.

Runtime product dependencies remain manifest-owned and require the normal owner,
security and behavior review. The separate [detector pin registry](../../tools/security/pins.mjs)
still owns the scanner release and official archive hashes. Upgrade qualification
cannot authorize a scanner checksum, vulnerability exception or new action publisher.

## Review command

pnpm dependencies:review prints registered roles, approved and proposed exact
pins, affected declarations and qualification commands. For structured inspection,
use pnpm dependencies:review --json.

| Result | Exit | Meaning |
| --- | ---: | --- |
| current | 0 | Candidate declarations match approved pins and each other |
| review-required | 2 | Coordinated exact changes await maintainer review |
| blocked | 1 | Missing, malformed, mutable or inconsistent declarations need repair |

A current report is an inventory verdict, not compatibility evidence or acceptance.
The reader rejects linked source inputs, oversized files, malformed YAML and
unknown roles. It prints only bounded known identifiers and safe pin values.
Raw source, arbitrary error payloads and credentials are never included.

Declarations must stay coordinated: root/web/E2E compiler pins; root/web Vite;
root/E2E Playwright; Vitest and coverage provider; and dependency-cruiser's exact
workspace parser extension. Root/E2E @types/node must share an exact version whose
major matches the declared execution runtime. A declaration package for a newer
runtime can admit unavailable APIs even when the current code compiles. Same-major
maintenance updates do not need a separate reviewed tool-registry entry.

## Qualify a proposal before approval

For eligible coordinated npm-tool changes, use:

- pnpm dependencies:qualify --group product for types, component/unit tests and build.
- pnpm dependencies:qualify --group structural for portable harness qualification.
- pnpm dependencies:qualify --group browser for production/development scenarios.
- pnpm dependencies:qualify --group browser-quality for the measured rendering envelope.
- pnpm check for the complete acceptance suite, including candidate evidence when review is pending.

The [candidate workspace owner](../../tools/verification/candidate-workspace.mjs)
creates a disposable snapshot with independent Git objects, full history and refs,
the original staged index, and the raw tracked/new working files. It verifies the
copied identity before substituting only eligible exact npm-tool pins into that
snapshot's private registry. The original reviewed registry and checkout remain
unchanged.

Git's displayed top-level path may use a Windows DOS 8.3 alias, including the
runner temporary directory. Repository identity requires native canonical paths
and matching directory device/file IDs after rejecting linked ancestors. Display
spelling, slash style or letter case alone never establishes ownership. Shallow,
borrowed, promisor, hidden-index and altered-source controls remain enforced.

The [qualification runner](../../tools/verification/candidate.mjs) performs a fresh
frozen install, checksummed scanner installation, harness policy verification, the
selected unchanged group, and artifact inspection. Installed package metadata,
private parser resolution and actual violation probes remain enforced. Source,
index, ref or policy drift, incomplete commands, missing prerequisites, malformed
evidence or failed cleanup invalidate qualification. Temporary output is owned and
removed after collecting bounded evidence.

Eligibility covers the registered compiler, AST parser, dependency-cruiser, Vite,
Axe, archive parser, Vitest and Playwright roles. Any pending action, Node-major or
pnpm change needs upstream/runtime review first; it cannot be silently substituted
by npm candidate qualification. Malformed or inconsistent inventory is always
blocked. Product dependency updates with no critical pin drift use normal
verification.

## Review and record the upgrade

1. Rebase the dependency PR and run pnpm dependencies:review. Repair inconsistent
   declarations, runtime types or lockfile entries before qualification.
2. Review changelogs, advisories and relevant APIs. For actions, verify the official
   release tag resolves to the proposed immutable commit and inspect action.yml,
   runtime, inputs and permissions. Workflow comments do not establish provenance.
3. Gather the candidate group results and investigate actual regressions. Review
   parser extraction, detector behavior, generated contract bytes and measured
   browser changes wherever the proposal affects them.
4. Edit only the corresponding original reviewed registry entries as a reviewable
   maintainer decision. Keep the independently reviewed parser when upgrading the
   application compiler. Record upstream provenance and qualification rationale in
   the PR or execution plan. Code Owner approval must be required externally.
5. Run pnpm install --frozen-lockfile and pnpm security:install, then pnpm check,
   pnpm e2e and pnpm verify --group browser-quality against the final original
   sources. Inspect output with pnpm security:artifacts. Commit the registry,
   declarations and lock changes together and rerun CI.

A frozen install failure requires correcting the committed lock and declarations.
A changed output format, broken cancellation, retained browser resources or
unsupported parser API is a regression to fix. Limits, assertions and security
policies are not relaxed to approve a version bump.

## CI results and evidence

The required check job runs pnpm check. For eligible pending proposals it gathers
candidate acceptance results and exits nonzero because original-source review is
still pending. The browser, browser-quality and harness-windows jobs use explicit
candidate qualification commands: successful qualification can make those jobs
green while check remains blocked. Once the declarations are reviewed, the same
commands perform ordinary original-source group verification.

Candidate receipts use kind: dependency-candidate, qualificationPass and
completePass: false. Their candidate-prefixed filenames, original source identity,
isolated candidate identity, proposed tool changes and stage outcomes distinguish
testing evidence from acceptance. A passing candidate cannot qualify user-guide
generation or publication, including if its receipt is renamed.

Ordinary receipts require current dependencyReview and installedTools status with
zero issues, unchanged source snapshots and every selected check passing.
Missing, ambient, stale or mismatched installations cannot qualify the group.
The installed-tool check runs again after execution; use a frozen install for
reviewed-tools-unavailable or reviewed-tools-changed. Registry loading failures
produce bounded nonzero setup failure without fallback approval.

The isolated source, index, refs and repository policy are captured immediately
after the single private registry substitution. Recheck that prepared baseline
after every stage and artifact inspection; install-time changes cannot become
a new test baseline. The original checkout is checked independently.

## Dependabot boundaries

[The configuration](../../.github/dependabot.yml) groups related minor/patch
analysis, component testing, browser testing and Effect updates before the general
development group. Major upgrades and action updates remain separate proposals.
No proposal is hidden with ignore rules. GitHub documents the
[grouping options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).

There is no bot-specific bypass, automatic approval, merge, workflow write-back or
pull_request_target path. Existing read-only quality permissions, immutable
action references, exact publication SHA, fork restrictions and scanned artifact
uploads remain enforced. External GitHub rules must require check and the other
three quality jobs, along with owner review; a local sensor cannot establish those
administrative settings.
