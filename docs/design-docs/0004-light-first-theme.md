# 0004 - Ship a light default before adding dual-theme selection

Status: accepted

## Context

The first asset preview introduced dark-only colors even though the light Fleetile screenshots saved outside Git are also useful references. Web and native currently have only a small identity view; a live data client and full dashboard do not exist yet. Introducing a toggle now would imply coverage of both palettes across loading, empty, error, status, and navigation states without evidence.

## Options

- Keep dark as the only palette until the product grows. This prolongs a visual direction the user does not want as the default.
- Add light and dark palettes and a selector in one change. This broadens the first design-system review across two platforms and many untested states.
- Establish semantic light tokens and light system chrome now; add complete dark support and preference behavior in a later slice.

## Decision

Use the light theme by default on web and native. Keep semantic token names independent of palette so later dark values can replace the same roles. Do not expose a partial dark mode or follow system dark preference before the dark slice is complete. Check web/native token parity and text contrast in CI. Use the offline screenshots for hierarchy and density only; do not copy Fleetile branding, assets, or layouts.

## Consequences and review trigger

Existing asset, identity, overview, loading, empty, and error views inherit the light palette. The next theme slice must choose explicit/system preference precedence and persistence, provide dark values for every token, and validate both modes on web and native devices. Review this decision if operational testing shows a different default is needed.
