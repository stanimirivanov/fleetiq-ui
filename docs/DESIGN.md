# Design system

## TL;DR

FleetIQ defaults to an accessible light operator theme. Dark-theme support is planned as a separate slice; no screen follows an incomplete system-dark palette. Visual references guide hierarchy and interaction, not copied layouts or assets.

The light screenshots saved in offline-docs suggest a pale working canvas, white content surfaces, restrained blue emphasis, and clear status text. The dark report screenshot demonstrates a second viable density and contrast treatment. FleetIQ keeps its own equipment-neutral language and semantic asset model. A map-led surface should always have a keyboard-accessible list or detail alternative.

## Current light tokens

| Role | Value | Use |
|:--|:--|:--|
| Canvas | #F4F7FA | Page background |
| Surface | #FFFFFF | Cards and panels |
| Outline | #D8E0E8 | Nonessential separators |
| Foreground | #142235 | Primary text |
| Muted | #475569 | Secondary text |
| Accent | #006B8F | Links, focus, emphasis |
| Unknown | #825700 | Unknown-condition text and border |

The web Tailwind theme and native token module use the same values. On both canvas and surface, foreground, muted, accent, and unknown text exceed 4.5:1 WCAG contrast; the theme check enforces that. Status words remain visible independently of color. Native spacing remains 4/8/16/24/32 points with 16-point body and 30-point title text; web uses Tailwind's responsive scale.

## Evolution and validation

The app uses light browser and native system chrome now. There is no theme toggle or saved preference until dark colors, every state, and both platforms have been reviewed together. The dark-theme slice must define semantic dark tokens, user/system preference behavior, persistence, and contrast checks, then validate list, empty, error, focus, and status states in both modes.

Distinguish fresh, stale, unknown, and alarm states with text and shape as well as color. Use consistent units, time-zone labels, provenance, and confidence when data warrants them. Adaptive density must be predictable and user-controllable. Validate rendered focus indicators and native screen-reader behavior on devices before release. External inspiration research remains outside Git in the user's offline-docs directory.
