import { For } from 'solid-js';
import { TextLink } from '#shared/ui';
import type { FleetPoint } from '../../model/fleet';
import {
  clearSnapshotSelection,
  metadataHref,
} from '../../model/metadata-query';
import { evidenceTime } from '../../model/property-evidence';
export function CoordinateEvidence(props: {
  readonly point: FleetPoint;
  readonly assetId: string;
  readonly search: string;
  readonly evaluatedAt: string;
}) {
  const href = (property: string, version: number, interpretation: string) =>
    metadataHref(`/assets/${encodeURIComponent(props.assetId)}`, props.search, {
      ...clearSnapshotSelection(),
      property,
      property_version: String(version),
      interpretation,
      asset: null,
      history_after: null,
      ...(Number.isSafeInteger(Number(props.evaluatedAt))
        ? { effective_at_ms: props.evaluatedAt, known_at_ms: props.evaluatedAt }
        : {}),
    });
  return (
    <>
      <p class="break-all font-mono text-sm">
        {props.point.latitude}, {props.point.longitude}
      </p>
      <p class="text-xs text-muted">
        {props.point.quality} · {props.point.freshness} at snapshot evaluation
      </p>
      <For each={[props.point.latitudeChange, props.point.longitudeChange]}>
        {(change) => (
          <section class="grid gap-1 border-t border-outline pt-3 text-xs">
            <h4 class="font-semibold">
              {change.propertyId} v{change.propertyVersion}
            </h4>
            <p>Observed {evidenceTime(change.eventAt)}</p>
            <p class="break-all">
              Device {change.source.deviceId} / {change.source.endpointId}
            </p>
            <p class="break-all">
              Message {change.source.messageId} · output{' '}
              {change.source.outputIndex}
            </p>
            <p class="break-all">Signal {change.source.signalId}</p>
            <p class="break-all">
              Decoder {change.source.packageId}@{change.source.packageVersion}
            </p>
            <TextLink
              href={href(
                change.propertyId,
                change.propertyVersion,
                change.interpretation,
              )}
            >
              Inspect reading and provenance
            </TextLink>
          </section>
        )}
      </For>
    </>
  );
}
