import {
  cursor,
  identifier,
  type Phase,
  phases,
  revision,
} from './connected-alerts';

const owned = [
  'configure',
  'tenant',
  'phase',
  'after',
  'rule',
  'revision',
  'history_after',
  'evaluation',
  'outputs_after',
] as const;
export interface AlertQuery {
  readonly configure?: string;
  readonly tenant: string;
  readonly phase?: Phase;
  readonly after?: string;
  readonly rule?: string;
  readonly revision?: number;
  readonly history_after?: string;
  readonly evaluation?: string;
  readonly outputs_after?: string;
  readonly invalid: boolean;
}
/** URL state is bounded before any read. Cursors remain opaque to the browser. */
export function alertQuery(search: string): AlertQuery {
  const p = new URLSearchParams(search),
    tenant = p.get('tenant') ?? '',
    rule = p.get('rule') ?? undefined;
  const configure = p.get('configure') ?? undefined;
  const phase = p.get('phase') ?? 'open',
    rawRevision = p.get('revision'),
    n = rawRevision === null ? undefined : Number(rawRevision);
  const after = p.get('after') ?? undefined,
    history = p.get('history_after') ?? undefined,
    evaluation = p.get('evaluation') ?? undefined,
    outputs = p.get('outputs_after') ?? undefined;
  const invalid =
    (configure !== undefined && (!identifier(configure) || !tenant)) ||
    owned.some((k) => p.getAll(k).length > 1) ||
    (tenant !== '' && !identifier(tenant)) ||
    (phase !== 'open' && !phases.includes(phase as Phase)) ||
    [after, history, outputs].some((c) => c !== undefined && !cursor(c)) ||
    (rule !== undefined && !identifier(rule)) ||
    (evaluation !== undefined && !identifier(evaluation)) ||
    (rule === undefined) !== (n === undefined) ||
    (n !== undefined &&
      (!revision(n) || !/^[1-9][0-9]*$/.test(rawRevision ?? ''))) ||
    ((history !== undefined || evaluation !== undefined) &&
      rule === undefined) ||
    (outputs !== undefined && evaluation === undefined) ||
    (tenant === '' && (rule !== undefined || after !== undefined));
  return {
    configure,
    tenant,
    phase: phase === 'open' ? undefined : (phase as Phase),
    after,
    rule,
    revision: n,
    history_after: history,
    evaluation,
    outputs_after: outputs,
    invalid,
  };
}
export function alertHref(
  search: string,
  changes: Readonly<Record<string, string | number | undefined>>,
): string {
  const p = new URLSearchParams(search);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || value === '') p.delete(key);
    else p.set(key, String(value));
  }
  const suffix = p.toString();
  return `/alerts${suffix ? `?${suffix}` : ''}`;
}
export const clearEvidence = {
  evaluation: undefined,
  outputs_after: undefined,
};
export const clearSelection = {
  rule: undefined,
  revision: undefined,
  history_after: undefined,
  ...clearEvidence,
};
export function alertTenantHref(search: string, tenant: string): string {
  return alertHref(search, {
    tenant,
    configure: undefined,
    after: undefined,
    ...clearSelection,
  });
}
