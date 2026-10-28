import { For } from 'solid-js';
import {
  evidenceTime,
  evidenceValue,
  type PropertyEvidence,
} from '../../../model/property-evidence';
/** Original interpretation evidence, never rebound to today's metadata. */
export function ProvenanceEvidence(props: {
  readonly change: PropertyEvidence;
}) {
  const rows = () => [
    [
      'Exact property',
      `${props.change.propertyId} v${props.change.propertyVersion}`,
    ],
    ['Tenant / asset', `${props.change.tenantId} / ${props.change.assetId}`],
    [
      'Value / quality',
      `${evidenceValue(props.change.value)} ${props.change.unit ?? ''} · ${props.change.quality}`,
    ],
    [
      'Selected event',
      `${evidenceTime(props.change.eventAt)} (${props.change.eventTimeBasis})`,
    ],
    ['Received', evidenceTime(props.change.source.receivedAt)],
    [
      'Device recorded',
      props.change.source.recordedAt === null
        ? 'Not provided'
        : evidenceTime(props.change.source.recordedAt),
    ],
    [
      'Original binding',
      `${props.change.bindingId} · revision ${props.change.bindingRevision}`,
    ],
    ['First effective cutoff', props.change.effectiveAt],
    ['First knowledge cutoff', props.change.knownAt],
    [
      'Source',
      `${props.change.source.deviceId} / ${props.change.source.endpointId} / ${props.change.source.signalId}`,
    ],
    [
      'Decoder',
      `${props.change.source.packageId} / ${props.change.source.packageVersion}`,
    ],
    [
      'Message / output',
      `${props.change.source.messageId} / ${props.change.source.outputIndex}`,
    ],
  ];
  return (
    <div class="grid gap-3">
      <dl class="grid gap-3 text-xs">
        <For each={rows()}>
          {(row) => (
            <div class="grid gap-1 sm:grid-cols-[minmax(7rem,0.4fr)_minmax(0,1fr)]">
              <dt class="text-muted">{row[0]}</dt>
              <dd class="break-all font-mono">{row[1]}</dd>
            </div>
          )}
        </For>
      </dl>
      <details class="rounded-md border border-outline p-2">
        <summary class="cursor-pointer text-xs text-accent">
          Opaque interpretation reference
        </summary>
        <code class="block break-all text-xs">
          {props.change.interpretation}
        </code>
      </details>
      <p class="text-xs text-muted">
        Metadata corrections create new interpretations. This evidence is
        immutable; it is not re-resolved against the current review cutoffs.
      </p>
    </div>
  );
}
