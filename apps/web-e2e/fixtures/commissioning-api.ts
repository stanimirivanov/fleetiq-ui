import type { Page } from '@playwright/test';
import type {
  AssetDraft,
  RelationshipDraft,
} from '../../web/src/features/assets/model/commissioning';
import { catalogueRecords } from './contract-examples';
/** Stateful contract fixture: immutable receipts, strict revisions and explicit failure injection. */
export async function installCommissioningApi(page: Page) {
  const assets = new Map<string, AssetDraft & { tenant_id: string }>(
    catalogueRecords.map((a) => [a.id, { ...a }]),
  );
  const registrations = new Map<
    string,
    { draft: AssetDraft; recordedAt: number }
  >();
  const edges = new Map<
    string,
    { revision: string; draft: RelationshipDraft; recordedAt: number }[]
  >();
  const commands: {
    path: string;
    payload: unknown;
    csrf: string | undefined;
  }[] = [];
  const reads: string[] = [];
  let clock = 10000,
    mode: 'ok' | 'denied' | 'conflict' | 'lost' = 'ok';
  await page.route('**/api/v1/tenants/tenant-a/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      parts = url.pathname.split('/').filter(Boolean).slice(4);
    const reply = (status: number, body: unknown) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'cache-control': 'no-store' },
        body: JSON.stringify(body),
      });
    if (request.method() === 'POST') {
      const payload = request.postDataJSON();
      commands.push({
        path: url.pathname,
        payload,
        csrf: request.headers()['x-fleetiq-csrf'],
      });
      const fail = mode;
      mode = 'ok';
      if (fail === 'denied' || fail === 'conflict')
        return reply(fail === 'denied' ? 403 : 409, {
          type: 'about:blank',
          title: fail,
          status: fail === 'denied' ? 403 : 409,
        });
      if (parts[0] === 'assets' && parts.length === 1) {
        const draft = payload as AssetDraft,
          old = registrations.get(draft.id);
        if (old && JSON.stringify(old.draft) !== JSON.stringify(draft))
          return reply(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
          });
        const recordedAt = old?.recordedAt ?? ++clock;
        registrations.set(draft.id, { draft, recordedAt });
        assets.set(draft.id, { ...draft, tenant_id: 'tenant-a' });
        if (fail === 'lost') return route.abort('failed');
        return reply(old ? 200 : 201, {
          outcome: old ? 'already_registered' : 'registered',
          registered_by: 'operator-a',
          recorded_at_ms: recordedAt,
        });
      }
      if (parts[0] === 'relationships' && parts[2] === 'revisions') {
        const id = decodeURIComponent(parts[1] ?? ''),
          revision = parts[3] ?? '',
          draft = payload as RelationshipDraft;
        const lineage = edges.get(id) ?? [],
          old = lineage.find((e) => e.revision === revision);
        if (
          (old && JSON.stringify(old.draft) !== JSON.stringify(draft)) ||
          (!old &&
            BigInt(revision) !== BigInt(lineage.at(-1)?.revision ?? '0') + 1n)
        )
          return reply(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
          });
        const recordedAt = old?.recordedAt ?? ++clock;
        if (!old) {
          lineage.push({ revision, draft, recordedAt });
          edges.set(id, lineage);
        }
        if (fail === 'lost') return route.abort('failed');
        return reply(old ? 200 : 201, {
          outcome: old ? 'already_appended' : 'appended',
          id,
          revision,
          recorded_by: 'operator-a',
          recorded_at_ms: recordedAt,
        });
      }
    }
    reads.push(url.pathname + url.search);
    if (
      (parts[0] === 'asset-types' || parts[0] === 'relationship-types') &&
      parts.length === 1
    ) {
      const asset = parts[0] === 'asset-types',
        id = asset ? 'equipment' : 'physical.contains',
        name = asset ? 'Equipment' : 'Contains';
      const versions =
        asset && !url.searchParams.has('after_id') ? [1, 2] : [10];
      return reply(200, {
        definitions: versions.map((version) => ({ id, version, name })),
        next_after: asset && versions[0] === 1 ? { id, version: 2 } : null,
      });
    }
    if (parts[0] === 'assets' && parts.length === 1) {
      const limit = Number(url.searchParams.get('limit') ?? 50),
        after = url.searchParams.get('after') ?? '';
      const list = [...assets.values()]
        .sort((a, b) => (a.id < b.id ? -1 : 1))
        .filter((a) => a.id > after);
      return reply(200, {
        assets: list
          .slice(0, limit)
          .map(({ external_identifiers: _, ...a }) => a),
        next_after: list.length > limit ? list[limit - 1]?.id : null,
      });
    }
    if (
      parts[0] === 'assets' &&
      parts.length === 2 &&
      assets.has(decodeURIComponent(parts[1] ?? ''))
    )
      return reply(200, assets.get(decodeURIComponent(parts[1] ?? '')));
    if (
      parts[0] === 'asset-types' &&
      parts[1] === 'equipment' &&
      parts[2] === 'versions'
    )
      return reply(200, {
        id: 'equipment',
        version: Number(parts[3]),
        name: 'Equipment',
        supported_properties: [],
      });
    if (
      parts[0] === 'relationship-types' &&
      parts[1] === 'physical.contains' &&
      parts[2] === 'versions'
    )
      return reply(200, {
        id: 'physical.contains',
        version: Number(parts[3]),
        name: 'Contains',
      });
    if (parts[0] === 'assets' && parts[2] === 'relationships') {
      const known = Number(url.searchParams.get('known_at_ms')),
        effective = Number(url.searchParams.get('effective_at_ms')),
        asset = decodeURIComponent(parts[1] ?? '');
      const relationships = [...edges].flatMap(([id, lineage]) => {
        const e = lineage.filter((e) => e.recordedAt <= known).at(-1);
        if (
          !e ||
          e.draft.effective_interval.start_ms > effective ||
          (e.draft.effective_interval.end_ms !== null &&
            e.draft.effective_interval.end_ms <= effective) ||
          ![e.draft.source_asset_id, e.draft.target_asset_id].includes(asset)
        )
          return [];
        return [
          {
            id,
            tenant_id: 'tenant-a',
            revision: e.revision,
            ...e.draft,
            recorded_at_ms: e.recordedAt,
          },
        ];
      });
      return reply(200, {
        asset_id: asset,
        effective_at_ms: effective,
        known_at_ms: known,
        relationships,
        next_after: null,
      });
    }
    return route.fallback();
  });
  return {
    commands,
    reads,
    failNext: (value: typeof mode) => {
      mode = value;
    },
  };
}
