import { REVIEWED } from './reviewed-dependencies.mjs';

/** Reviewed repository and major references, per delivery policy; commit metadata records review history. */
export const ACTIONS = Object.freeze(
  Object.fromEntries(
    Object.entries(REVIEWED.actions).map(([role, action]) => [
      role,
      `${action.repository}@v${action.version.split('.')[0]}`,
    ]),
  ),
);
export const GUIDE_TRIGGER =
  "(github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main') || (github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push' && github.event.workflow_run.head_branch == 'main' && github.event.workflow_run.head_repository.full_name == github.repository)";
export const GUIDE_REF = `\${{ github.event.workflow_run.head_sha || github.sha }}`;
