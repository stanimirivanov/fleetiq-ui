# Technical debt tracker

## TL;DR

Record accepted, specific gaps here with impact, owner, and review trigger. An unimplemented planned feature belongs in the active plan, not this tracker.

| Gap | Impact | Owner / review trigger |
|:--|:--|:--|
| Native device and accessibility validation unavailable in generic CI | Type checking and Expo compatibility do not prove Android/iOS interaction | UI maintainers; validate asset navigation, theme switching, system-following, and reader labels on Android and iOS before release |
| OpenAPI type generator advertises TypeScript 5 peer while the workspace uses TypeScript 6 | Generation and type checks pass today, but the unsupported peer range may affect upgrades | Contract maintainers; review at the next contract tooling refresh |
