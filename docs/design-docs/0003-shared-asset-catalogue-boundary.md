# 0003 - Share the asset catalogue boundary across web and mobile

Status: accepted

## Context

The first asset preview exposed two different loader signatures and names. Web used an HTTP adapter through MSW, while native read the fixture directly. This reflected different development transports, but duplicated tenant validation and made the feature contract look platform-specific.

## Options

- Move all data access to one shared HTTP client and run a native mock HTTP server. This would unify transport for the preview but add infrastructure unrelated to native behavior.
- Keep both adapters entirely separate. This preserves platform control but invites drift in page shape, cancellation, and tenant validation.
- Share the loader port, tenant-scoped parsing, and HTTP boundary; inject authorization and fetch runtime. Keep the development preview wiring in each app.

## Decision

Create a platform-neutral asset-catalogue package with one page-loader signature, one tenant-scoped parser, and a reusable HTTP loader. The web preview configures that loader with its MSW-only synthetic bearer value. The native preview reads the same contract fixture locally through the shared parser. Both app adapters use the name previewCatalogue and return the same page shape. The apps still own navigation, local request state, and future credential acquisition.

## Consequences and review trigger

No browser or native credential is embedded in the shared package. A future production adapter can use the HTTP loader with an app-provided authorization function, but must be reviewed with the backend identity flow. Native fixture transport is intentionally different from web MSW. Test the shared boundary, each app adapter, and tenant isolation. Review caching and paging parity when live API integration arrives.

This refines the shared-package boundary in [decision 0002](0002-asset-preview-navigation.md).
