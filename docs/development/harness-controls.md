# Harness control and review register

## TL;DR

A deterministic sensor proves its bounded property, not overall design or
production readiness. This register gives each control an owner and review
trigger. Follow [verification](verification.md), [measured quality](measured-browser-quality.md)
and [secure delivery](security-delivery.md) for commands and recovery.

| Control | Enforcement and scope | Owner | Review trigger |
| --- | --- | --- | --- |
| Context and plan integrity | Git-owned Markdown routes, anchors, containment, budgets and lifecycle fixtures | Maintainer / documentation owners | New owner, guide or plan format |
| Capability boundaries | Runtime/type graph and bounded AST checks over registered product owners | Frontend architects | New capability/package/adapter; parser upgrade |
| Critical behavior | Ten-module coverage floors, complete denominators, named assertions and three real assertion mutants | Identity/assets/shared-HTTP owners | Changed session/scope/parsing/cursor semantics; legitimate simplification |
| Browser error ownership | Owned auto fixture, direct-import lint and actual positive/error browser probes | Browser harness owners | New scenario directory or observation hook |
| Production output | Resolved module ownership, actual output/hash inventory and raw/gzip budgets | Build / frontend owners | Map SDK, substantial feature, Vite upgrade |
| Rendered accessibility | Selected Axe rules, five representative production surfaces, themes/viewports | Design-system / feature owners | New control, screen, interaction, theme or Axe upgrade |
| Responsiveness and resource growth | Bounded mock workload, warm-up, five samples, post-GC metrics, no quality retries | Browser harness owners | First hosted result; browser/tool/workload upgrade; threshold breach |
| Failure recovery | Negative fixtures, owned cleanup, exact-source evidence, no partial release | Harness owners | Any escaped gate or failed cleanup |
| Source/advisory/artifact safety | Checksummed source/index/history detector, frozen audit, inspected retention | Security / maintainer | Advisory, tool pin or reviewed exception expiry |
| Publication | Three complete groups and output/source hashes at selected SHA | Maintainer / release owners | Workflow or deployment changes |

## Review-owned and unqualified areas

- **Architecture judgment — frontend architects:** cohesion, SOLID trade-offs,
  abstraction usefulness and arbitrary dynamic aliasing still need review.
  Trigger: any changed capability boundary or growing orchestration module.
- **Accessibility/visual design — design owners:** screen-reader/manual keyboard
  use and whole-product visual fidelity are not certified by selected Axe scans.
  Trigger: a new interaction or screen, and release/pilot review.
- **Workload realism — product/platform owners:** these mocks qualify bounded UI
  rendering only. Live telemetry, geodetic maps, large graphs, network/backend
  latency and long-session memory remain unqualified. Trigger: corresponding
  contracts and representative deployment/workload exist.
- **Operational observations — platform/frontend owners:** test-owned redacted
  lifecycle counters are not production monitoring. Trigger: an agreed production
  telemetry/privacy contract and incident-response requirements.
- **Real OIDC/deployment — identity/platform owners:** mocked cookies, session
  responses and redirect fixtures do not qualify HTTPS/proxy/provider permissions.
  Trigger: deployment configuration and provider-backed pilot journeys.
- **External protections — repository administrator:** require check, browser,
  browser-quality and harness-windows statuses, Code Owner review and stale-review
  dismissal. Local YAML checks do not prove GitHub rulesets or host permissions.
  Trigger: repository setup, policy ownership changes and release review.

Threshold and instrumentation changes require reviewed reasons and new
measurements. Retain old failure evidence where safe; never present a later pass
as proof that the original failure or retry did not occur.
