# Design system

## TL;DR

Create an accessible operator interface with clear status hierarchy, legible telemetry, and platform-appropriate interactions. Visual references guide patterns, not copied assets or feature commitments.

Use a spatial-first view when location is central, but always pair it with a keyboard-accessible list or detail view. Distinguish fresh, stale, unknown, and alarm states with text and shape as well as color. Use consistent units, time zone labels, provenance, and confidence where data warrants them. Mobile prioritizes glanceable summaries and focused actions; web can expose denser comparison and exploration. Adaptive density must be predictable and user-controllable, never hide safety-critical information automatically.

The asset catalogue preview establishes the first tokens in web Tailwind theme and native theme constants. Both use canvas #020617, surface #0f172a, outline #475569, foreground #f8fafc, muted #cbd5e1, accent #67e8f9, and unknown #fbbf24. Native spacing uses 4/8/16/24/32 points and body/title sizes 16/30; web uses Tailwind's responsive spacing and type scale. Unknown condition is always written in text. Against the surface, foreground, muted, accent, and unknown text have calculated WCAG contrast ratios of 17.06:1, 12.02:1, 12.32:1, and 10.69:1 respectively. Validate rendered focus indicators and native screen-reader behavior on devices before release.

The web list uses a narrow single-column layout that expands within a maximum width on larger screens. Native keeps a single-column touch list. External inspiration research is intentionally kept outside Git in the user's offline-docs directory.
