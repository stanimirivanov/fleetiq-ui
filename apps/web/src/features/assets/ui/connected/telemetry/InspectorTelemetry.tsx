import { Show } from 'solid-js';
import type { AssetDetail } from '../../../model/metadata';
import { MetadataPanel } from '../MetadataPanel';
import { MetadataReadContent } from '../MetadataReadContent';
import { useMetadataReader } from '../MetadataReaderProvider';
import { useMetadataRead } from '../useMetadataRead';
import type { useMetadataWorkspace } from '../useMetadataWorkspace';
import { PropertyTelemetry } from './PropertyTelemetry';
/** Discover declared references once; only the selected property fans into telemetry. */
export function InspectorTelemetry(props: {
  readonly asset: AssetDetail;
  readonly workspace: ReturnType<typeof useMetadataWorkspace>;
}) {
  const context = useMetadataReader();
  const configured = () => Boolean(context.reader?.telemetry);
  const type = useMetadataRead(
    () =>
      configured()
        ? { tenantId: props.asset.tenantId, ...props.asset.assetType }
        : null,
    (reader, query, options) => reader.getAssetType(query, options),
  );
  return (
    <Show
      when={configured()}
      fallback={
        <MetadataPanel title="Property readings">
          <p class="text-xs text-muted">Telemetry reader is not configured.</p>
        </MetadataPanel>
      }
    >
      <MetadataReadContent
        state={type.state()}
        label="property catalogue"
        retry={type.retry}
      >
        {(definition) =>
          definition.supportedProperties.length ? (
            <PropertyTelemetry
              asset={props.asset}
              properties={definition.supportedProperties}
              workspace={props.workspace}
            />
          ) : (
            <MetadataPanel title="Property readings">
              <p role="status" class="text-xs text-muted">
                This asset type declares no properties. No telemetry lookup is
                inferred.
              </p>
            </MetadataPanel>
          )
        }
      </MetadataReadContent>
    </Show>
  );
}
