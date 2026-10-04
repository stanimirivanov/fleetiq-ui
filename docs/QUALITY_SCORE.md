# Quality score

## TL;DR

This is a current evidence ledger, not a claim of production readiness. Update it when a capability and its checks change.

| Area | Current evidence | Gap |
|:--|:--|:--|
| Web shell | Type check and production build in pnpm check | No contract-backed feature or browser workflow test |
| Mobile shell | Type check, Expo dependency check, and Android JavaScript bundle | No device/emulator run or interaction test |
| Architecture | Import boundary check | Semantic boundaries still need review |
| Documentation | Local link and plan-structure check | Factual freshness needs maintainers |
| API compatibility | None | Contract fixtures and drift check in next slice |
| Accessibility | Initial semantic web markup and native text | Keyboard, reader, contrast, and device review with real features |

Do not convert a missing capability into a high score because its scaffold builds. Record failures and owned work in the active plan or debt tracker.

