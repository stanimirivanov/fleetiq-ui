# Design language foundation

Status: completed

Milestone: M02 - Product Foundation

## Goal

Turn the approved FleetIQ visual direction into a tracked decision and
executable light/dark styling foundation before implementing product screens.

## Scope

- Record the operational visual language and status semantics in a design
  decision record.
- Add semantic Tailwind/CSS tokens for light and dark surfaces, text, actions,
  focus, and four status tones.
- Show both themes in an explicitly synthetic specimen at the scaffold route.
- Add a shared status badge that requires a visible label.
- Enforce selected text and non-text token contrast pairs in the quality gate.
- Update scaffold documentation that says the visual design is undecided.

## Design decisions

Product-specific state calculation remains outside shared UI primitives.
Theme preference and the persistent application shell follow in the next
slice. No screen receives live or mock fleet data in this change.

## Acceptance evidence

- pnpm install --frozen-lockfile passed with the existing lockfile.
- pnpm check passed: Biome, TypeScript, dependency boundaries, documentation
  links, semantic token contrast, and production build.
- The Vite specimen rendered locally at desktop and 500 px browser widths;
  the root route returned HTTP 200. The design preview contains no fleet data.

## Out of scope

API contracts, mock transport, tenant navigation, maps, charts, alerts,
commissioning, mobile applications, and production theme persistence.
