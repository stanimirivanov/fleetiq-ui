# Shared workspace packages

The [api-contract](api-contract/README.md) package holds generated backend transport types, runtime parsers, and synthetic fixtures. The [asset-catalogue](asset-catalogue/README.md) package shares the page-loader boundary, tenant validation, and HTTP parser. The [theme-preference](theme-preference/README.md) package shares pure preference validation and resolution. Platform preview wiring and presentation remain in each app. A package must have a package.json, a clear public entry point, and a consumer in the same change. Do not move components here solely because they have a similar name on both platforms.

The workspace and architecture gate already include this directory. See [the architecture](../ARCHITECTURE.md) and [workspace tooling decision](../docs/design-docs/0001-workspace-tooling.md).
