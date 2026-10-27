import { Show } from 'solid-js';
import type {
  AssetDetail,
  DefinitionRef,
  PropertyDefinition,
} from '../../../model/metadata';
import { MetadataPanel } from '../MetadataPanel';
import { MetadataReadContent } from '../MetadataReadContent';
import type { useMetadataWorkspace } from '../useMetadataWorkspace';
import { CurrentReading } from './CurrentReading';
import { EvidenceReadContent } from './EvidenceReadContent';
import { HistoryEvidence } from './HistoryEvidence';
import { HistoryWindow } from './HistoryWindow';
import { PropertyChooser } from './PropertyChooser';
import { ProvenanceEvidence } from './ProvenanceEvidence';
import { usePropertyTelemetry } from './usePropertyTelemetry';
export function PropertyTelemetry(props: {
  readonly asset: AssetDetail;
  readonly properties: readonly DefinitionRef[];
  readonly workspace: ReturnType<typeof useMetadataWorkspace>;
}) {
  const model = usePropertyTelemetry(props);
  return (
    <div class="grid min-w-0 gap-4">
      <MetadataPanel
        title="Property readings"
        description="Committed current evidence is independent of metadata review cutoffs. Readings require separate telemetry.read permission."
      >
        <PropertyChooser
          properties={props.properties}
          selected={model.selected()}
          choose={(p) =>
            props.workspace.update({
              property: p.id,
              property_version: String(p.version),
              history_after: null,
              interpretation: null,
            })
          }
        />
        <Show
          when={model.selection().kind !== 'invalid'}
          fallback={
            <p role="alert" class="mt-3 text-xs text-status-critical">
              Property or history URL context is invalid. No telemetry requests
              were sent.
            </p>
          }
        >
          <div class="mt-4">
            <MetadataReadContent
              state={model.definition.state()}
              label="selected property definition"
              retry={model.definition.retry}
            >
              {(property: PropertyDefinition) => (
                <div class="grid gap-3">
                  <p class="text-sm font-semibold">
                    {property.name} · {property.valueKind} · v{property.version}
                  </p>
                  <EvidenceReadContent
                    state={model.current.state()}
                    label="current reading"
                    retry={model.current.retry}
                  >
                    {(snapshot) => (
                      <CurrentReading
                        snapshot={snapshot}
                        inspect={model.inspect}
                        refresh={model.current.retry}
                      />
                    )}
                  </EvidenceReadContent>
                </div>
              )}
            </MetadataReadContent>
          </div>
        </Show>
      </MetadataPanel>
      <Show when={model.ready()}>
        {(s) => (
          <MetadataPanel
            title="Hot property history"
            description="Bounded event-time interpretations with exact values and accessible table parity."
          >
            <HistoryWindow
              start={s().start}
              end={s().end}
              apply={(start, end) =>
                props.workspace.update({
                  history_start: start,
                  history_end: end,
                  history_after: null,
                  interpretation: null,
                })
              }
            />
            <div class="mt-4">
              <EvidenceReadContent
                state={model.history.state()}
                label="property history"
                retry={model.history.retry}
              >
                {(page) => (
                  <HistoryEvidence
                    page={page}
                    after={s().after}
                    inspect={model.inspect}
                    pageTo={(token) =>
                      props.workspace.update({
                        history_start: s().start,
                        history_end: s().end,
                        history_after: token,
                        interpretation: null,
                      })
                    }
                    refresh={model.history.retry}
                  />
                )}
              </EvidenceReadContent>
            </div>
          </MetadataPanel>
        )}
      </Show>
      <Show when={model.ready()?.interpretation}>
        <MetadataPanel title="Interpretation provenance">
          <EvidenceReadContent
            state={model.provenance.state()}
            label="interpretation provenance"
            retry={model.provenance.retry}
          >
            {(change) => <ProvenanceEvidence change={change} />}
          </EvidenceReadContent>
        </MetadataPanel>
      </Show>
    </div>
  );
}
