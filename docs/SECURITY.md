# UI security engineering

## TL;DR

Backend authorization is authoritative. Keep tokens and tenant context scoped, validate incoming data, and never embed secrets or sensitive telemetry in Git or mock fixtures.

Treat URL parameters, API responses, and stream messages as untrusted. Do not render raw HTML from devices or asset metadata. Avoid storing access tokens in browser localStorage; select the authentication flow with the backend contract and threat model. Invalidate caches and subscriptions on tenant or identity change. Protect command and administrative actions with backend permissions and explicit user confirmation. Use synthetic fixtures without customer identifiers.

For reporting a vulnerability, see [the repository security policy](../SECURITY.md). A design change affecting authentication, tenant boundaries, or commands requires a reviewable threat model and explicit tests.
