import { A } from '@solidjs/router';
import { StatusBadge, type StatusTone, TextLink } from '#shared/ui';
import type { DemoInspector } from '../../demo/inspector-fixture';
import { registrySampleHref } from '../../model/asset-preview-url';
import { formatSampleTime } from './inspector-format';

function conditionTone(
  value: DemoInspector['operations']['condition'],
): StatusTone {
  return value === 'attention' ? 'warning' : value;
}

function connectivityTone(
  value: DemoInspector['operations']['connectivity'],
): StatusTone {
  return value === 'connected'
    ? 'nominal'
    : value === 'disconnected'
      ? 'warning'
      : 'unknown';
}

function freshnessTone(
  value: DemoInspector['operations']['freshness'],
): StatusTone {
  return value === 'current'
    ? 'nominal'
    : value === 'stale'
      ? 'warning'
      : 'unknown';
}

function statusLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Identity and independent sample condition, connection, and evidence states. */
export function InspectorHeader(props: { readonly inspector: DemoInspector }) {
  return (
    <header class="grid min-w-0 gap-3">
      <nav aria-label="Breadcrumb" class="text-xs text-muted">
        <A
          href="/assets?preview=sample"
          class="font-medium text-accent underline underline-offset-2"
        >
          Assets
        </A>
        <span aria-hidden="true" class="mx-2">
          /
        </span>
        <span>{props.inspector.asset.name}</span>
      </nav>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            Asset inspector · Sample data
          </p>
          <h1
            id="page-title"
            class="mt-1 text-2xl font-semibold tracking-tight sm:text-[1.7rem]"
          >
            {props.inspector.asset.name}
          </h1>
          <p class="mt-1 text-xs text-muted">
            <span class="font-mono">{props.inspector.asset.id}</span>
            <span class="mx-2" aria-hidden="true">
              ·
            </span>
            {props.inspector.asset.assetType.id}
            {props.inspector.externalIdentifiers[0] && (
              <>
                <span class="mx-2" aria-hidden="true">
                  ·
                </span>
                External ID: {props.inspector.externalIdentifiers[0].value}
              </>
            )}
            <span class="mx-2" aria-hidden="true">
              ·
            </span>
            {props.inspector.operations.siteLabel}
          </p>
        </div>
        <div class="grid justify-items-start gap-2 sm:justify-items-end">
          <p class="rounded-md border border-sample-outline bg-sample-surface px-3 py-1.5 text-xs text-muted">
            Fixed sample snapshot · {formatSampleTime(props.inspector.asOf)}
          </p>
          <TextLink href={registrySampleHref(props.inspector.asset.id)}>
            Review registry mapping
          </TextLink>
        </div>
      </div>
      <div class="grid gap-2 sm:grid-cols-3">
        <div class="rounded-lg border border-sample-outline bg-sample-surface px-3 py-2">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Asset condition
          </p>
          <div class="mt-1">
            <StatusBadge
              label={statusLabel(props.inspector.operations.condition)}
              tone={conditionTone(props.inspector.operations.condition)}
            />
          </div>
        </div>
        <div class="rounded-lg border border-sample-outline bg-sample-surface px-3 py-2">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Device connection
          </p>
          <div class="mt-1">
            <StatusBadge
              label={statusLabel(props.inspector.operations.connectivity)}
              tone={connectivityTone(props.inspector.operations.connectivity)}
            />
          </div>
        </div>
        <div class="rounded-lg border border-sample-outline bg-sample-surface px-3 py-2">
          <p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Telemetry freshness
          </p>
          <div class="mt-1">
            <StatusBadge
              label={statusLabel(props.inspector.operations.freshness)}
              tone={freshnessTone(props.inspector.operations.freshness)}
            />
          </div>
          <p class="mt-1 text-[11px] text-muted">
            {props.inspector.operations.lastObservationAt
              ? 'Last event ' +
                formatSampleTime(props.inspector.operations.lastObservationAt)
              : 'No attributed observation in this snapshot'}
          </p>
        </div>
      </div>
    </header>
  );
}
