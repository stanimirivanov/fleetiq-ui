import { Show } from 'solid-js';
import { MetadataPanel } from '../MetadataPanel';
import type { useMetadataWorkspace } from '../useMetadataWorkspace';
import { EvidenceReadContent } from './EvidenceReadContent';
import { HistoryEvidence } from './HistoryEvidence';
import { HistoryWindow } from './HistoryWindow';
import { SummaryEvidence } from './SummaryEvidence';
import type { usePropertyTelemetry } from './usePropertyTelemetry';
export function HistoryReview(props: {
  readonly model: ReturnType<typeof usePropertyTelemetry>;
  readonly workspace: ReturnType<typeof useMetadataWorkspace>;
}) {
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
                  retry={props.model.history.retry}
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
                      refresh={props.model.history.retry}
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
        </MetadataPanel>
      )}
    </Show>
  );
}
