# Dependency upgrades

## TL;DR

Exact, coordinated npm patch/minor updates run the normal verification groups and
can pass without editing the historical version registry. Type, lint, behavioral,
architecture, security and installation failures still fail CI. Major tool upgrades,
Node/pnpm changes and GitHub Action major changes retain explicit review.

## Version authority

Package manifests and the frozen lockfile select executable maintenance versions.
The [baseline registry](../../tools/verification/reviewed-dependencies.json) records
reviewed major versions, action identities and historical release metadata.
The [declared-version reader](../../tools/verification/declared-dependencies.mjs)
accepts only exact, forward patch/minor updates within the same major. It never
writes the registry. The policy is the same for Dependabot and human-authored PRs;
actor names do not grant a bypass.

The following declarations must remain coordinated: root/web/E2E compiler pins;
root/web Vite; root/E2E Playwright; Vitest with its coverage provider; and the
architecture parser extension with its explicit parser dependency.
The extension targets dependency-cruiser@* so a cruiser maintenance update needs
no selector edit; its parser remains exactly pinned. This uses pnpm's standard
[package extensions](https://pnpm.io/settings/dependency-resolution#packageextensions).
Node type packages must match the execution runtime major. Missing packages, floating pins,
downgrades, malformed inventories and inconsistent installations remain failures.
The application compiler and JavaScript AST parser are separate dependencies.

## Commands and evidence

Run pnpm dependencies:review for read-only changes relative to the baseline.
Its review-required diagnostic and exit 2 identify historical version drift;
that diagnostic alone does not block an eligible maintenance update.

Run pnpm check, pnpm e2e and pnpm verify --group browser-quality to verify the
actual declared and installed versions. The existing dependencies:qualify route
also executes normal verification for eligible maintenance updates. A frozen
installation is required; no isolated registry substitution is needed for them.

Successful maintenance receipts record dependencyReview status declared with the
number of changed tool roles, zero issues, matching installed versions, stable
sources and every selected check passing. These complete original-source receipts
can qualify guide/image publication. A receipt marked review-required, an isolated
candidate receipt, missing evidence or any failed check cannot authorize publication.

Major tool proposals can still collect diagnostics through the isolated candidate
workflow. They require maintainer review and a corresponding baseline update before
original-source acceptance. Node, pnpm and action-major changes also retain review.
The candidate snapshot retains its source/index/history containment and cleanup
checks; it never supplies original-source acceptance.

## Generated client maintenance

The [generated client provenance](../../apps/web/src/generated/fleetiq-api.provenance.json)
binds the checked-in client to the exact backend specification bytes and producing
Effect generator version. A generator-only patch/minor upgrade may emit different
TypeScript without changing the application client. Check mode reports that drift
as information while proving that the committed client and specification still
match their recorded hashes. Application types and tests continue to exercise the
committed client. It does not claim that unused newly generated code is deployed.

Run pnpm contract:generate when adopting newly generated output. It updates the
client and provenance together; include both in the PR and run the normal checks.
A changed specification, edited client, stale provenance, same-version output drift
or generator major upgrade still requires regeneration. Check mode never writes
source files or silently refreshes provenance.

## Security and delivery

The checksummed secret detector, advisory policy, architecture rules, coverage,
performance limits, source integrity and artifact inspection remain enforced.
No version approval can suppress an actual finding or test failure. New publishers,
scanner checksums and security exceptions require their existing explicit review.

[Dependabot configuration](../../.github/dependabot.yml) groups related patch/minor
updates. Rebase existing dependency PRs after merging harness changes. No automatic
merge, workflow write-back, pull_request_target execution or elevated bot permission
is introduced. GitHub administrators own the required checks and reviewer settings.
