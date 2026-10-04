# Shared workspace packages

The [api-contract](api-contract/README.md) package is shared by web and mobile. It holds generated backend transport types, runtime parsers, and synthetic fixtures; platform presentation remains in each app. A package must have a package.json, a clear public entry point, and a consumer in the same change. Do not move components here solely because they have a similar name on both platforms.

The workspace and architecture gate already include this directory. See [the architecture](../ARCHITECTURE.md) and [workspace tooling decision](../docs/design-docs/0001-workspace-tooling.md).
