/** Structural import rules for the Solid web application. */
module.exports = {
  forbidden: [
    {
      name: 'no-circular-imports',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'shared-cannot-import-features-or-app',
      severity: 'error',
      from: { path: '^apps/web/src/shared/' },
      to: { path: '^apps/web/src/(features|app)/' },
    },
    {
      name: 'feature-cannot-import-app-composition',
      severity: 'error',
      from: { path: '^apps/web/src/features/' },
      to: { path: '^apps/web/src/app/' },
    },
    {
      name: 'feature-cannot-import-another-feature-private-file',
      severity: 'error',
      from: { path: '^apps/web/src/features/([^/]+)/' },
      to: {
        path: '^apps/web/src/features/',
        pathNot: '^apps/web/src/features/$1/',
      },
    },
    {
      name: 'feature-model-cannot-import-ui-or-transport',
      severity: 'error',
      from: { path: '^apps/web/src/features/[^/]+/model/' },
      to: {
        path: '^apps/web/src/(features/[^/]+/(ui|api)/|shared/api/|generated/)',
      },
    },
    {
      name: 'feature-api-cannot-import-ui',
      severity: 'error',
      from: { path: '^apps/web/src/features/[^/]+/api/' },
      to: { path: '^apps/web/src/features/[^/]+/ui/' },
    },
    {
      name: 'feature-ui-cannot-import-generated-or-shared-transport',
      severity: 'error',
      from: { path: '^apps/web/src/features/[^/]+/ui/' },
      to: { path: '^apps/web/src/(generated/|shared/api/)' },
    },
    {
      name: 'no-unresolved-package-imports',
      severity: 'error',
      from: { path: '^apps/web/src/' },
      to: { path: '^#', couldNotResolve: true },
    },
    {
      name: 'shared-model-cannot-import-ui-or-transport',
      severity: 'error',
      from: { path: '^apps/web/src/shared/model/' },
      to: { path: '^apps/web/src/(shared/(api|ui)/|generated/)' },
    },
    {
      name: 'external-imports-use-shared-runtime-entry',
      severity: 'error',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/shared/api/' },
      to: {
        path: '^apps/web/src/shared/api/',
        pathNot: '^apps/web/src/shared/api/index[.]ts$',
      },
    },
    {
      name: 'external-imports-use-shared-model-entry',
      severity: 'error',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/shared/model/' },
      to: {
        path: '^apps/web/src/shared/model/',
        pathNot: '^apps/web/src/shared/model/index[.]ts$',
      },
    },
    {
      name: 'external-imports-use-shared-ui-entry',
      severity: 'error',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/shared/ui/' },
      to: {
        path: '^apps/web/src/shared/ui/',
        pathNot: '^apps/web/src/shared/ui/index[.]ts$',
      },
    },
    {
      name: 'external-imports-use-feature-entry',
      severity: 'error',
      from: { path: '^apps/web/src/', pathNot: '^apps/web/src/features/' },
      to: {
        path: '^apps/web/src/features/',
        pathNot: '^apps/web/src/features/[^/]+/index[.]ts$',
      },
    },
    {
      name: 'packages-cannot-import-app',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
  ],
  options: {
    // Preserve type-only edges so architectural rules cover interface dependencies.
    tsPreCompilationDeps: true,
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|dist)/' },
  },
};
