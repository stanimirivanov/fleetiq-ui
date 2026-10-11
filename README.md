# FleetIQ UX

## TL;DR

FleetIQ's SolidJS operator console connects asset identities, pinned definitions,
directed relationships, and signal bindings through same-origin operator sessions.
It retains the approved persistent shell and Light/Dark/System theme. Local
sample workspaces cover overview, map, inspector, registry, and Alerts while
location, telemetry, and alert contracts are developed.

## Start

Use Node.js 24 or newer and pnpm 12.5.1.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Vite development opens a labelled sample overview. The sidebar follows that
sample workspace; **Connected metadata** opens the actual sign-in/tenant flow.
There is no separate mock server to start. Direct preview URLs are:

- `/map?preview=sample` — schematic site canvas and paired asset list.
- `/assets?preview=sample` — bounded, contract-shaped catalogue.
- `/assets/:assetId?preview=sample` — sample inspector and finite signal playback.
- `/assets/registry/review?preview=sample` — relationship and mapping review.
- `/alerts?preview=sample` — synthetic queue, evidence, and timeline.
- `/design-system` — synthetic light/dark design specimen.

A production build never activates these sample previews or includes their
fixture payloads. The ordinary overview, map, and Alerts routes show their
unavailable data state until the corresponding backend contracts exist.

## Connect metadata

Serve the built UI and `/api/v1` backend under **one public HTTPS origin**, with
browser OIDC configured on the platform. Open `/assets`, choose **Sign in**, and
enter an authorized tenant ID. The application has no tenant-list endpoint or
client-side permission authority. A session-service 404 shows **Sign-in unavailable**.
The contract and deployment expectations are in the
[HTTP contract guide](contracts/http/README.md).

For development, use an explicitly configured local reverse proxy to route Vite
and `/api/v1` under one origin. A standalone Vite server has no backend or OIDC
provider; ordinary metadata routes show the unavailable state. No default proxy,
provider, workload secret, or pretend authenticated session is shipped.

Connected catalogue, inspector, and registry links preserve tenant and explicit
review cutoffs in the URL. Search/type filters affect only the current catalogue
page. Snapshot pages do not claim a complete graph, live readings, or historical
asset identity. The theme button cycles Light → Dark → System and remembers the
preference when browser storage is available.

## Verify

Install the pinned scanner with `pnpm security:install`, then run `pnpm check` for types, architecture, contracts, Solid tests, and the production
build. Install Chromium once with `pnpm exec playwright install chromium`, then
run `pnpm e2e` for production and development browser suites. Connected browser
scenarios intercept HTTP with contract-valid test-only responses; deployment
qualification against an actual OIDC provider remains separate.

After current `pnpm check` and `pnpm e2e` pass, `pnpm guide:generate` records six existing chapters: production shell
orientation and five labelled development walkthroughs. It creates an ignored
static guide under `dist/user-guide`. The next guide slice will add connected
operator procedures. See the [testing guide](docs/development/testing.md).

## Documentation

Start with [AGENTS.md](AGENTS.md) and [docs/README.md](docs/README.md).
[ARCHITECTURE.md](ARCHITECTURE.md) explains dependency and lifetime ownership;
[docs/PLANS.md](docs/PLANS.md) tracks reviewable work.
