# Frontend structure and review

## TL;DR

Pages compose routes and layout. Feature components render one concern; services
own workflows and adapters own external data. Solid reactive reads stay inside
tracked scopes. Biome, dependency-cruiser, and `pnpm view:check` enforce narrow
structural rules; reviewers assess composition, copy, state ownership, and layout.

## Component boundaries

- A page is a route boundary and layout orchestrator. Move distinct header,
  navigation, error, list, and pagination regions into named components.
- `pnpm view:check` limits hand-written `*Page.tsx`, `*Pages.tsx`, `*View.tsx`,
  and `AppShell.tsx` to 150 nonblank, noncomment production lines. A shorter
  page can still be a monolith. A genuinely cohesive exception needs a
  `// view-size-exception: <specific rationale>` comment in its first 20 lines;
  the rationale must have at least 40 characters and is reviewed in the PR.
- Keep local interaction state with the child that owns the interaction.
  Route, shareable filter, and selection state belong in the URL.
- Reuse visual primitives only when multiple callers share behavior and
  semantics. Keep asset-specific cards, fields, and copy inside the asset
  feature. Avoid turning every small JSX fragment into a component.
- Pass state-specific copy to reusable views. Development sample language
  belongs in the development wrapper, not a live-ready catalogue view.

## Import boundaries

- Use `#shared/ui` for presentation, `#shared/model` for safe product-neutral
  values, and `#shared/api` for the managed transport seam from app or feature
  code. Add explicit named exports to `shared/ui/index.ts`; do not reach into
  component files from outside that directory.
- App composition imports a feature through `#features/<name>` when that
  feature has a public entry. Export only the route or capability contract the
  app needs. Register each new public feature in `apps/web/package.json`;
  keep model, API, and UI files private by default.
- Use direct relative imports between files owned by the same module. Avoid
  importing an owner's own barrel, which can create cycles and obscure the
  dependency graph. Add a barrel when a real cross-boundary consumer exists,
  not for every directory.
- The package import map shortens paths and names public entries; it does
  not replace dependency direction. `pnpm architecture` checks resolved files
  and rejects unresolved `#` imports.

## Solid and Effect

- Read reactive props through `props.name` in tracked JSX or a memo. Do not
  destructure props or store values in a component body. Biome's Solid rules
  flag destructured props and array `.map()` used to render JSX.
- Use `createMemo` for derived values and `createEffect` for side effects
  such as document title, storage, or subscriptions. Pair listeners, timers,
  and in-flight work with `onCleanup` or a scoped equivalent.
- Create signals, memos, and effects under a stable owner, not conditionally
  or inside event handlers. Prefer `<Show>`, `<Switch>`, and `<For>` for
  conditional and repeated UI.
- Presentation TSX cannot import `effect` or `effect/*`. Effect programs,
  runtime execution, retries, and interruption live in named services or
  adapters. If Atom-backed shared state becomes useful, install its Solid
  binding with the first real use and document the lifetime owner.
- Feature models cannot import generated schemas or shared transport. Shared
  models cannot import HTTP runtime or generated wire code. The app composes
  independent identity/metadata capabilities and injects invalidation callbacks.
- Abort superseded and unmounted reads; clear old scope evidence immediately and
  ignore late completions even when an adapter does not honor cancellation.
  Changing tenant, asset/source, or cutoffs resets its dependent cursor scopes.
- Preserve typed failure categories across the adapter boundary. Render
  meaningful unauthorized, forbidden, invalid-request, unavailable, and
  contract-error states where the workflow can produce them. Log only
  redacted diagnostics; never expose untrusted payloads or secrets in UI.

## Styling and accessibility

- Parent layout owns external width, margins, and grid placement. A child
  owns its internal spacing. Review `mt-*`, `max-w-*`, `absolute`, and fixed
  widths at reusable component roots before accepting them.
- Extract repeated control/link styles into semantic primitives or a small
  variant mapper. Long utility strings are a review signal, not an automatic
  15-class failure; class count alone cannot tell whether abstraction helps.
- Keep a named main landmark, unique IDs, semantic controls, visible focus,
  and a coherent mobile layout. Test navigation and fallback states through
  user-visible behavior.

## Review checklist

1. Does each page mainly compose named sections, with no duplicated JSX or
   low-level state leaked upward?
2. Are model rules and Effect workflows outside JSX and transport generated
   types outside presentation?
3. Are reactive reads tracked, derivations pure, and resources disposed?
4. Do typed failures reach distinct user states without leaking payloads?
5. Does the parent own placement and do shared primitives have a real second
   use?
6. Do focused component and browser tests prove the affected behavior?

See the [Solid props guide](https://docs.solidjs.com/concepts/components/props),
[Solid cleanup reference](https://docs.solidjs.com/reference/lifecycle/on-cleanup),
[Effect v4 runtime guide](https://effect.website/docs/v4/runtime), and
[Biome Solid rules](https://biomejs.dev/linter/domains/) for the underlying
framework behavior.

Protected component ownership is keyed by the authenticated actor ID. A focus
refresh that discovers a different account disposes the previous account's reads
and metadata before mounting the new account's views; same-actor expiry refresh
preserves ordinary interaction. Native sign-in anchors opt out of Solid Router
with `rel="external noreferrer"` so the server receives the login request.

## Geographic renderer boundary

Import MapLibre only in `features/assets/api/maplibre-adapter.ts`. That exact
adapter owns SDK resource requests, the bounded public style read, local module
worker and cleanup. Models remain dependency-free; views consume the lifecycle
port. Keep geodetic coordinate validation and resource/style restrictions pure.
New renderer sources/protocols require URL, lifecycle, byte and browser fixtures;
never add SDK imports or transport calls to a component to bypass the boundary.
