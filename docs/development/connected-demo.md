# Connected UI development behind the demo edge

## TL;DR

SIM-PR19 adds an explicit Vite development transport contract. The edge owns
HTTPS, API/session/SSE routing and cookies; Vite serves only development assets
and the HMR upgrade. Production builds, preview and test mode ignore this option.
Installed composition and browser reload qualification remain SIM-PR20.

## Start the development server

```sh
FLEETIQ_CONNECTED_ORIGIN=https://fleet.fleetiq.test:58443 pnpm dev --host 127.0.0.1 --port 5173 --strictPort
```

The origin accepts the exact demo hostname over HTTPS, or HTTPS loopback names.
Plain HTTP is accepted only for literal loopback/localhost development fixtures.
Credentials, paths, query/hash, wildcard and arbitrary public destinations fail
with a fixed diagnostic. The variable has no `VITE_` prefix and carries no backend
address, token or provider secret. Leaving it unset preserves ordinary development
and its explicitly selected sample walkthroughs. It never enables sample fallback.

For private container composition, the deployment overlay may explicitly choose
`--host 0.0.0.0`; keep Vite on that private network without a host port. Do not use
`allowedHosts: true`, wildcard CORS or expose a Vite server to a public network.

## Edge routing contract

| Request | Owner |
| --- | --- |
| `/api` and `/api/*`, including auth/session/logout and event streams | Normal backend proxy; preserve Host, Origin, Cookie, Set-Cookie and streaming |
| `/__fleetiq_hmr` WebSocket upgrade | Vite; preserve upgrade headers and query |
| UI HTML, `/@vite/*`, source modules, styles and other development assets | Vite; preserve request path and external Host |

Vite uses the configured external origin, one explicit allowed host/CORS origin,
and Vite 8 `server.ws` settings. The external client port is explicit, preventing
Vite's direct WebSocket fallback around the proxy. HTTPS origins use WSS.
Direct API traffic reaching connected Vite returns a fixed no-store 503 problem
response, rather than SPA HTML. No API proxy target is configured in the UI.
See [Vite's server options](https://v8.vite.dev/config/server-options#server-ws).

## Qualification and limits

`node --test tools/sensors/connected-dev.test.mjs` checks invalid/valid origins,
build/preview/test isolation, actual Vite config wiring, direct API denial and
host rejection. The development browser suite exercises synthetic loopback edge
routing, HttpOnly session-cookie forwarding, logout Origin/CSRF, SSE and HMR from
an owned temporary module. HMR must update the DOM without changing the document's
boot marker or requesting an off-origin socket. No live provider/profile is used.

Run `pnpm check`, `pnpm e2e` and `pnpm verify --group browser-quality` for handoff.
The app's no-emit type configuration permits explicit `.ts` imports for native
Vite config loading; strictness, production budgets and browser quality limits
remain unchanged. Real HTTPS/OIDC, deployment overlays and backend rebuild/restart
are not qualified by this synthetic transport fixture.
