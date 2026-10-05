# 0006 - Keep an operator shell across web routes

Status: accepted

## Context

The asset list and identity route each owned a different maximum-width page wrapper. Navigating between them moved headings and cards horizontally, while the theme selector floated independently of the page. The local dashboard reference demonstrates a more stable hierarchy: product bar, navigation pane, and content pane. FleetIQ has only an overview and contract-backed asset identity preview; it does not yet have live notifications, a language catalogue, or an authenticated account.

## Options

- Continue rendering a complete page per route and align individual widths. This fixes one jump but lets future routes drift again.
- Put persistent chrome in the app composition layer and render each route into a common content grid.
- Introduce a generic layout/component package for both web and native. Their navigation and layout systems differ, so this adds a premature shared UI boundary.

## Decision

Use a web-only operator shell in app composition. Its top bar carries the FleetIQ product mark and compact utility positions; its left pane contains only implemented navigation. The right pane provides one shared width and padding for overview, asset list, and identity. Keep the top bar and navigation mounted across React Router changes, and reserve scrollbar space to prevent horizontal movement when page heights differ. On narrow screens, navigation becomes a compact row below the top bar.

Use original geometric icons, calm canvas/surface separation, subtle borders, rounded panels, restrained blue emphasis, and clear type hierarchy. These are design principles drawn from the privately saved reference, not copied branding or assets. A single labeled icon button cycles Light, Dark, and System on web and mobile. Mobile renders the three original vector shapes through [react-native-svg](https://docs.expo.dev/versions/v57.0.0/sdk/svg/), which Expo SDK 57 supports on Android, iOS, and web. It is isolated to the mobile control and can be replaced without changing preference rules; this avoids an icon-font package for three icons. Language, notifications, and account appear in the web top bar as disabled, labeled affordances until their supporting capabilities exist; no mock activity or identity is implied.

## Consequences and verification

Feature routes keep owning their content and data; app composition owns chrome and navigation. The overview remains reachable in preview mode rather than redirecting immediately to assets. Shell tests verify the product bar and navigation persist across list-to-identity navigation, and theme tests verify cycling and persistence. Browser checks must verify the two routes share the same content origin at desktop widths and that controls remain usable on narrow screens. Native device interaction and future localization/notification/account flows remain separate work.