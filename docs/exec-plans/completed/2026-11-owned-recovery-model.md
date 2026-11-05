# Feature-owned Operations recovery model

Status: completed
Milestone: M05 - Analytics and Operations
Issue: #116

## Goal

Implement approved F-PR9 by separating recovery presentation and the public
Operations port from generated wire DTOs.

## Scope

Own work-family, recovery request, preparation and receipt types inside the
feature model. The gateway validates generated responses and translates recovery
fields explicitly. Presentation consumes the owned port and values.

## Design decisions

Retain decimal strings for counters, rule revisions, firing versions and clocks.
Map recovery values to camel-case model fields while constructing the same wire
payloads at the gateway. Keep captured request IDs, actor checks and exact next
generation validation. Own the existing diagnostic return shape as part of the
same port so its public signature has no generated dependency.

## Acceptance criteria

- Pure models and public feature types have no generated DTO aliases.
- Gateway tests verify DTO validation, exact translation and stable request identity.
- Existing browser recovery actions, labels and authorization behavior pass.

## Acceptance evidence

The new valid-notification mapping test failed on the original adapter's wire
representation. Eight gateway tests then passed, including malformed preparation,
precise notification target mapping, receipt attribution, repeated sends and
pause/resume payloads. Required final gates are pnpm check, pnpm e2e and
pnpm verify --group browser-quality. The delivery PR records their results.

## Out of scope

New recovery actions, backend API changes and dependency updates.
