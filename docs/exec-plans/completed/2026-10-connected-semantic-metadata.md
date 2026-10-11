# Connect browser-safe semantic metadata

## TL;DR

Status: completed
Milestone: M04 - Semantic Twin and Live UI

Pin the merged
browser identity and semantic metadata contract and connect the catalogue,
inspector, and registry as one complete web slice. Preserve explicit development
previews; production never falls back to synthetic evidence.

## Goal

Operators can sign in, select a tenant, traverse bounded asset pages, and inspect
exact identity, definitions, directed relationships, and signal bindings.

## Scope

- Same-origin OIDC session inspection, sign-in navigation, expiry, and logout.
- One managed Effect v4 HTTP runtime and interruptible validated read ports.
- URL-owned tenant, filters, selection, explicit temporal cutoffs, and cursors.
- Connected catalogue, identity inspector, and read-only semantic registry.
- Production browser journeys using contract-valid test-only HTTP responses;
  existing development walkthroughs and sample isolation remain enforced.
- Contract provenance, architectural rules, operations, and current-state docs.

## Decisions

- Pin backend main commit `6015e46db42a078fce98241db5e6082e329a8e15`.
- Use the published standalone bundle without editing its bytes.
- Keep provider tokens and workload credentials out of browser code.
- Tenant selection is explicit: no tenant enumeration contract exists.
- Search/type filters apply only to the loaded catalogue page.
- Relationship and binding pages do not establish a complete graph or a
  cross-request database snapshot. Revisions remain decimal strings.
- Keep model, HTTP adapters, reactive controllers, and presentation separate.
- Defer complete connected guide chapters to the next agreed guide PR.

## Acceptance criteria

- [x] Successful session, signed-out, unavailable, expiry, and logout states.
- [x] Strict schema, tenant, reference, cursor, and safe-integer validation.
- [x] Cancellation and stale-response suppression on route/context changes.
- [x] Catalogue, inspector, and registry URL/history/reload journeys.
- [x] Distinct empty, forbidden, missing-resource, and malformed-data states.
- [x] Responsive approved visual language and production sample isolation.
- [x] `pnpm check`, `pnpm e2e`, and existing guide generation pass.

## Out of scope

Live property values, telemetry streams, observed locations, alert lifecycle,
identity administration, whole-graph queries, native mobile, and deployed-provider
or TLS qualification. Test interception proves UI contract integration, not
production OIDC interoperability.

## Evidence

- `pnpm check` passed: style, both TypeScript projects, dependency boundaries,
  view-size policy, documentation links, contrast, pinned contract reproduction,
  pure/component/adapter tests, guide assembly tests, and production build.
- Vitest: 170 tests in 28 files. Pure Node rules: 3 tests.
- Production Playwright: 32 tests passed; development Playwright: 24 passed.
  Both used isolated configured ports and two workers. Two additional focused
  production isolation journeys passed against the freshly rebuilt guide app,
  including the absence of the development preview entry point.
- `pnpm guide:generate` passed: one production orientation and five development
  walkthroughs assembled into six verified Markdown/HTML chapters.
- Reviewed rendered catalogue, inspector, and registry at desktop width and the
  registry at narrow width with the dark theme. Compact catalogue selection
  actions preserve readable identity columns.
- The vendored bundle matches the pinned backend SHA-256 exactly; generated
  client reproduction and the 13 expected operations pass the contract gate.
- Production JavaScript excludes the checked synthetic asset/decoder payload
  markers. Development preview entry remains an explicit local navigation choice.
- No failing checks remain. Deployed-provider, HTTPS proxy, cookie, and backend
  permission qualification were not run and remain separate deployment work.

## Handoff

Repository: `fleetiq-ux`. Branch: `feature/connected-semantic-metadata`.
The next agreed PR is the complete connected operator guide described in
[the execution roadmap](../../PLANS.md). This slice retains existing guide
chapters and adds connected E2E assertions without claiming connected narration
is complete.
