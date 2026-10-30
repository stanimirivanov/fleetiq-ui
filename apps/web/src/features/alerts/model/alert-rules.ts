import type { Definition } from './alert-definition';
export interface Activation {
  readonly generation: number;
  readonly revision: number | null;
  readonly actor_id: string | null;
  readonly recorded_at_ms: number | null;
}
export interface RuleHead {
  readonly latest_revision: number;
  readonly activation: Activation;
}
export interface RuleRevision {
  readonly revision: number;
  readonly definition: Definition;
  readonly actor_id: string;
  readonly recorded_at_ms: number;
}
export interface RuleScope {
  readonly tenant: string;
  readonly rule: string;
}
export type RuleCommand =
  | (RuleScope & {
      readonly kind: 'append';
      readonly revision: number;
      readonly definition: Definition;
    })
  | (RuleScope & {
      readonly kind: 'activate';
      readonly expected_generation: number;
      readonly revision: number | null;
    });
export interface RuleGateway {
  head(r: RuleScope, o?: { readonly signal?: AbortSignal }): Promise<RuleHead>;
  revision(
    r: RuleScope & { readonly revision: number },
    o?: { readonly signal?: AbortSignal },
  ): Promise<RuleRevision>;
  command(
    r: RuleCommand,
    o?: { readonly signal?: AbortSignal },
  ): Promise<string>;
}
export const ruleIdentifier = (s: string) =>
  s.length > 0 &&
  [...s].length <= 128 &&
  s.trim() === s &&
  !/[\p{Cc}\p{Cs}]/u.test(s) &&
  s !== '.' &&
  s !== '..';
export const validScope = (r: RuleScope) =>
  ruleIdentifier(r.tenant) && ruleIdentifier(r.rule);
export const uint = (n: number, minimum = 0) =>
  Number.isInteger(n) && n >= minimum && n <= 4294967295;
/** Bound exact decimal magnitude and normalized fractional places without a float conversion. */
export function threshold(s: string): boolean {
  if (s.length > 256) return false;
  const m = /^[+-]?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(s);
  if (!m) return false;
  const fraction = m[2] ?? m[3] ?? '',
    digits = ((m[1] ?? '') + fraction).replace(/^0+/, '');
  if (!digits) return true;
  const exponent = BigInt(m[4] ?? '0') - BigInt(fraction.length),
    trailing = digits.length - digits.replace(/0+$/, '').length;
  return (
    BigInt(digits.length) + exponent <= 128n &&
    exponent + BigInt(trailing) >= -64n
  );
}
export function validDefinition(d: Definition): boolean {
  return (
    d.kind === 'numeric-threshold-v1' &&
    d.resolution === 'resolve_on_false' &&
    [d.calculator, d.version, d.scope, d.target, d.output_property].every(
      ruleIdentifier,
    ) &&
    (d.threshold_unit === null || ruleIdentifier(d.threshold_unit)) &&
    uint(d.output_version, 1) &&
    d.output_index === 0 &&
    ['gt', 'gte', 'lt', 'lte'].includes(d.comparison) &&
    threshold(d.threshold) &&
    [d.hold_ms, d.resolve_after_ms].every(
      (n) => Number.isInteger(n) && n >= 0 && n <= 604800000,
    )
  );
}
