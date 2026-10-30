# FleetIQ UI

## TL;DR

Development and repository verification are supported on Linux.

FleetIQ's SolidJS operator console connects asset identities, pinned definitions,
directed relationships, and signal bindings through same-origin operator sessions.
It retains the approved persistent shell and Light/Dark/System theme. Local
sample workspaces cover overview, map, inspector, registry, and Alerts while
location, telemetry, and alert contracts are developed.

## Start

Use Node.js 24 or newer and pnpm 12.5.1.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Vite development opens the connected overview and its sign-in/tenant flow. Use
`/?preview=sample` for the labelled sample overview; its sidebar stays in that
explicit sample workspace. **Connected metadata** returns to connected access.
There is no separate mock server to start. Direct preview URLs are:

- `/map?preview=sample` — schematic site canvas and paired asset list.
- `/assets?preview=sample` — bounded, contract-shaped catalogue.
- `/assets/:assetId?preview=sample` — sample inspector and finite signal playback.
- `/assets/registry/review?preview=sample` — relationship and mapping review.
- `/alerts?preview=sample` — synthetic queue, evidence, and timeline.
- `/design-system` — synthetic light/dark design specimen.

A production build never activates these sample previews or includes their
fixture payloads. The ordinary overview, map and Alerts use authorized backend evidence. Alerts
provides bounded read-only lifecycle triage and exact calculator evidence.

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

After current `pnpm check`, `pnpm e2e`, and `pnpm verify --group browser-quality`
pass, `pnpm guide:generate` records ten chapters: console orientation, four
connected-metadata demonstrations, and five separate development previews.
The ignored Markdown/HTML book uses synthetic data, never live provider or customer
recordings. See the [testing guide](docs/development/testing.md).

## Documentation

Start with [AGENTS.md](AGENTS.md) and [docs/README.md](docs/README.md).
[ARCHITECTURE.md](ARCHITECTURE.md) explains dependency and lifetime ownership;
[docs/PLANS.md](docs/PLANS.md) tracks reviewable work.


## Read alert evidence

Open `/alerts`, select an authorized tenant and choose a phase filter. Select an
exact rule revision to review its condition and bounded transition history, then
choose **Inspect latest transition evidence** or a history entry. Calculator
provenance and exact decimal outputs require separate `telemetry.read` access;
`alerts.read` does not grant it. Use the explicit next-page links for queue,
history and outputs. URL selection is shareable, but pages are independent
observations and do not establish complete history or condition health.

## Configure alert rules

On `/alerts`, enter an exact **Rule ID to configure**. Review the current head and
retained definition, then append its next immutable numeric-threshold revision.
Creation leaves activation unchanged. Explicitly activate a retained revision or
deactivate using the reviewed generation. The UI needs `alerts.read` for review
and separate `alerts.manage` for writes. Missing/unusable evidence is unknown.
An unconfirmed command locks its original payload for **Retry exact command**;
a conflicting command offers a fresh-head reload. A retry receipt may be historical.

## Acknowledge an alert

Select an exact pending/firing alert and choose **Acknowledge displayed version**.
This independently requires `alerts.acknowledge`; rule-management grants do not
imply it. The receipt identifies the exact lifecycle version, actor and recorded
time. Acknowledgement does not resolve, silence, assign or suppress delivery.
A resolution race requires **Refresh current alert**; an unconfirmed response
allows only the captured exact retry. Later lifecycle versions require their own
acknowledgement. Current and historical transition annotations remain separate.
