import { useLocation } from '@solidjs/router';
import { createEffect, createMemo, onCleanup } from 'solid-js';
import { RequestFailure } from '#shared/model';
import { readEvidenceQuery } from '../../../model/evidence-query';
import type { SummaryRequest } from '../../../model/history-review-types';
import type { AssetDetail, DefinitionRef } from '../../../model/metadata';
import type {
  HistoryRequest,
  PropertyRequest,
} from '../../../model/property-evidence';
import { useMetadataReader } from '../MetadataReaderProvider';
import { useMetadataRead } from '../useMetadataRead';
import type { useMetadataWorkspace } from '../useMetadataWorkspace';
import { usePropertyLive } from './usePropertyLive';
import { useTelemetryRead } from './useTelemetryRead';
/** Request ownership, scope and cancellation stay outside panel presentation. */
export function usePropertyTelemetry(props: {
  readonly asset: AssetDetail;
  readonly properties: readonly DefinitionRef[];
  readonly workspace: ReturnType<typeof useMetadataWorkspace>;
}) {
  const location = useLocation();
  const context = useMetadataReader();
  const selection = createMemo(() =>
    readEvidenceQuery(
      location.search,
      props.properties,
      props.workspace.query()?.effectiveAtMs ?? 0,
    ),
  );
  const selected = () => {
    const s = selection();
    return s.kind === 'ready' ? s.property : null;
  };
  const definition = useMetadataRead(
    () => {
      const p = selected();
      return p && props.workspace.query()?.tenantId === props.asset.tenantId
        ? { tenantId: props.asset.tenantId, ...p }
        : null;
    },
    (reader, query, options) => reader.getProperty(query, options),
  );
  const request = createMemo<PropertyRequest | null>(() => {
    const d = definition.state();
    return d.kind === 'ready'
      ? {
          tenantId: props.asset.tenantId,
          assetId: props.asset.id,
          property: d.value,
        }
      : null;
  });
  const live = usePropertyLive(request);
  const current = useTelemetryRead(request, (reader, query, options) =>
    reader.current(query, options),
  );
  const historyRequest = createMemo<HistoryRequest | null>(() => {
    const s = selection(),
      p = request();
    return p && s.kind === 'ready' && !s.resolution
      ? {
          ...p,
          start: s.start,
          end: s.end,
          limit: 50,
          ...(s.restore ? { restore: s.restore } : {}),
          ...(s.after === undefined ? {} : { after: s.after }),
        }
      : null;
  });
  const history = useTelemetryRead(historyRequest, (reader, query, options) =>
    reader.history(query, options),
  );
  const summaryRequest = createMemo<SummaryRequest | null>(() => {
    const s = selection(),
      p = request();
    return p && s.kind === 'ready' && s.resolution
      ? {
          ...p,
          start: s.start,
          end: s.end,
          limit: 50,
          resolution: s.resolution,
          ...(s.restore ? { restore: s.restore } : {}),
          ...(s.after ? { after: s.after } : {}),
        }
      : null;
  });
  const summary = useTelemetryRead(summaryRequest, (reader, query, options) => {
    if (!reader.summary) throw new RequestFailure('unavailable');
    return reader.summary(query, options);
  });
  const provenanceRequest = () => {
    const s = selection();
    const p = request();
    const actions = context.actions?.();
    if (
      !p ||
      s.kind !== 'ready' ||
      !s.interpretation ||
      props.workspace.query()?.tenantId !== p.tenantId ||
      (actions && !actions.includes('telemetry.read'))
    )
      return null;
    return {
      ...p,
      interpretation: s.interpretation,
      ...(s.restore && s.interpretationSource !== 'current'
        ? { restore: s.restore }
        : {}),
    };
  };
  const provenance = useTelemetryRead(
    provenanceRequest,
    (reader, query, options) => reader.interpretation(query, options),
  );
  // The wire receipt has no expiry timestamp. Revalidate while selected
  // evidence is visible, stopping on expiry, denial or scope change.
  createEffect(() => {
    if (!provenanceRequest()?.restore || provenance.state().kind !== 'ready')
      return;
    const timeout = setTimeout(provenance.retry, 30_000);
    onCleanup(() => clearTimeout(timeout));
  });
  const refreshHistory = () => {
    history.retry();
    if (provenanceRequest()?.restore) provenance.retry();
  };
  const inspect = (interpretation: string, source?: 'current') => {
    const p = selected();
    if (p)
      props.workspace.update({
        property: p.id,
        property_version: String(p.version),
        interpretation,
        interpretation_source: source ?? null,
      });
  };
  const ready = () => {
    if (live.blocked()) return undefined;
    if (
      ['unauthorized', 'forbidden', 'not-found'].includes(
        live.state()?.failure ?? '',
      )
    )
      return undefined;
    const s = selection();
    return s.kind === 'ready' ? s : undefined;
  };

  return {
    selection,
    selected,
    definition,
    current,
    live,
    history,
    refreshHistory,
    summary,
    provenance,
    inspect,
    ready,
  };
}
