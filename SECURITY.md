# Security

## TL;DR

Keep credentials out of browser code and recordings. Run the pinned source/history, advisory and artifact gates. See [security and delivery](docs/development/security-delivery.md) for capture, exception review and publication policy.

Do not publish suspected vulnerabilities or credentials in a public issue.
Use GitHub private vulnerability reporting for this repository when available;
otherwise contact a maintainer privately through GitHub before disclosure.

Treat API responses, telemetry, URL state, and browser storage as untrusted.
The backend owns authorization and tenant isolation. A frontend visibility
check is not an authorization control. Never put long-lived secrets in the
browser bundle or mock credentials in production builds.

Browser identity uses provider-neutral OIDC and server sessions under one public
HTTPS origin. Native login redirects keep tokens on the server. The shared browser
adapter permits only same-origin `/api/v1` requests, rejects authorization/cookie
header injection, uses no-store fetch, and refuses API redirects. Logout sends
`X-FleetIQ-CSRF: 1`; the browser supplies Origin. Inspecting a session grants no
client-side tenant permission; the platform checks every protected request.

Session expiry, unauthorized metadata responses, and logout unmount protected
views. A failed logout explicitly reports that server revocation is unconfirmed.
Only a validated internal metadata path is stored as optional sign-in return context;
no tokens or session identifiers enter browser storage or test artifacts.
