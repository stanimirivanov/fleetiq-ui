# Review of the public return-route storage identifier

## TL;DR

The user explicitly approved one exact public-identifier allowance on 11 October 2026. Its scope is fixed below; genuine credential detection remains enforced.

## Evidence

The declaration in apps/web/src/features/identity/ui/OperatorSessionProvider.tsx
uses RETURN_KEY to name the public entry fleetiq.operator-return.v1. Its consumers pass this string as
the browser sessionStorage entry name, storing only a validated internal route.
The value is public application code, not an access token, password or secret.
Gitleaks generic-api-key matched the key-like declaration.

## Approved exact allowance

- Rule: generic-api-key.
- File: apps/web/src/features/identity/ui/OperatorSessionProvider.tsx.
- Exact matched public value: fleetiq.operator-return.v1.
- Owner: FleetIQ frontend maintainers.
- Reason: public sessionStorage entry identifier; no credential value.
- Review expiry: 2027-01-11.
- Apply to current source, index and historical occurrences of this exact value.
- Every other rule, path and value remains blocked; a changed credential in
  the same file must fail a real-detector fixture.
- A trusted base preceding introduction of this sensor uses a reviewed bootstrap
  default containing only this same explicit classification; it grants no broader
  exception. Subsequent bases must independently permit it.

## Approval status

Approved explicitly by the user: “Approve this exact public-identifier allowance.” The earlier automatic approval rejection required this authorization; it is now resolved for this exact scope. Implementation and real-detector regression verification passed in the trust-delivery PR.
