# Shared workspace packages

This directory will contain independently testable, platform-neutral code once a web and mobile feature actually shares a contract or behavior. A package must have a package.json, a clear public entry point, and a consumer in the same change. Do not move components here solely because they have a similar name on both platforms.

The workspace and architecture gate already include this directory. See [the architecture](../ARCHITECTURE.md) and [workspace tooling decision](../docs/design-docs/0001-workspace-tooling.md).
