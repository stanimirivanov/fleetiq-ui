/** Registered navigation and bounded context; semantics still require review. */
export const documentationPolicy = {
  requiredEntries: [
    'AGENTS.md',
    'ARCHITECTURE.md',
    'CONTRIBUTING.md',
    'docs/README.md',
    'docs/FRONTEND.md',
    'docs/agents/issue-tracker.md',
    'docs/agents/triage-labels.md',
    'docs/agents/domain.md',
    'docs/development/verification.md',
    'docs/development/security-delivery.md',
  ],
  guidanceRoutes: [
    {
      file: 'AGENTS.md',
      maxWords: 900,
      targets: [
        'docs/agents/issue-tracker.md',
        'docs/agents/triage-labels.md',
        'docs/agents/domain.md',
        'CONTRIBUTING.md',
        'docs/README.md',
        'docs/development/frontend-structure.md',
        'docs/development/verification.md',
        'docs/development/security-delivery.md',
      ],
    },
    {
      file: 'docs/README.md',
      maxWords: 600,
      targets: [
        'ARCHITECTURE.md',
        'docs/FRONTEND.md',
        'docs/development/frontend-structure.md',
        'contracts/http/README.md',
        'docs/development/testing.md',
        'docs/agents/issue-tracker.md',
        'docs/development/verification.md',
        'docs/development/security-delivery.md',
      ],
    },
    ...['app', 'features', 'shared'].map((owner) => ({
      file: `apps/web/src/${owner}/AGENTS.md`,
      maxWords: 400,
      targets: [
        'ARCHITECTURE.md',
        'docs/development/frontend-structure.md',
        'docs/development/verification.md',
        'docs/development/security-delivery.md',
      ],
    })),
    {
      file: 'apps/web-e2e/AGENTS.md',
      maxWords: 400,
      targets: [
        'docs/development/testing.md',
        'docs/development/verification.md',
        'docs/development/security-delivery.md',
      ],
    },
    {
      file: 'tools/AGENTS.md',
      maxWords: 400,
      targets: [
        'docs/development/verification.md',
        'docs/development/security-delivery.md',
        'CONTRIBUTING.md',
        'contracts/http/README.md',
      ],
    },
  ],
};
