import type {
  RegistryCutoffRead,
  RegistryReviewCutoffs,
} from './registry-review-types';

const DECIMAL_MILLISECONDS = /^(?:0|-[1-9]\d*|[1-9]\d*)$/u;

function parseMilliseconds(value: string | undefined): number | null {
  if (!value || !DECIMAL_MILLISECONDS.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return null;
  const year = new Date(parsed).getUTCFullYear();
  return year >= 1 && year <= 9999 ? parsed : null;
}

/**
 * Reads the explicit physical and recorded cutoffs from a shareable URL.
 *
 * Missing both means the caller may canonicalize to its sample default.
 * One missing, duplicated, malformed, or unsafe integer value is invalid; it
 * must never silently fall back to a different metadata snapshot.
 */
export function readRegistryReviewCutoffs(search: string): RegistryCutoffRead {
  const parameters = new URLSearchParams(search);
  const effectiveValues = parameters.getAll('effective_at_ms');
  const knownValues = parameters.getAll('known_at_ms');
  if (effectiveValues.length === 0 && knownValues.length === 0) {
    return { status: 'missing' };
  }
  if (effectiveValues.length !== 1 || knownValues.length !== 1) {
    return {
      status: 'invalid',
      reason: 'Select exactly one effective time and one known time.',
    };
  }
  const effectiveAtMs = parseMilliseconds(effectiveValues[0]);
  const knownAtMs = parseMilliseconds(knownValues[0]);
  if (effectiveAtMs === null || knownAtMs === null) {
    return {
      status: 'invalid',
      reason:
        'Cutoffs must be safe integer Unix milliseconds in UTC years 0001–9999.',
    };
  }
  const cutoffs: RegistryReviewCutoffs = { effectiveAtMs, knownAtMs };
  return { status: 'valid', cutoffs };
}

export type RegistrySelectionKey = 'asset' | 'node' | 'source';

export type RegistrySelectionRead =
  | { readonly status: 'missing' }
  | { readonly status: 'value'; readonly value: string }
  | { readonly status: 'invalid'; readonly reason: string };

/** Explicit selection never falls back when a URL provides an empty or duplicate ID. */
export function readRegistrySelection(
  search: string,
  key: RegistrySelectionKey,
): RegistrySelectionRead {
  const values = new URLSearchParams(search).getAll(key);
  if (values.length === 0) return { status: 'missing' };
  if (values.length !== 1 || !values[0]?.trim()) {
    return {
      status: 'invalid',
      reason: `Select exactly one nonempty ${key} ID.`,
    };
  }
  return { status: 'value', value: values[0].trim() };
}

export interface RegistryFilters {
  readonly q: string;
  readonly type: string;
}

export interface RegistryFilterAssetRow {
  readonly asset: {
    readonly id: string;
    readonly name: string;
    readonly assetType: { readonly id: string };
  };
}

function singleFilter(parameters: URLSearchParams, key: string): string {
  const values = parameters.getAll(key);
  return values.length === 1 ? (values[0] ?? '') : '';
}

/** Shareable catalogue filters remain independent from the sample fixture. */
export function readRegistryFilters(search: string): RegistryFilters {
  const parameters = new URLSearchParams(search);
  return {
    q: singleFilter(parameters, 'q'),
    type: singleFilter(parameters, 'type').trim(),
  };
}

export function filterRegistryAssets<T extends RegistryFilterAssetRow>(
  rows: readonly T[],
  filters: RegistryFilters,
): readonly T[] {
  const query = filters.q.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (filters.type === '' || row.asset.assetType.id === filters.type) &&
      (query === '' ||
        row.asset.id.toLowerCase().includes(query) ||
        row.asset.name.toLowerCase().includes(query)),
  );
}
