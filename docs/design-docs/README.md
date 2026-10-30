# Design decisions

Durable product and engineering decisions live here when their rationale
matters to later changes. Each numbered record captures context, decision,
consequences, and alternatives.

- [0001 - Operational visual language](0001-operational-visual-language.md):
  light-first operator console, semantic themes, and explicit status states.
- [0002 - Persistent shell and theme preference](0002-persistent-shell-theme.md):
  stable router layout and one Light/Dark/System icon control.
- [0003 - Pinned asset catalogue contract](0003-pinned-asset-catalogue-contract.md):
  validated read boundary and browser-auth deferral.

- [0004 - Browser-safe semantic metadata](0004-browser-safe-semantic-metadata.md):
  one managed runtime, independent feature ports, explicit tenant/cutoff/cursor
  scope, and same-origin OIDC session ownership.

- [0005: Source-owned immutable UX/static-edge delivery](0005-immutable-ux-delivery.md) (proposed in issue #71).

- [0006: Connected property evidence](0006-connected-property-evidence.md): exact current snapshots, bounded history and original provenance.

- [0007: Inspector live delivery](0007-inspector-live-delivery.md): exact-property SSE, finite reconnect and account-scoped disposal.

- [0008: Connected geodetic map](0008-connected-geodetic-map.md): explicit coordinate mapping, owned MapLibre lifecycle and self-hosted map resources.

- [0009: Connected fleet overview](0009-connected-fleet-overview.md): authoritative inventory, scoped coverage and optional geographic context.

- [0010: Registry commissioning](0010-registry-commissioning.md).

- [0011: Signal-binding authoring](0011-binding-authoring.md).

- [0012: Native NGINX edge](0012-native-nginx-edge.md): remove the unpatched JOSE runtime while preserving qualified static/API/TLS behavior.

- [0013: Connected alerts](0013-connected-alerts.md): bounded lifecycle triage and independently authorized exact calculator evidence.
