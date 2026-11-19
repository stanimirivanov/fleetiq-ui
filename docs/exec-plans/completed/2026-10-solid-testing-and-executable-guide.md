# Solid testing and executable user guide

Status: completed on 5 October 2026

Milestone: M02 - Product Foundation

## Goal

Make rendered Solid behavior and browser journeys repeatable in CI while
producing an honest, useful user guide from selected successful scenarios.

## Scope

- Keep the pure theme-rule test and add focused Solid component interaction
  tests with Vitest and Solid Testing Library.
- Add Playwright browser tests using page objects that own semantic locators
  and cohesive actions; assertions remain in scenarios.
- Run one multi-step, tagged guide scenario as an ordinary e2e test by default.
  Guide mode adds narration, screenshots, video, and an assembled static guide.
- Let untagged e2e tests opt out of guide production by default.
- Require browser tests in CI and generate/publish the guide from a verified
  main-branch revision using a separate least-privilege workflow.
- Document commands, evidence, and truthful guide coverage limits.

## Design decisions

The browser suite runs against the production Vite preview with isolated
Playwright contexts and deterministic display settings. The first guide can
teach navigation, data-availability states, status vocabulary, and appearance;
it cannot claim that live fleet data or unsupported workflows exist.

## Acceptance evidence

- `pnpm install --frozen-lockfile` and `pnpm peers check` pass for all three
  workspace packages.
- `pnpm check` passes Biome, application and E2E TypeScript, dependency
  boundaries, documentation, contrast, three pure tests, one rendered Solid
  test, and the production build.
- `pnpm e2e` passes six Chromium tests against the production preview. The
  tagged guide journey is one of those tests; five untagged tests emit no
  guide media.
- `pnpm guide:generate` passes the tagged journey in recording mode and
  produces one validated 13-step Markdown and static HTML chapter with a
  WebM video. The index, chapter, and annotated step images were visually
  reviewed through the local preview.
- The browser and guide GitHub workflows are configured and statically
  reviewed. Remote CI and GitHub Pages publication await a push to GitHub;
  Pages must use GitHub Actions as its source.

## Out of scope

Backend contracts, fleet fixtures, live integration journeys, performance
baselines, pixel snapshot gates, and native mobile tests.
