# Design system

## TL;DR

FleetIQ supports light and dark operator themes on web and mobile. Light remains the default. Operators can choose Light, Dark, or System; explicit choices override device appearance, and System follows it. Status meaning and accessibility must survive both palettes.

The screenshots saved in offline-docs suggest a pale working canvas, white content surfaces, restrained blue emphasis, and clear status text for light mode; the dark report screenshot demonstrates a second viable density and contrast treatment. FleetIQ uses its own equipment-neutral language and semantic asset model. A map-led surface should always have a keyboard-accessible list or detail alternative.

## Operator shell and control language

The web app uses a persistent 64-pixel product bar, a 256-pixel desktop navigation pane, and a flexible content pane. At narrow widths, navigation becomes a compact row below the bar. Every route uses the same content origin and padding, so moving between an asset list and identity does not shift the page. The browser reserves scrollbar width for the same reason. The shell contains only implemented destinations; future features do not appear as working navigation.

FleetIQ uses an original graph-and-signal mark and simple outlined icons. Give the canvas breathing room, keep panels on the surface color with subtle borders and small shadows, use restrained blue for active navigation and focus, and keep headings and secondary text distinct. Use consistent rounded panels and compact utility controls. The top-bar theme icon cycles Light, Dark, and System; its accessible name states the current and next mode. No visible Appearance label is needed. The same single-icon interaction is used on mobile. Language, notifications, and account positions are labeled but unavailable until their product capabilities exist.

## Semantic colors

| Role | Light | Dark | Use |
|:--|:--|:--|:--|
| Canvas | #F4F7FA | #101B2A | Page background |
| Surface | #FFFFFF | #18273A | Cards and panels |
| Outline | #D8E0E8 | #3C5269 | Nonessential separators |
| Foreground | #142235 | #F1F7FC | Primary text |
| Muted | #475569 | #B8C8D7 | Secondary text |
| Accent | #006B8F | #7AD3ED | Links, focus, emphasis |
| Unknown | #825700 | #F5C777 | Unknown-condition text and border |

The web Tailwind theme and native token module use the same role names and values. On both canvas and surface, foreground, muted, accent, and unknown text exceed 4.5:1 WCAG contrast; `pnpm theme:check` enforces parity and contrast. Status words remain visible independently of color. Native spacing remains 4/8/16/24/32 points with 16-point body and 30-point title text; web uses Tailwind's responsive scale.

## Preference and validation

An absent, unreadable, or invalid saved preference uses Light. User choices are stored locally on each platform. System mode reacts to browser or device appearance changes; failure to save is visible in the control. Web updates the root palette and browser color scheme. Native updates navigation, surfaces, and status-bar contrast. See [decision 0005](design-docs/0005-theme-preference.md) for precedence and persistence.

Review list, empty, loading, error, focus, navigation, and unknown-status states in both themes. Distinguish fresh, stale, unknown, and alarm states with text and shape as well as color. Use consistent units, time-zone labels, provenance, and confidence when data warrants them. Adaptive density must be predictable and user-controllable. Validate rendered focus indicators and native screen-reader behavior on devices before release. External inspiration research remains outside Git in the user's offline-docs directory.