# Quality score

## TL;DR

This is a current evidence ledger, not a claim of production readiness. Update it when a capability and its checks change.

| Area | Current evidence | Gap |
|:--|:--|:--|
| Web shell | Type check, production build, and mock-exclusion check in pnpm check | No live backend or full browser end-to-end workflow |
| Mobile shell | Type check, Expo dependency check, and Android JavaScript bundle | No device/emulator run or native interaction test |
| Architecture | Import boundary check | Semantic boundaries still need review |
| Documentation | Local link and plan-structure check | Factual freshness needs maintainers |
| API compatibility | Pinned OpenAPI snapshot, generated-type check, fixture drift check, parser tests, and mock-backed web/mobile adapter tests | Live backend compatibility, browser-safe identity, and event contracts remain |
| Accessibility | Semantic asset links, text status, native accessible rows, and calculated token contrast | Rendered keyboard/focus, screen-reader, and device review remain |

Do not convert a missing capability into a high score because its scaffold builds. Record failures and owned work in the active plan or debt tracker.

