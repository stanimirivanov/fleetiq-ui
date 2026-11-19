import { createMemo, Show } from 'solid-js';
import type { ExportScope } from '../../../model/history-export';
import type { AssetDetail } from '../../../model/metadata';
import { MetadataPanel } from '../MetadataPanel';
import { useMetadataReader } from '../MetadataReaderProvider';
import type { useMetadataWorkspace } from '../useMetadataWorkspace';
import { EvidenceReadContent } from './EvidenceReadContent';
import { HistoryEvidence } from './HistoryEvidence';
import { HistoryExportActions } from './HistoryExportActions';
import { HistoryRestoreActions } from './HistoryRestoreActions';
import { HistoryWindow } from './HistoryWindow';
import { SummaryEvidence } from './SummaryEvidence';
import type { usePropertyTelemetry } from './usePropertyTelemetry';
export function HistoryReview(props: {
  readonly asset: AssetDetail;
  readonly model: ReturnType<typeof usePropertyTelemetry>;
  readonly workspace: ReturnType<typeof useMetadataWorkspace>;
}) {
  const context = useMetadataReader();
  const historyScope = createMemo<ExportScope | undefined>(
    () => {
      const selection = props.model.ready(),
        definition = props.model.definition.state();
      if (
        !selection?.property ||
        definition.kind !== 'ready' ||
        definition.value.id !== selection.property.id ||
        definition.value.version !== selection.property.version ||
        props.workspace.query()?.tenantId !== props.asset.tenantId
      )
        return;
      return {
        tenantId: props.asset.tenantId,
        assetId: props.asset.id,
        property: definition.value,
        start: selection.start,
        end: selection.end,
        ...(selection.restore ? { restore: selection.restore } : {}),
      };
    },
    undefined,
    { equals: (left, right) => JSON.stringify(left) === JSON.stringify(right) },
  );
  const owner = createMemo(() => {
    const scope = historyScope();
    const telemetry = context.reader?.telemetry;
    const actions = context.actions?.();
    if (
      !scope ||
      !telemetry ||
      context.accessBlock?.() ||
      !actions?.includes('telemetry.read') ||
      !actions.includes('operations.manage')
    )
      return;
    return { scope, telemetry, access: context.accessRevision?.() };
  });
  return (
    <Show when={props.model.ready()}>
      {(s) => (
        <MetadataPanel
          title={
            s().restore || s().resolution
              ? 'Property history review'
              : 'Hot property history'
          }
          description="Bounded event-time interpretations with exact values and accessible table parity."
        >
          <HistoryWindow
            start={s().start}
            end={s().end}
            resolution={s().resolution}
            restore={s().restore}
            apply={(start, end, resolution, restore) =>
              props.workspace.update({
                history_start: start,
                history_end: end,
                history_resolution: resolution ?? null,
                history_manifest: restore?.manifestId ?? null,
                history_generation: restore?.generation ?? null,
                history_after: null,
                interpretation: null,
              })
            }
          />
          <div class="mt-4">
            <Show
              when={s().resolution}
              fallback={
                <EvidenceReadContent
                  state={props.model.history.state()}
                  label="property history"
                  retry={props.model.refreshHistory}
                >
                  {(page) => (
                    <HistoryEvidence
                      page={page}
                      after={s().after}
                      inspect={props.model.inspect}
                      pageTo={(token) =>
                        props.workspace.update({
                          history_start: s().start,
                          history_end: s().end,
                          history_after: token,
                          interpretation: null,
                        })
                      }
                      refresh={props.model.refreshHistory}
                    />
                  )}
                </EvidenceReadContent>
              }
            >
              <EvidenceReadContent
                state={props.model.summary.state()}
                label="numeric summary"
                retry={props.model.summary.retry}
              >
                {(page) => (
                  <SummaryEvidence
                    page={page}
                    after={s().after}
                    pageTo={(token) =>
                      props.workspace.update({
                        history_after: token,
                        interpretation: null,
                      })
                    }
                    refresh={() =>
                      s().after
                        ? props.workspace.update({
                            history_after: null,
                            interpretation: null,
                          })
                        : props.model.summary.retry()
                    }
                  />
                )}
              </EvidenceReadContent>
            </Show>
          </div>
          <Show when={owner()} keyed>
            {(owned) => (
              <>
                <Show when={owned.telemetry.restores} keyed>
                  {(port) => (
                    <HistoryRestoreActions
                      tenantId={owned.scope.tenantId}
                      port={port}
                      review={(selection) =>
                        props.workspace.update({
                          history_manifest: selection.manifestId,
                          history_generation: selection.generation,
                          history_resolution: null,
                          history_after: null,
                          interpretation: null,
                        })
                      }
                    />
                  )}
                </Show>
                <Show when={owned.telemetry.exports} keyed>
                  {(port) => (
                    <HistoryExportActions scope={owned.scope} port={port} />
                  )}
                </Show>
              </>
            )}
          </Show>
        </MetadataPanel>
      )}
    </Show>
  );
}
