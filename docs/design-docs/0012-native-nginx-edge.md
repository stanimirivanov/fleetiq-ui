# Native NGINX edge

Status: approved by owner on 2026-10-29; implementation in issue #100.

## Context

Caddy imports Smallstep's unpatched JOSE v3 even when automatic HTTPS is disabled.
The supported v4 patch does not remove that independent major-version dependency.
This blocks the mandatory image gate and final M04 installed acceptance. The owner
approved replacing Caddy rather than suppressing findings or maintaining crypto.

## Decision

Use the official minimal NGINX 1.30.6 linux/amd64 image pinned in
[tools.json](../../tools/images/tools.json). Retain the frontend Node build; remove
the Caddy Go module and proxy compiler stage. No package installation changes the
runtime binary. Source-owned configuration preserves same-origin static/API
routing, CSP, cookies, canonical forwarded authority, bounded SSE and shutdown.

Run UID/GID 10001, high ports, read-only root and dropped capabilities. Render
validated literals into a unique private directory under bounded `/tmp`; never
use eval, rewrite the immutable root or adopt stale staging files. The loopback
health probe stays separate from backend readiness. Ordinary API idle reads are
bounded at 5s; exact property SSE has 75s. Backend identity/authorization stay Rust-owned.

NGINX OSS emits a generic `Server: nginx` header. Disable version disclosure and
require exactly that identity in native probes; never reflect an upstream server
value. Preserve every CSP, cache, Origin, cookie and forwarding policy. Serve SPA
inspector paths separately from compiled asset files and never rewrite missing
map/static resources to HTML.

Use a separately pinned OpenSSL fixture image for ephemeral CA/leaf generation.
Private keys stay in a labeled Docker volume with restricted directories; only
the leaf subpath reaches the TLS gateway and only the public CA reaches probes.
Checked ownership precedes cleanup. No local trust store or real identity is used.

## Verification

Qualify exact final OCI bytes, package-owned NGINX inventory, runtime NGINX SBOM,
absence of Go binaries, all high/critical and secret findings and a fresh database.
Keep image provenance/publication and product bundle budgets unchanged. Actual
HTTP, browser, TLS trust/hostname, streaming handshake, outage, invalid config and
graceful-stop probes must pass. Scanner/producer tests include rejecting controls.

## Consequences and alternatives

No JOSE fork or advisory exception remains necessary. Native OS/library updates
still require reviewed digests and full scanning. Waiting for coordinated upstream
migration has no reliable deadline; carrying crypto backports creates maintenance
and compatibility obligations; extra proxy/controller services are unnecessary.

The deployment repository must adapt its owned TLS config and pin this merged UI
source before completing real device-to-web acceptance. D06/full-profile work stays
deferred. This decision supersedes only the runtime choice in [0005](0005-immutable-ux-delivery.md),
not immutable-publication ownership or release/promotion boundaries.
