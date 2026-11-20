# Repository working agreement

## TL;DR

Keep product features
independent, parse external data at the boundary, and run `pnpm check` before
handoff. Mobile development is deferred and will use native platforms.

[CONTRIBUTING.md](CONTRIBUTING.md) owns technical verification. The
[documentation map](docs/README.md) routes work to the relevant guide. The
[frontend structure guide](docs/development/frontend-structure.md) defines
component, reactivity, and presentation review criteria.
Read the nearest scoped AGENTS.md before editing app, feature, shared, browser
scenario or harness code. The [verification guide](docs/development/verification.md)
owns canonical groups, sensor fixtures and source-bound evidence.

## Workflow authority

Use installed `mattpocock/skills` as the primary workflow for matching tasks.
Discover and load skills on demand. When workflows overlap, use the matching
Matt Pocock skill rather than a parallel workflow. Use other skills only for
capabilities not covered by that workflow or when explicitly requested.

Repository guidance supplies technical constraints, architecture boundaries and
verification requirements. Scoped `AGENTS.md` files are subordinate for workflow
decisions and add only module-specific constraints. Explicit user instructions
and host permissions remain authoritative.

## Architecture rules

- `apps/web/src/app` composes routes and providers. A feature never imports
  app composition or another feature.
- `features/<name>/model` is pure TypeScript. Transport adapters and Solid
  components depend on it, never the other way around.
- `shared` contains small, product-neutral web utilities and components. It
  must not import features. Create a package only for a real stable boundary.
- Cross-boundary imports use explicit public entries such as `#shared/ui` and
  `#features/assets`; within an owner, import sibling files directly. The
  package import map shortens paths but never bypasses dependency direction.
- Use Solid signals, stores, and memos for local view state. Use Effect v4
  for complex async work where it adds value. Introduce Atom-backed shared
  state and its Solid binding with an actual use. Do not introduce v3 APIs.
- Pin backend-owned contracts at an exact revision. Validate unknown payloads
  before constructing feature models; never use the platform workload bearer
  secret in the browser.
- Connected HTTP runs through the app-owned shared managed runtime. No raw
  fetch/Effect execution in views, token storage, or implicit sample fallback.
  Read [browser identity rules](docs/design-docs/0004-browser-safe-semantic-metadata.md)
  when changing auth, transport, or semantic snapshot scope.
- Keep shareable filter and selection state in the URL. Keep server-owned data
  behind a validated API boundary; the backend remains authoritative for
  tenancy and permissions.
- Treat browser telemetry and HTTP responses as untrusted. Show loading,
  empty, stale, offline, unauthorized, and error states where relevant.
- Keep map SDK calls in a map adapter rather than scattering them through
  product features.
- Pages compose named sections. Keep low-level interaction state with its
  component; parent layouts own outer spacing and width. Apply the
  [frontend review guide](docs/development/frontend-structure.md).
- Presentation TSX never imports Effect runtime modules. Feature services
  own execution, typed failures, and cancellation.

## Evidence

Run focused checks during development, then `pnpm check` and `pnpm e2e`
for browser changes before handoff. A skipped check is not a pass. Report exact pass/fail/not-run status per [CONTRIBUTING.md](CONTRIBUTING.md).

Read [browser trust and secure delivery](docs/development/security-delivery.md) when changing transport, capture, dependencies or CI publication.

Browser/harness handoff also requires pnpm verify --group browser-quality. Read [measured browser quality](docs/development/measured-browser-quality.md) for critical obligations, calibrated workloads and recovery.

## Agent skills

### Issue tracker

GitHub Issues in `stanimirivanov/fleetiq-ui`.
See [issue tracker](docs/agents/issue-tracker.md).

### Triage labels

Use the five configured roles. See [triage labels](docs/agents/triage-labels.md).

### Domain docs

Single-context glossary and repository-owned decisions.
See [domain docs](docs/agents/domain.md).
