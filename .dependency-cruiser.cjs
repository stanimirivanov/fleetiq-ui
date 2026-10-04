/** Direct import rules for the two UI applications. */
module.exports = {
  forbidden: [
    {
      name: 'no-circular-imports',
      severity: 'error',
      comment:
        'Break the cycle or move shared behavior to a lower-level module.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'web-cannot-import-mobile',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^apps/mobile/' },
    },
    {
      name: 'mobile-cannot-import-web',
      severity: 'error',
      from: { path: '^apps/mobile/' },
      to: { path: '^apps/web/' },
    },
    {
      name: 'shared-cannot-import-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'shared-ui-cannot-import-features',
      severity: 'error',
      from: { path: '^apps/(web|mobile)/src/shared/' },
      to: { path: '^apps/(web|mobile)/src/features/' },
    },
    {
      name: 'feature-cannot-import-composition',
      severity: 'error',
      from: { path: '^apps/(web|mobile)/src/features/' },
      to: { path: '^apps/(web|mobile)/src/(app|shell)/' },
    },
    {
      name: 'feature-model-cannot-import-ui-or-api',
      severity: 'error',
      from: { path: '^apps/(web|mobile)/src/features/[^/]+/model/' },
      to: { path: '^apps/(web|mobile)/src/features/[^/]+/(ui|api)/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|dist|\\.expo)/' },
  },
};
