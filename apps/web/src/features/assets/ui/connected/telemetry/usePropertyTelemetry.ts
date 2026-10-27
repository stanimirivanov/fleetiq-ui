import { useLocation } from '@solidjs/router';
import { createMemo } from 'solid-js';
import { readEvidenceQuery } from '../../../model/evidence-query';
import type { AssetDetail, DefinitionRef } from '../../../model/metadata';
import type {
  HistoryRequest,
  PropertyRequest,
} from '../../../model/property-evidence';
import { useMetadataRead } from '../useMetadataRead';
import type { useMetadataWorkspace } from '../useMetadataWorkspace';
import { useTelemetryRead } from './useTelemetryRead';
/** Request ownership, scope and cancellation stay outside panel presentation. */
export function usePropertyTelemetry(props: {
  readonly asset: AssetDetail;
  readonly properties: readonly DefinitionRef[];
  readonly workspace: ReturnType<typeof useMetadataWorkspace>;
}) {
  const location = useLocation();
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
  const current = useTelemetryRead(request, (reader, query, options) =>
    reader.current(query, options),
  );
  const historyRequest = createMemo<HistoryRequest | null>(() => {
    const s = selection(),
      p = request();
    return p && s.kind === 'ready'
      ? {
          ...p,
          start: s.start,
          end: s.end,
          limit: 50,
          ...(s.after === undefined ? {} : { after: s.after }),
        }
      : null;
  });
  const history = useTelemetryRead(historyRequest, (reader, query, options) =>
    reader.history(query, options),
  );
  const provenance = useTelemetryRead(
    () => {
      const s = selection(),
        p = request();
      return p && s.kind === 'ready' && s.interpretation
        ? { ...p, interpretation: s.interpretation }
        : null;
    },
    (reader, query, options) => reader.interpretation(query, options),
  );
  const inspect = (interpretation: string) => {
    const p = selected();
    if (p)
      props.workspace.update({
        property: p.id,
        property_version: String(p.version),
        interpretation,
      });
  };
  const ready = () => {
    const s = selection();
    return s.kind === 'ready' ? s : undefined;
  };

  return {
    selection,
    selected,
    definition,
    current,
    history,
    provenance,
    inspect,
    ready,
  };
}
