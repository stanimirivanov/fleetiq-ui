import { afterEach, expect, test, vi } from 'vitest';
import { type BrowserApi, createBrowserApi } from '#shared/api';
import { createAlertReader } from './alert-reader';
import {
  parseDetail,
  parseEvaluation,
  parseHistory,
  parseOutputs,
  parseQueue,
} from './parse-alerts';
import {
  detail,
  detailRequest,
  detailWire,
  evaluationWire,
  evidenceRequest,
  historyWire,
  outputRequest,
  outputsWire,
  queueRequest,
  queueWire,
} from './tests/alert-fixture';

const owned: BrowserApi[] = [];
afterEach(async () => {
  await Promise.all(owned.splice(0).map((a) => a.dispose()));
});
function setup(wire: unknown, status = 200) {
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(JSON.stringify(wire), {
        status,
        headers: {
          'content-type':
            status === 200 ? 'application/json' : 'application/problem+json',
        },
      }),
  );
  const api = createBrowserApi({ origin: 'https://fleet.example', fetch });
  owned.push(api);
  return { reader: createAlertReader(api), fetch };
}
test('reads all five bounded operations through the managed runtime with exact scope and text precision', async () => {
  const cases = [
    {
      wire: queueWire,
      run: (r: ReturnType<typeof createAlertReader>) => r.queue(queueRequest),
      path: '/alerts?limit=20',
    },
    {
      wire: detailWire,
      run: (r: ReturnType<typeof createAlertReader>) => r.detail(detailRequest),
      path: '/alerts/voltage-high/revisions/1',
    },
    {
      wire: historyWire,
      run: (r: ReturnType<typeof createAlertReader>) =>
        r.history({ ...detailRequest, detail }),
      path: '/alerts/voltage-high/revisions/1/transitions?limit=20',
    },
    {
      wire: evaluationWire,
      run: (r: ReturnType<typeof createAlertReader>) =>
        r.evaluation(evidenceRequest),
      path: '/assets/asset-a/calculator-evaluations/evaluation-b',
    },
    {
      wire: outputsWire,
      run: (r: ReturnType<typeof createAlertReader>) =>
        r.outputs(outputRequest),
      path: '/assets/asset-a/calculator-evaluations/evaluation-b/outputs?limit=20',
    },
  ];
  for (const c of cases) {
    const { reader, fetch } = setup(c.wire);
    expect(await c.run(reader)).toEqual(c.wire);
    const url = String(fetch.mock.calls[0]?.[0]);
    expect(url).toBe(`https://fleet.example/api/v1/tenants/tenant-a${c.path}`);
  }
  expect(parseOutputs(outputsWire, outputRequest).outputs[0]?.value).toBe(
    '12345678901234567890.1234567890123456789',
  );
});
test('rejects malformed shapes, scope substitution, lifecycle overflow and contradictory checkpoints', () => {
  const bad = [
    {},
    {
      ...detailWire,
      alert: { ...detailWire.alert, version: '9223372036854775808' },
    },
    { ...detailWire, definition: { ...detailWire.definition, scope: 'other' } },
    { ...detailWire, alert: { ...detailWire.alert, last_event_at_ms: '1999' } },
    {
      ...detailWire,
      alert: { ...detailWire.alert, candidate_since_ms: '2001' },
    },
    {
      ...detailWire,
      alert: {
        ...detailWire.alert,
        phase: 'pending',
        candidate_since_ms: null,
      },
    },
    {
      ...detailWire,
      alert: { ...detailWire.alert, target_asset_id: '\u0080' },
    },
  ];
  for (const w of bad)
    expect(() => parseDetail(w, detailRequest)).toThrow('response is invalid');
  expect(() =>
    parseDetail(detailWire, { ...detailRequest, revision: 2 }),
  ).toThrow();
  expect(
    parseDetail(
      {
        ...detailWire,
        alert: { ...detailWire.alert, candidate_since_ms: '2000' },
      },
      detailRequest,
    ).alert.candidate_since_ms,
  ).toBe('2000');
});
test('rejects wrong phase, repeated or unordered identities, excessive pages and non-advancing cursors', () => {
  for (const w of [
    { ...queueWire, alerts: [...queueWire.alerts, ...queueWire.alerts] },
    {
      ...queueWire,
      alerts: Array.from({ length: 21 }, (_, i) => ({
        ...queueWire.alerts[0],
        rule_id: String(i),
      })),
    },
    { ...queueWire, alerts: [], next_after: 'v1.00' },
    { ...queueWire, next_after: 'v1.00' },
    { ...queueWire, next_after: 'bad' },
  ])
    expect(() => parseQueue(w, { ...queueRequest, after: 'v1.00' })).toThrow();
  expect(() =>
    parseQueue(queueWire, { ...queueRequest, phase: 'resolved' }),
  ).toThrow();
  expect(() =>
    parseHistory(
      {
        ...historyWire,
        transitions: [...historyWire.transitions, ...historyWire.transitions],
      },
      { ...detailRequest, detail },
    ),
  ).toThrow();
  expect(() =>
    parseHistory(
      {
        ...historyWire,
        transitions: [
          {
            ...historyWire.transitions[0],
            evidence: {
              evaluation_id: 'x',
              scope_asset_id: 'wrong',
              output_index: 0,
            },
          },
        ],
      },
      { ...detailRequest, detail },
    ),
  ).toThrow();
});
test('links exact release, evaluation, clocks and immutable input references before displaying evidence', () => {
  const e = evaluationWire.evaluation;
  for (const evaluation of [
    { ...e, evaluation_id: 'other' },
    { ...e, calculator: { ...e.calculator, version: '2' } },
    { ...e, scope_asset_id: 'other' },
    { ...e, input_count: 2 },
    { ...e, window: { ...e.window, end_at_ms: '3000' } },
    { ...e, window: { ...e.window, start_at_ms: '2000' } },
    { ...e, window: { ...e.window, known_at_ms: '2999' } },
    { ...e, outcome: 'insufficient' },
  ])
    expect(() =>
      parseEvaluation({ ...evaluationWire, evaluation }, evidenceRequest),
    ).toThrow();
  for (const inputs of [
    [{ evidence_id: 'a'.repeat(64), event_at_ms: '2000' }],
    [{ evidence_id: 'a'.repeat(64), event_at_ms: '-0' }],
    [...evaluationWire.inputs, ...evaluationWire.inputs],
  ])
    expect(() =>
      parseEvaluation(
        {
          ...evaluationWire,
          evaluation: { ...e, input_count: inputs.length },
          inputs,
        },
        evidenceRequest,
      ),
    ).toThrow();
  expect(
    parseEvaluation(
      {
        ...evaluationWire,
        evaluation: { ...e, outcome: 'insufficient', output_count: 0 },
      },
      {
        ...evidenceRequest,
        transition: {
          ...evidenceRequest.transition,
          evidence: {
            ...evidenceRequest.transition.evidence,
            output_index: null,
          },
        },
      },
    ).evaluation.outcome,
  ).toBe('insufficient');
});
test('rejects substituted output slots, identities, unit/kind and non-finite decimal text', () => {
  const o = outputsWire.outputs[0];
  if (!o) throw new Error('Missing example');
  for (const patch of [
    { evaluation_id: 'other' },
    { calculator_version: '2' },
    { asset_id: 'other' },
    { property_version: 2 },
    { unit: null },
    { output_index: 1 },
    { value: 'NaN' },
    { value: 123 },
    { kind: 'float' },
  ])
    expect(() =>
      parseOutputs(
        { ...outputsWire, outputs: [{ ...o, ...patch }] },
        outputRequest,
      ),
    ).toThrow();
  expect(() =>
    parseOutputs({ ...outputsWire, outputs: [o, o] }, outputRequest),
  ).toThrow();
});
test('rejects invalid requests before network execution and retains independent denial categories', async () => {
  const { reader, fetch } = setup(queueWire);
  await expect(reader.queue({ tenant: '..' })).rejects.toMatchObject({
    kind: 'invalid-request',
  });
  await expect(
    reader.detail({ ...detailRequest, revision: 0 }),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  await expect(
    reader.queue({ ...queueRequest, after: 'bad' }),
  ).rejects.toMatchObject({ kind: 'invalid-request' });
  expect(fetch).not.toHaveBeenCalled();
  for (const [status, kind] of [
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [500, 'unavailable'],
  ] as const)
    await expect(
      setup(
        { type: 'about:blank', title: 'Denied', status },
        status,
      ).reader.evaluation(evidenceRequest),
    ).rejects.toMatchObject({ kind });
});
