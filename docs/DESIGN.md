# Design system

## TL;DR

Create an accessible operator interface with clear status hierarchy, legible telemetry, and platform-appropriate interactions. Visual references guide patterns, not copied assets or feature commitments.

Use a spatial-first view when location is central, but always pair it with a keyboard-accessible list or detail view. Distinguish fresh, stale, unknown, and alarm states with text and shape as well as color. Use consistent units, time zone labels, provenance, and confidence where data warrants them. Mobile prioritizes glanceable summaries and focused actions; web can expose denser comparison and exploration. Adaptive density must be predictable and user-controllable, never hide safety-critical information automatically.

The first visual PR should define tokens for color, typography, spacing, and status semantics, then validate contrast and responsive layout. The current shells use temporary local colors solely to prove both targets boot. External inspiration research is intentionally kept outside Git in the user's offline-docs directory.
