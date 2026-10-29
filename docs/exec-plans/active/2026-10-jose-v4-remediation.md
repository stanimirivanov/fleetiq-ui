# Patch JOSE v4 and track deferred JOSE v3

Status: active

Milestone: M02 - Product Foundation

## Goal

Patch CVE-2026-116587 on the supported JOSE v4 path while retaining the owner-chosen
Caddy runtime and explicitly preserving the v3 security/publication blocker.

## Scope

- Upgrade only selected go-jose v4.1.5 to upstream v4.1.6 and generated checksums.
- Run focused upstream RSA-JWK behavior regressions in the pinned Go image stage.
- Preserve producer/scan policy and document remaining v3 dependency ownership.

## Design decisions

The upstream advisory lists no v3 patch. Caddy v2.11.7 depends on Smallstep
certificates v0.30.2, cli-utils v0.12.2 and crypto v0.91.0; these require v3.
Inspection of Caddy's TLS/Caddyfile imports rules out removing v3 simply by
selecting fewer registered modules. Smallstep crypto v0.91.1 still requires v3.
The owner chose the supported v4 fix and deferred v3 rather than changing proxy
technology or maintaining a cryptographic backport. No replace directives,
advisory ignores, filters or severity changes are introduced.

## Acceptance criteria

- [x] Select upstream v4.1.6 using Go module tooling.
- [x] Require real JWK regression tests in the image builder and reject their removal.
- [x] Focused local Go and producer-policy checks pass.
- [ ] Remaining source/build/runtime checks execute on CI.
- [ ] Upstream-supported v3 remediation and full clean image qualification (deferred).

## Acceptance evidence

Passed: focused Go security tests (single-package concurrency), 14 affected
producer/scanner fixtures, selected-module verification, producer/harness policy,
formatting and documentation checks. An initial broader run passed 17 fixtures
and failed one unchanged CLI startup deadline on the busy host. An isolated
retry also timed out at the unchanged 10-second bound; this remains failed
locally and is delegated to CI, not reported as passed. Full build/scan checks are not run locally.
Local Go uses 1.26.4; CI's pinned
builder remains Go 1.26.10. Heavy full Caddy compilation, Docker/runtime and
Trivy qualification remain on CI. The known v3 finding is expected to keep the
image job red; this plan does not claim full vulnerability remediation or release
readiness. D06 and full-profile qualification remain deferred.

## Out of scope

Proxy replacement, cryptographic forks/backports, v3 exceptions, Caddy feature
removal, unrelated dependency updates, product UI changes or infrastructure work.

## Upstream recheck: 2026-10-29

The [upstream advisory](https://github.com/go-jose/go-jose/security/advisories/GHSA-mgcc-cww5-fp2q)
still lists no patched v3 release; the supported v4 fix is 4.1.6, already selected
in `packaging/caddy/go.mod`. Both Smallstep
[crypto](https://github.com/smallstep/crypto/blob/master/go.mod) and
[certificates](https://github.com/smallstep/certificates/blob/master/go.mod)
still depend on v3.0.5. The remaining image finding therefore has no supported
dependency-only update on this graph. Retain the owner decision to defer v3;
do not suppress the finding or claim image/publication qualification. Replacing
the edge or maintaining a cryptographic fork requires a separate review.

## Superseding remediation

On 2026-10-29 the owner approved replacing Caddy with native NGINX. The
[replacement plan](2026-10-native-nginx-edge.md) removes the runtime dependency
instead of waiting for a v3 patch. Historical v4 test evidence above remains valid;
full remediation requires a passing replacement image scan and native gates.
