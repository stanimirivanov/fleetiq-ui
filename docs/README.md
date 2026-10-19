# Documentation map

## TL;DR

Use the short entry point for the question at hand. Put product design,
architecture decisions, execution state, and reference material in their own
homes rather than growing the root README.

- [Architecture](../ARCHITECTURE.md): dependency and trust boundaries.
- [Frontend](FRONTEND.md): selected stack and state ownership.
- [Frontend structure](development/frontend-structure.md): component, Effect,
  reactivity, and presentation review rules.
- [Pinned HTTP contract](../contracts/http/README.md): backend revision,
  validation, and update process.
- [Connected browser identity decision](design-docs/0004-browser-safe-semantic-metadata.md):
  session ownership, managed transport, and temporal metadata limits.
- [Testing](development/testing.md): component and browser gates, page objects, and executable guides.
- [Verification](development/verification.md): canonical inventory, scoped context,
  sensor qualification, evidence and external CI administration.
- [Plans](PLANS.md): reviewable work and milestone mapping.
- [Design decisions](design-docs/README.md): durable choices and trade-offs.
- [Active execution plans](exec-plans/active/README.md): work in progress.
- [Completed execution plans](exec-plans/completed/README.md): verified slices.
- [Technical debt tracker](exec-plans/tech-debt-tracker.md): known debt with a
  trigger for action.

- [Browser trust and delivery](development/security-delivery.md): model/transport sensors, scans, capture and exact-source publication.

- [Measured browser quality](development/measured-browser-quality.md): critical obligations, output budgets, rendered checks and calibrated workloads.
- [Harness control register](development/harness-controls.md): owners, review triggers and unqualified areas.

- [Dependency upgrade review](development/dependency-upgrades.md): reviewed pins, read-only proposals, early qualification and recovery.

- [Immutable UX image delivery](development/image-publication.md): runtime routing, actual artifact qualification and maintainer publication.
