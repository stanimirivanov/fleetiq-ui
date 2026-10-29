import type { Page } from '@playwright/test';
import type { BindingDraft } from '../../web/src/features/assets/model/binding-authoring';
import { installCommissioningApi } from './commissioning-api';
/** Immutable revision history plus exact bitemporal source/target snapshots, never inventory inference. */
export async function installBindingApi(page: Page) {
  await installCommissioningApi(page);
  const lineages = new Map<
    string,
    { revision: string; recorded_at_ms: number; draft: BindingDraft }[]
  >();
  const commands: {
      path: string;
      payload: BindingDraft;
      csrf: string | undefined;
    }[] = [],
    reads: string[] = [];
  let clock = 20000,
    mode: 'ok' | 'lost' | 'denied' | 'conflict' = 'ok',
    observations = true;
  await page.route('**/api/v1/tenants/tenant-a/**', async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      p = url.pathname.split('/').filter(Boolean).slice(4);
    const reply = (status: number, body: unknown) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'cache-control': 'no-store' },
        body: JSON.stringify(body),
      });
    const problem = (status: number) =>
      reply(status, { type: 'about:blank', title: 'Command rejected', status });
    const fact = (
      id: string,
      e: { revision: string; recorded_at_ms: number; draft: BindingDraft },
    ) => ({
      id,
      tenant_id: 'tenant-a',
      revision: e.revision,
      recorded_at_ms: e.recorded_at_ms,
      ...e.draft,
    });
    if (
      req.method() === 'POST' &&
      p[0] === 'signal-bindings' &&
      p[2] === 'revisions'
    ) {
      const id = decodeURIComponent(p[1] ?? ''),
        revision = p[3] ?? '',
        payload = req.postDataJSON() as BindingDraft,
        fail = mode;
      mode = 'ok';
      commands.push({
        path: url.pathname,
        payload,
        csrf: req.headers()['x-fleetiq-csrf'],
      });
      if (fail === 'denied') return problem(403);
      if (fail === 'conflict') return problem(409);
      const history = lineages.get(id) ?? [],
        old = history.find((e) => e.revision === revision);
      if (
        (old && JSON.stringify(old.draft) !== JSON.stringify(payload)) ||
        (!old &&
          BigInt(revision) !== BigInt(history.at(-1)?.revision ?? '0') + 1n)
      )
        return problem(409);
      if (
        payload.source.device_asset_id !== 'gateway-1' ||
        !['can-primary', 'can-other'].includes(payload.source.endpoint_id) ||
        payload.target.asset_id !== 'power-system-1' ||
        !(
          (payload.target.property.id === 'electrical.voltage' &&
            payload.target.property.version === 3) ||
          (payload.target.property.id === 'thermal.temperature' &&
            payload.target.property.version === 1)
        )
      )
        return problem(404);
      const recorded = old?.recorded_at_ms ?? ++clock;
      if (!old) {
        history.push({ revision, recorded_at_ms: recorded, draft: payload });
        lineages.set(id, history);
      }
      if (fail === 'lost') return route.abort('failed');
      return reply(old ? 200 : 201, {
        outcome: old ? 'already_appended' : 'appended',
        id,
        revision,
        recorded_by: 'operator-a',
        recorded_at_ms: recorded,
      });
    }
    if (req.method() !== 'GET') return route.fallback();
    reads.push(url.pathname + url.search);
    if (p[0] === 'assets' && p[1] === 'gateway-1' && p[2] === 'device')
      return reply(200, {
        tenant_id: 'tenant-a',
        asset_id: 'gateway-1',
        endpoints: [
          { id: 'can-primary', kind: 'bus.can', name: 'Primary CAN' },
          { id: 'can-other', kind: 'bus.can', name: 'Other CAN' },
        ],
      });
    if (
      p[0] === 'assets' &&
      p[1] === 'gateway-1' &&
      p[2] === 'ingestion-diagnostics'
    )
      return reply(200, {
        observed_at_ms: 19000,
        connection_liveness: 'not_observed',
        worker_liveness: 'not_observed',
        coverage: {
          frame_limit: 64,
          output_limit_per_frame: 64,
          source_limit: 128,
          frames_truncated: observations,
          observations_truncated: false,
          sources_truncated: false,
        },
        frames: observations
          ? Array.from({ length: 64 }, (_, i) => ({
              message_id: `frame-${64 - i}`,
              package_id: 'custom.protocol',
              package_version: '1',
              received_at_ms: 19000 - i,
              processing: 'decoded',
              observation_count: 2,
            }))
          : [],
        sources: observations
          ? ['can-primary', 'can-other'].map((endpoint_id) => ({
              endpoint_id,
              signal_id: 'bus.voltage',
              package_id: 'custom.protocol',
              package_version: '1',
            }))
          : [],
      });
    if (p[0] === 'assets' && p[1] === 'power-system-1' && p.length === 2)
      return reply(200, {
        id: 'power-system-1',
        tenant_id: 'tenant-a',
        name: 'Power system',
        asset_type: { id: 'generic.power-system', version: 2 },
        external_identifiers: [],
      });
    if (
      p[0] === 'asset-types' &&
      p[1] === 'generic.power-system' &&
      p[2] === 'versions'
    )
      return reply(200, {
        id: 'generic.power-system',
        version: 2,
        name: 'Power system',
        supported_properties: [
          { id: 'electrical.voltage', version: 3 },
          { id: 'thermal.temperature', version: 1 },
        ],
      });
    if (p[0] === 'properties' && p[2] === 'versions')
      return reply(200, {
        id: decodeURIComponent(p[1] ?? ''),
        version: Number(p[3]),
        name: p[1] === 'electrical.voltage' ? 'Voltage' : 'Temperature',
        value_kind: 'decimal',
        canonical_unit: p[1] === 'electrical.voltage' ? 'V' : 'Cel',
      });
    if (p[0] === 'signal-bindings' && p[2] === 'revisions') {
      const id = decodeURIComponent(p[1] ?? ''),
        e = lineages.get(id)?.find((e) => e.revision === p[3]);
      return e ? reply(200, fact(id, e)) : problem(404);
    }
    if (
      (p[0] === 'assets' && p[2] === 'signal-bindings') ||
      (p[0] === 'signal-bindings' && p.length === 1)
    ) {
      const effective = Number(url.searchParams.get('effective_at_ms')),
        known = Number(url.searchParams.get('known_at_ms'));
      const source = {
        device_asset_id: url.searchParams.get('device_asset_id') ?? '',
        endpoint_id: url.searchParams.get('endpoint_id') ?? '',
        signal_id: url.searchParams.get('signal_id') ?? '',
      };
      const bindings = [...lineages].flatMap(([id, history]) => {
        const e = history.filter((e) => e.recorded_at_ms <= known).at(-1);
        if (
          !e ||
          effective < e.draft.effective_interval.start_ms ||
          (e.draft.effective_interval.end_ms !== null &&
            effective >= e.draft.effective_interval.end_ms)
        )
          return [];
        if (
          p[0] === 'assets'
            ? e.draft.target.asset_id !== p[1]
            : JSON.stringify(e.draft.source) !== JSON.stringify(source)
        )
          return [];
        return [fact(id, e)];
      });
      return reply(200, {
        ...(p[0] === 'assets' ? { asset_id: p[1] } : { source }),
        effective_at_ms: effective,
        known_at_ms: known,
        bindings,
        next_after: null,
      });
    }
    return route.fallback();
  });
  return {
    commands,
    reads,
    failNext: (v: typeof mode) => {
      mode = v;
    },
    emptyObservations: () => {
      observations = false;
    },
  };
}
