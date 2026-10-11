# Shared web boundaries
Read [architecture](../../../../ARCHITECTURE.md),
[frontend structure](../../../../docs/development/frontend-structure.md) and
[verification](../../../../docs/development/verification.md) for this scope.

Keep shared code product-neutral and independent of features and app composition.
Expose stable cross-owner entry points and keep internal imports direct. Avoid
general abstractions without a concrete second use.

UI owns reusable presentation. Managed HTTP owns transport scope and cancellation.
Keep authentication credentials out of browser storage and unknown payloads at
the validated boundary. Do not broaden a shared component's layout responsibility
to satisfy one screen.

Verify public import rules with actual-tool fixtures when changing boundaries.
