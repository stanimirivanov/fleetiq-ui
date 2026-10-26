# Testing and executable user guides

## TL;DR

`pnpm check` verifies types, architecture, view size, styling, documentation,
pure rules, Solid component behavior, and a production build. `pnpm e2e`
runs production-preview and development-server Playwright suites. The third gate,
`pnpm verify --group browser-quality`, measures the rendered production app.
All three gates are required in CI. Selected production journeys can generate a user guide;
ordinary e2e scenarios do not.

## Test ownership

- Pure TypeScript rules use Node's test runner under `apps/web/tests`.
- Rendered Solid interactions use Vitest, jsdom, and Solid Testing Library in
  `*.test.tsx`. Exercise accessible names, actions, and reactive updates
  rather than duplicating static markup assertions.
- Browser journeys use `apps/web-e2e/e2e` for production behavior and
  `apps/web-e2e/e2e-dev` for development-only sample overview, catalogue,
  map, inspector signal playback, registry, and alert triage.
  Page objects in `apps/web-e2e/pages` own semantic locators and cohesive
  actions. Scenarios own policy assertions, route expectations, and narrative
  sequence. Prefer roles, labels, and retrying assertions over implementation
  selectors and arbitrary waits.

Run `pnpm view:check`, `pnpm test:unit`, `pnpm test:component`, or `pnpm e2e`
from the repository root. `pnpm e2e` runs `e2e:production` then
`e2e:development`: the first builds and serves the production Vite preview
on 127.0.0.1:4173, while the second serves the development app on
127.0.0.1:5173. Production scenarios prove that the overview and
`/assets?preview=sample` cannot activate sample mode; session failures remain explicit; development scenarios exercise
the disclosed overview, URL-backed discovery, map/inspector selection, registry
cutoffs and attribution, alert filters/selection/evidence and URL recovery,
narrow layout, catalogue cursor traversal, browser history,
invalid-cursor recovery, signal-stream lifecycle, and production
sample isolation.
Each Playwright config refuses to reuse an existing server, so a busy port
does not silently test an unrelated process. Set `FLEETIQ_E2E_PREVIEW_PORT`
and/or `FLEETIQ_E2E_DEV_PORT` to free ports when needed. CI uses 4173 and
5173. Install Chromium once with `pnpm exec playwright install chromium`.
`pnpm check` does not run a browser; the separate CI browser job runs both
suites and retains failure traces and screenshots. Run both commands before
handing off a browser change.

## Guide-producing scenarios

A guide is a coherent operator journey, not a screenshot for each control.
Tag a scenario `@user-guide` only when it has enough verified steps to teach
a real task. The same scenario runs assertion-first in ordinary E2E mode.
An optional narrator on page objects adds step prose, annotations,
screenshots, and a Playwright video only in guide mode. An untagged scenario
is only an E2E test. Guide prose is maintained with the scenario and page
object actions.

Install the checksummed detector with `pnpm security:install`, run `pnpm check`,
`pnpm e2e` and `pnpm verify --group browser-quality` against unchanged sources,
then run `pnpm guide:generate` to build the app, execute only tagged scenarios,
and assemble `dist/user-guide` as Markdown and a static HTML book. Run
`pnpm guide:preview` to inspect it locally. The generator rejects missing
or failed guide scenarios and discards partial output. Generated media is
ignored by Git; source scenarios and their prose are reviewed with code.
The User guide workflow runs after the Web quality gate succeeds for a push
to main, or through a main-branch manual run. It publishes the generated
book to GitHub Pages. Repository administrators must select GitHub Actions
as the Pages source before first deployment.

The guide has eleven browser-verified parts. The production orientation teaches
shell navigation, unavailable sign-in and operational states, status vocabulary, and appearance.
Five connected-contract chapters teach operator sessions, asset discovery and
pinned definitions, temporal relationships/source mappings, and recovery/accessibility.
They use the production HTTP adapter with synthetic contract-valid responses, not
a deployed provider or customer records. The sign-in fixture demonstrates only the
fixed return to the saved FleetIQ route; provider credentials and callback codes
are never recorded.

Five separately labelled development-sample chapters teach overview and bounded
asset discovery, the schematic map, asset inspector and finite signal playback,
registry relationship and signal mapping at effective/known times, and alert
triage with quality and freshness evidence. The generator runs tagged journeys
from both production and development suites and publishes only after every
chapter succeeds. Sample walkthroughs are interaction examples, not production
operator procedures: their sample data is not a connected live position, telemetry
stream, or alert lifecycle. Inspector and registry samples also show planned signal
playback, topology and inventory beyond the connected metadata contract. Retain
these separate chapters until browser-proven connected outcomes replace that scope.
Do not record secrets or one-time links.

## Connected contract journeys

Production scenarios use test-only HTTP interception in `apps/web-e2e/fixtures`.
Successful responses derive from the pinned backend examples and are validated
against generated Effect schemas before serving. These fixtures are never imported
by product code. Default legacy shell scenarios explicitly intercept session 404;
no Vite SPA fallback can masquerade as a successful session.

POM journeys cover account/session/logout, bounded tenant discovery and exact-grant selection,
revoked/empty access, tenant cursor history and recovery, catalogue pagination and local filters,
inspector external IDs and exact definitions, temporal relationship/target/source
pages, URL reload/history, invalid context blocking, 403 denial, 404 absence,
malformed and cross-scope data, safe precision, retry, and narrow dark layout.
Transport tests additionally prove same-origin-only cookies, no bearer/custom Origin,
status categorization before error-body parsing, body/operation bounds, interruption,
and runtime disposal. Solid tests prove stale response suppression and protected
content removal; assertions must not be replaced with arbitrary timing waits.

Five connected journeys carry the @user-guide tag and run both as ordinary
assertion-first tests and narrated recordings. The assembler rejects missing or
misclassified connected chapters. Guide-owned pages enforce their own page-error
counter because they use fresh contexts outside the ordinary fixture page.
The complete eleven-chapter guide must generate.
Contract interception is not deployment qualification: run a separate backend-backed
journey to qualify the chosen provider, HTTPS proxy, session cookie, and permission
configuration. Do not record provider tokens, credentials, or one-time callback URLs.

Component tests retain per-file isolation and use at most two workers. This bounds
concurrent jsdom/Effect environments on local machines and CI without extending
interaction deadlines or relaxing assertions.

Guide release also requires exact source/evidence/output hashes and inspection. Both publication triggers rerun all gates at the selected SHA and use `pnpm guide:release --require-clean` for release. Follow [trust and delivery](security-delivery.md) for synthetic capture, inspected retention and recovery.

## Measured quality and mandatory browser fixture

Run pnpm verify --group browser-quality after the functional browser group. The separate built-preview lane records bounded workloads, repeated samples, rendered accessibility and resource growth; it does not qualify backend/network capacity. Scenarios import fixtures/production-test or fixtures/browser-quality-test so unexpected page errors cannot be silently discarded. Direct SDK test imports are lint violations. Follow [measured quality](measured-browser-quality.md) and the [control register](harness-controls.md). Guide release requires acceptance, browser and browser-quality evidence at unchanged sources.

The connected device chapter commissions an asset and endpoints, checks an exact
stored package, assigns a revision-checked route, reviews sampled processing/source
evidence and retires the route. Its responses are synthetic contract fixtures;
D06, real provider/browser acceptance and hardware qualification remain separate.
Device regressions additionally cover ambiguous exact retries, conflicts, independent
grants, invalid URL context, unsafe evidence, disposal and late completions.
