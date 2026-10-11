# Application composition
Read [architecture](../../../../ARCHITECTURE.md),
[frontend structure](../../../../docs/development/frontend-structure.md) and
[verification](../../../../docs/development/verification.md) for this scope.

Compose routes, providers, layouts and the shared managed runtime here. Import
features through public entries. Never move feature rules into a route just to
avoid an inward dependency.

Pages orchestrate named sections; children own interaction state. Keep URL state
shareable. Presentation delegates effects and cancellation to services. A lint
pass does not prove all reactive reads are safe: review body destructuring and
derived state explicitly.

Run focused component/browser checks, then the canonical acceptance and browser
groups before handoff. Record every failed or unavailable check.
