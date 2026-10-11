# Feature ownership
Read [architecture](../../../../ARCHITECTURE.md),
[frontend structure](../../../../docs/development/frontend-structure.md) and
[verification](../../../../docs/development/verification.md) for this scope.

Keep model rules inward, transport and validated decoding at the API boundary,
and UI orchestration outward. Features remain independent; app composition imports their public entries.
Within one feature, use direct inward imports. Do not import app composition,
test fixtures or another feature.

Keep type dependencies acyclic too. Prefer a small shared type leaf over a facade
cycle. Preserve typed failures and cleanup in services; UI renders their states.
Do not let a size limit replace cohesion or reactivity review.

Run focused model/component/browser checks and canonical groups appropriate to
the changed behavior. New constraints need a real violating fixture.
