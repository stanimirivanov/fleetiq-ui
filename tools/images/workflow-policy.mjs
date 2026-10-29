/** Producer workflow is exact reviewed policy; Action majors remain independently reviewed. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACTIONS } from '../verification/actions.mjs';
import { REVIEWED } from '../verification/reviewed-dependencies.mjs';
import {
  ensure,
  readJson,
  validateDockerfile,
  validateEdgeConfiguration,
  validateTools,
} from './policy.mjs';
export function renderPublication(template) {
  for (const role of ['checkout', 'node', 'upload'])
    template = template.replaceAll(`@${role}@`, ACTIONS[role]);
  ensure(!/@[a-z]+@/u.test(template), 'Unknown publication action slot.');
  return template;
}
export function checkPublication(template, workflow) {
  ensure(
    renderPublication(template.replaceAll('\r\n', '\n')) ===
      workflow.replaceAll('\r\n', '\n'),
    'Image publication differs from its reviewed workflow template.',
  );
}
export function validateContext(text) {
  const rules = text
    .split(/\r?\n/u)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const expected = [
    '*',
    '!package.json',
    '!pnpm-lock.yaml',
    '!pnpm-workspace.yaml',
    '!tsconfig.base.json',
    '!apps/',
    '!apps/web/',
    '!apps/web/**',
    '!apps/web-e2e/',
    '!apps/web-e2e/package.json',
    '!contracts/',
    '!contracts/http/',
    '!contracts/http/fleetiq-v1-ui-baseline.openapi.json',
    '!tools/',
    '!tools/**',
    '!packaging/',
    '!packaging/**',
    '!Dockerfile',
    '**/node_modules',
    '**/dist',
    '**/coverage',
    '**/.git',
    '**/.env',
    '**/.env.*',
    '**/test-results',
    '**/playwright-report',
    '**/*.log',
    '**/*.key',
    '**/*.pem',
  ];
  ensure(
    JSON.stringify(rules) === JSON.stringify(expected),
    'Build context differs from the reviewed allowlist.',
  );
}
export function checkProducer(root = process.cwd()) {
  const read = (p) => readFileSync(join(root, p), 'utf8');
  const tools = readJson(join(root, 'tools/images/tools.json'));
  validateTools(tools);
  ensure(
    tools.node.startsWith(`node:${REVIEWED.nodeMajor}.`),
    'Image builder Node major differs from the reviewed runtime.',
  );
  validateDockerfile(read('Dockerfile').replaceAll('\r\n', '\n'), tools);
  validateEdgeConfiguration(
    read('packaging/nginx/nginx.conf.template'),
    read('packaging/nginx/proxy.conf.template'),
    read('packaging/entrypoint.sh'),
  );
  validateContext(read('.dockerignore'));
  checkPublication(
    read('.github/image-publication.yml.template'),
    read('.github/workflows/publish-image.yml'),
  );
}
