import { readFileSync } from 'node:fs';
import { ownedFile } from './owned.mjs';
import { git } from './process.mjs';

export const POLICY_PATH = 'tools/security/policy.json';
export const PUBLIC_STORAGE_EXCEPTION = {
  rule: 'generic-api-key',
  path: 'apps/web/src/features/identity/ui/OperatorSessionProvider.tsx',
  value: 'fleetiq.operator-return.v1',
  owner: 'FleetIQ frontend maintainers',
  reason: 'Public session-storage entry identifier; never a credential.',
  expires: '2027-01-11',
};
export const DEFAULT_POLICY = {
  version: 1,
  registry: 'https://registry.npmjs.org',
  secretExceptions: [PUBLIC_STORAGE_EXCEPTION],
  advisoryExceptions: [],
};
const sha = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u;
/** Only exact, expiring, owned advisory exceptions are expressible. */
export function validatePolicy(
  value,
  today = new Date().toISOString().slice(0, 10),
) {
  if (
    !value ||
    Object.keys(value).sort().join(',') !==
      'advisoryExceptions,registry,secretExceptions,version' ||
    value.version !== 1 ||
    value.registry !== DEFAULT_POLICY.registry ||
    !Array.isArray(value.secretExceptions) ||
    !Array.isArray(value.advisoryExceptions)
  ) {
    throw new Error(
      'Security policy must preserve default detection and the public registry; false positives require exact reviewed ownership.',
    );
  }
  for (const exception of value.secretExceptions) {
    if (
      !exception ||
      Object.keys(exception).sort().join(',') !==
        'expires,owner,path,reason,rule,value' ||
      !/^[-a-z0-9_]{1,120}$/iu.test(exception.rule) ||
      typeof exception.path !== 'string' ||
      !exception.path ||
      exception.path.includes('\\') ||
      exception.path.includes('*') ||
      exception.path.includes(':') ||
      exception.path
        .split('/')
        .some((part) => !part || part === '..' || part === '.') ||
      typeof exception.value !== 'string' ||
      !exception.value ||
      exception.value.length > 4096 ||
      !exception.owner?.trim() ||
      !exception.reason?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/u.test(exception.expires) ||
      Number.isNaN(Date.parse(exception.expires)) ||
      exception.expires < today
    ) {
      throw new Error(
        'Secret false-positive review requires exact rule/file/value, owner, reason and unexpired review date.',
      );
    }
  }
  const identifiers = new Set();
  for (const exception of value.advisoryExceptions) {
    if (
      Object.keys(exception).sort().join(',') !==
        'advisory,expires,owner,package,paths,reason,version' ||
      !/^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/u.test(exception.advisory) ||
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/u.test(exception.package) ||
      !/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/iu.test(exception.version) ||
      !Array.isArray(exception.paths) ||
      !exception.paths.length ||
      exception.paths.some(
        (item) =>
          typeof item !== 'string' ||
          !item ||
          item.includes('*') ||
          /[\r\n]/u.test(item),
      ) ||
      !exception.owner?.trim() ||
      !exception.reason?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/u.test(exception.expires) ||
      Number.isNaN(Date.parse(exception.expires)) ||
      exception.expires < today
    ) {
      throw new Error(
        'Advisory exception requires exact identity/version/paths, owner, reason and unexpired review date.',
      );
    }
    const key = `${exception.advisory}:${exception.package}:${exception.version}`;
    if (identifiers.has(key)) throw new Error('Duplicate advisory exception.');
    identifiers.add(key);
  }
  return value;
}
export function currentPolicy(root) {
  try {
    return validatePolicy(
      JSON.parse(readFileSync(ownedFile(root, POLICY_PATH), 'utf8')),
    );
  } catch {
    throw new Error(
      'Security policy is missing, invalid or weakens detection.',
    );
  }
}
/** CI supplies event JSON; incoming repository text never selects a trusted base. */
export function eventScope(eventName, event, head, { repository } = {}) {
  if (!sha.test(head))
    throw new Error('Invalid checked-out security revision.');
  if (eventName === 'pull_request') {
    const base = event?.pull_request?.base?.sha;
    const incoming = event?.pull_request?.head?.sha;
    if (!sha.test(base) || !sha.test(incoming))
      throw new Error(
        'Pull request security scan requires trusted event revisions.',
      );
    return { base, incoming, range: `${base}..${head}` };
  }
  if (eventName === 'push') {
    if (
      !sha.test(event?.after) ||
      event.after !== head ||
      !sha.test(event?.before)
    )
      throw new Error(
        'Push security event does not identify the checked-out revision.',
      );
    const base = /^0+$/u.test(event.before) ? null : event.before;
    return { base, incoming: head, range: base ? `${base}..${head}` : '--all' };
  }
  if (eventName === 'workflow_run') {
    const run = event?.workflow_run;
    if (
      !repository ||
      event?.repository?.full_name !== repository ||
      run?.conclusion !== 'success' ||
      run?.event !== 'push' ||
      run?.head_branch !== 'main' ||
      run?.head_repository?.full_name !== repository ||
      !sha.test(run?.head_sha) ||
      run.head_sha !== head
    ) {
      throw new Error(
        'Guide workflow event is not a successful same-repository main push at this revision.',
      );
    }
    return { base: null, incoming: head, range: '--all' };
  }
  if (eventName === 'workflow_dispatch') {
    if (
      !repository ||
      event?.repository?.full_name !== repository ||
      event?.ref !== 'refs/heads/main'
    )
      throw new Error(
        'Manual publication requires the same repository main branch.',
      );
    return { base: null, incoming: head, range: '--all' };
  }
  if (eventName === undefined)
    return { base: null, incoming: head, range: '--all' };

  throw new Error(
    'Unsupported security event; trusted input selection unavailable.',
  );
}
export function scanScope(root, { environment = process.env, event } = {}) {
  const head = git(root, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  const name =
    environment.GITHUB_ACTIONS === 'true'
      ? environment.GITHUB_EVENT_NAME
      : undefined;
  if (environment.GITHUB_ACTIONS === 'true' && !name)
    throw new Error(
      'CI security event name is missing; no trusted base selection.',
    );
  let payload = event;
  if (name && !payload) {
    try {
      payload = JSON.parse(readFileSync(environment.GITHUB_EVENT_PATH, 'utf8'));
    } catch {
      throw new Error('Trusted GitHub security event is missing or malformed.');
    }
  }
  if (name === 'workflow_dispatch' && environment.GITHUB_SHA !== head)
    throw new Error('Manual security revision differs from the dispatch SHA.');
  const scope = eventScope(name, payload, head, {
    repository: environment.GITHUB_REPOSITORY,
  });
  for (const revision of [scope.base, scope.incoming].filter(Boolean)) {
    git(root, ['merge-base', '--is-ancestor', revision, head]);
  }
  return { ...scope, head };
}
export function policies(root, scope) {
  const result = [currentPolicy(root)];
  if (scope.base) {
    const listing = git(root, [
      'ls-tree',
      '--name-only',
      scope.base,
      '--',
      POLICY_PATH,
    ]).trim();
    if (listing) {
      try {
        result.push(
          validatePolicy(
            JSON.parse(git(root, ['show', `${scope.base}:${POLICY_PATH}`])),
          ),
        );
      } catch {
        throw new Error(
          'Trusted base security policy is invalid; no clean result.',
        );
      }
    } else {
      // Initial addition still receives uncompromised defaults, never a broad exemption.
      result.push(DEFAULT_POLICY);
    }
  }
  return result;
}
