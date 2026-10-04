# FleetIQ UI

FleetIQ's React web and Expo/React Native mobile applications live in one workspace so they can deliver the same operator capabilities in parallel. The apps are scaffolds with a pinned backend contract and explicit development fixtures; no live backend data is connected yet.

## Start

Use Node.js 24 or newer and the pinned pnpm version in package.json.

- pnpm install --frozen-lockfile
- pnpm dev:web
- pnpm dev:mobile
- pnpm check

The web app runs with Vite. For synthetic API responses, set VITE_API_MODE=mock in an untracked apps/web/.env.local file before pnpm dev:web. Mocking is development-only; see [the shared contract](packages/api-contract/README.md). The mobile app runs with Expo; Android requires an emulator or device, and iOS native builds require macOS. Run commands at the repository root.

Read [AGENTS.md](AGENTS.md) for the short working agreement, [docs/README.md](docs/README.md) for task-specific guidance, and [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries. The backend lives in the separate fleetiq-platform repository.
