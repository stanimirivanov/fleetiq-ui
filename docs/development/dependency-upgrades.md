# Dependency upgrade review

## TL;DR

Run pnpm dependencies:review after rebasing a dependency PR. Exact coordinated
changes require owner review; inconsistent or malformed changes require repair.
Update the one reviewed registry only after that review, install the frozen lock,
and run the existing complete gates. The command never changes files or approves
a proposal.

## Sources of truth

[The reviewed registry](../../tools/verification/reviewed-dependencies.json)
owns the accepted Node major, pnpm version, critical harness tool versions and
official action release commits. Manifest and workflow declarations are candidate
inputs, rather than sources of approval. Compiler and AST parser are independent
decisions. Parser, coverage and workflow consumers derive their expectations from
this registry; there is no second executable version list to synchronize.

Runtime product dependencies remain manifest-owned and require the normal owner,
security and behavior review. The separate [detector pin registry](../../tools/security/pins.mjs)
still owns the scanner release and official archive hashes. This upgrade command
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

## Prepare a reviewable upgrade

1. Rebase the dependency PR and run the review command. Resolve paired declarations:
   root/web/E2E compiler pins, root/web Vite, root/E2E Playwright, Vitest and coverage
   provider, and dependency-cruiser's exact workspace parser extension.
2. Review changelogs, advisories and the relevant API or detector behavior. For
   actions, verify the official release tag resolves to the proposed immutable
   commit and inspect action.yml, runtime, inputs and permissions. Workflow
   comments are not proof of publisher identity.
3. Edit only the corresponding reviewed registry entries as a reviewable proposal.
   Retain the independently approved parser when upgrading the application compiler.
   Record the release/source rationale in the PR or its execution plan. Code Owner
   approval must be required externally in GitHub.
4. Run pnpm install --frozen-lockfile and pnpm security:install, then pnpm check,
   pnpm e2e and pnpm verify --group browser-quality. Inspect output with
   pnpm security:artifacts. Frozen install failures require correcting the committed
   lock and declarations; do not bypass them.
5. Commit the reviewed inventory with the declarations and lock changes; rerun CI.
   Guide publication additionally requires freshly qualified source-bound receipts
   and the existing clean release workflow.

## Early failure and qualification

Every canonical verification group checks candidate inventory before launching
tools or tests. Pending review is reported as dependency-review-required;
inconsistent inputs as dependency-inventory-invalid. This prevents the same
unreviewed pin from producing many unrelated fixture assertion failures.

After declaration review, metadata-only resolution verifies the exact installed
tools in each owner and the parser dependency-cruiser actually resolves.
Missing, ambient, stale or mismatched installations cannot qualify the group.
The installed-tool check runs again after execution. Use the frozen install when
verification reports reviewed-tools-unavailable or reviewed-tools-changed.

Receipts retain only review/install status and issue counts alongside the existing
source digest and check outcomes. Publication rejects legacy or incomplete receipts.
A registry that cannot be loaded produces a nonzero bounded setup failure, never
a fallback approval or a complete receipt.

Real CLI violation probes, coverage assertions, dependency audits, artifact
inspection and measured browser negative controls remain mandatory. A changed
output format, broken cancellation, retained browser resources or unsupported
parser API is a regression to fix; it is not an instruction to raise limits.

## Dependabot boundaries

[The configuration](../../.github/dependabot.yml) groups related minor/patch
analysis, component testing, browser testing and Effect updates before the general
development group. Major upgrades and action updates remain separate proposals.
No proposal is hidden with ignore rules. GitHub documents the
[grouping options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).

There is no bot-specific bypass, automatic approval, merge, workflow write-back or
pull_request_target path. Existing read-only quality permissions, immutable
action references, exact publication SHA, fork restrictions and scanned artifact
uploads remain enforced.
