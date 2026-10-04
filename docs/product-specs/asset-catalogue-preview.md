# Asset catalogue preview

## TL;DR

The first asset surface shows tenant-scoped asset identity on web and mobile from the pinned partial contract. It is a development preview, not a live operational dashboard. Condition remains explicitly unknown.

## Actor and entry

An operator opens the asset list for a tenant. Web navigation uses /tenants/{tenantId}/assets and /tenants/{tenantId}/assets/{assetId}. Native navigation carries the same identifiers, including deep links with the fleetiq scheme. A development-only mock mode starts at tenant-a; production has no default tenant or fixture data.

## Data and behavior

The list displays each contract asset's name, internal ID, and versioned type. It does not infer condition, freshness, location, hierarchy, or permission from those fields. The identity route carries only the selected ID. It does not claim the asset exists or show a synthetic detail object. Web uses the contract cursor for explicit Load more. Native initially displays the single fixture page; pagination is deferred until a production client and a multi-page contract example exist.

Both platforms show loading, empty, error, retry, and unconnected states. Web distinguishes 401 and 403 from generic failure. Native's fixture has no authenticated error surface and uses a generic failure state. Asset rows only appear when the response belongs to the requested tenant. A visual preview banner labels synthetic data. Unknown condition uses text as well as color.

## Acceptance examples

- With mock mode enabled, tenant-a shows Primary machine and its contract ID/type; selecting it opens an identity-only route.
- With mock mode disabled, the production shell says the catalogue is unconnected and makes no synthetic data request.
- An empty page says no assets are registered; a failed request offers Retry; a late response from a previous tenant cannot replace the current tenant view.
- A tenant-b request cannot display tenant-a's fixture assets.
- Web keyboard users can focus asset links and actions; native rows have button roles and accessible names.

## Deferred dependencies

A browser-safe identity flow, production authorization, a live list adapter, asset detail contract, telemetry freshness, and native device testing are separate work. They must precede any operational status claim.
