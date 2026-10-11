/** Official upstream release commits, verified with git ls-remote on 2026-10-11. */
export const ACTIONS = {
  checkout: 'actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803', // v6.1.0
  node: 'actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38', // v6.5.0
  upload: 'actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f', // v6.0.0
  pages: 'actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d', // v6.0.0
  uploadPages:
    'actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9', // v5.0.0
  deployPages: 'actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346', // v5.0.1
};
export const GUIDE_TRIGGER =
  "(github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main') || (github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push' && github.event.workflow_run.head_branch == 'main' && github.event.workflow_run.head_repository.full_name == github.repository)";
export const GUIDE_REF = `\${{ github.event.workflow_run.head_sha || github.sha }}`;
