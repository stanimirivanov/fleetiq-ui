# FleetIQ UI

FleetIQ's React web and Expo/React Native mobile applications live in one workspace so they can deliver the same operator capabilities in parallel. The apps have a pinned backend contract and an asset identity preview using explicit development fixtures; no live backend data is connected yet. The app supports light and dark themes on both platforms; Light is the first-run default, with Dark and System choices saved locally.

## Start

Use Node.js 24 or newer and the pinned pnpm version in package.json.

- pnpm install --frozen-lockfile
- pnpm dev:web:preview
- pnpm dev:mobile:web:preview
- pnpm check

Run commands at the repository root. pnpm dev:web:preview starts Vite with the development MSW handlers; open http://localhost:5173/tenants/tenant-a/assets; no separate mock server is needed. pnpm dev:mobile:web:preview starts the Expo app for a browser at its printed local URL (normally port 8081) with its local fixture adapter. Use pnpm dev:mobile:preview for an Android or iOS device. The plain pnpm dev:web and pnpm dev:mobile commands keep the unconnected state. Mocking is development-only; see [the shared contract](packages/api-contract/README.md) and [asset catalogue boundary](packages/asset-catalogue/README.md). Android needs an emulator or device, and iOS native builds require macOS.

Read [AGENTS.md](AGENTS.md) for the short working agreement, [docs/README.md](docs/README.md) for task-specific guidance, and [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries. The backend lives in the separate fleetiq-platform repository.
