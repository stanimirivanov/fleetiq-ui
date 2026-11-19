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
import { HistoryReview } from './HistoryReview';
import { LiveReading } from './LiveReading';
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
              history_manifest: null,
              history_generation: null,
              history_resolution: null,
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
                  <Show when={model.live.available()}>
                    <LiveReading
                      live={model.live}
                      inspect={(token) => model.inspect(token, 'current')}
                    />
                  </Show>
                  <Show when={!model.live.enabled() && !model.live.blocked()}>
                    <EvidenceReadContent
                      state={model.current.state()}
                      label="current reading"
                      retry={model.current.retry}
                    >
                      {(snapshot) => (
                        <CurrentReading
                          snapshot={snapshot}
                          inspect={(token) => model.inspect(token, 'current')}
                          refresh={model.current.retry}
                        />
                      )}
                    </EvidenceReadContent>
                  </Show>
                </div>
              )}
            </MetadataReadContent>
          </div>
        </Show>
      </MetadataPanel>
      <HistoryReview
        model={model}
        workspace={props.workspace}
        asset={props.asset}
      />
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
