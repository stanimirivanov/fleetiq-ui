import { expect, test } from 'vitest';
import { readEvidenceQuery } from './evidence-query';

const properties = [{ id: 'voltage', version: 1 }];
test('history URL retains explicit restored selection and exact summary resolution', () => {
  const s = readEvidenceQuery(
    '?history_start=0&history_end=3000&history_manifest=7&history_generation=2&history_resolution=1000',
    properties,
    3000,
  );
  expect(s).toMatchObject({
    kind: 'ready',
    restore: { manifestId: '7', generation: '2' },
    resolution: '1000',
  });
});
test('partial, malformed or oversized bucket scopes fail rather than selecting hot history', () => {
  for (const search of [
    'history_manifest=1',
    'history_generation=1',
    'history_manifest=01&history_generation=1',
    'history_resolution=0',
    'history_resolution=1',
    'history_resolution=1000&history_resolution=1000',
  ]) {
    expect(
      readEvidenceQuery(
        `?history_start=0&history_end=3000&${search}`,
        properties,
        3000,
      ).kind,
    ).toBe('invalid');
  }
});
