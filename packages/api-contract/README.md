# Backend API contract package

## TL;DR

This package pins the backend-owned partial OpenAPI v1 baseline from fleetiq-platform commit 4ba2528c5de068e1f1305e97b5130b8f35d1af53. Web and mobile share its generated transport types, runtime response parsers, and synthetic fixtures. The backend remains the contract owner.

The source artifact is [fleetiq-v1-ui-baseline.openapi.json](fleetiq-v1-ui-baseline.openapi.json); contract.sha256 prevents unnoticed edits. Run pnpm --filter @fleetiq/api-contract generate to produce src/generated.ts with openapi-typescript. The root pnpm contract:check verifies the hash, generated types, fixture equality, parsers, and both app adapters. Update the source commit and hash only after reviewing an intentional backend contract revision.

The artifact describes discovery and one protected asset catalogue route, not the entire backend. Its bearer scheme currently represents a configured workload credential and must not be presented as browser or mobile login. Mock fixtures are synthetic. The web worker starts only in development with VITE_API_MODE=mock; it is absent from production builds. The native fixture adapter is called explicitly and never falls back from a live request.

Generated types model the wire shape at compile time. Zod parsers validate unknown response payloads at runtime and accept compatible extra fields. Features should translate validated payloads into feature models when their invariants differ.

This package has no DOM, React, React Native, or navigation dependency. openapi-typescript is a build-only generator, Zod is a runtime boundary parser, and MSW lives in the web app only. The package can be replaced when the backend publishes a more complete generated client, provided the runtime trust boundary and fixture checks remain.
