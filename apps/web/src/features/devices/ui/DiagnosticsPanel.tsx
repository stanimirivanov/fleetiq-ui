import { For, Show } from 'solid-js';
import { StatusBadge } from '#shared/ui';
import type { Scope } from '../model/devices';
import { buttonClass, DevicePanel, ReadNotice } from './DevicePrimitives';
import { useDevices } from './DeviceProvider';
import { useDeviceRead } from './useDeviceRead';
export function DiagnosticsPanel(props: {
  scope: Scope;
  registrationRevision: number;
}) {
  const context = useDevices();
  const read = useDeviceRead(
    () =>
      context.actions()?.includes('protocol.manage')
        ? { scope: props.scope, revision: props.registrationRevision }
        : null,
    (r, o) => context.gateway.diagnostics(r.scope, o),
  );
  const snapshot = () => {
    const s = read.state();
    return s.kind === 'ready' ? s.value : undefined;
  };
  return (
    <DevicePanel title="Ingestion evidence">
      <p class="mb-3 text-sm text-muted">
        Connection liveness: not observed. Worker liveness: not observed.
        Silence, receipt age and a lease do not establish health.
      </p>
      <Show when={!context.actions()?.includes('protocol.manage')}>
        <p class="text-sm text-muted">Diagnostics requires protocol.manage.</p>
      </Show>
      <ReadNotice
        state={read.state()}
        retry={read.refresh}
        missing="No registered communication device was found in this tenant."
      />
      <Show when={snapshot()}>
        {(value) => (
          <div class="grid gap-4">
            <div class="flex flex-wrap items-center gap-2">
              <StatusBadge tone="unknown" label="Persisted evidence" />
              <span class="text-xs text-muted">
                Database snapshot {value().observed_at_ms} ms
              </span>
            </div>
            <p class="text-xs text-muted">
              Up to 64 recent frames, 64 output positions per frame, 128
              distinct source tuples. This is a sample, not sensor inventory.
            </p>
            <Show
              when={
                value().coverage.frames_truncated ||
                value().coverage.observations_truncated ||
                value().coverage.sources_truncated
              }
            >
              <div
                role="status"
                class="rounded border border-status-warning p-3 text-xs"
              >
                Partial coverage:{' '}
                {value().coverage.frames_truncated
                  ? 'older frames omitted; '
                  : ''}
                {value().coverage.observations_truncated
                  ? 'output positions omitted; '
                  : ''}
                {value().coverage.sources_truncated
                  ? 'additional source tuples omitted'
                  : ''}
                absence from this sample does not disprove support.
              </div>
            </Show>
            <Show when={value().frames.length === 0}>
              <p role="status" class="text-sm text-muted">
                No accepted traffic observed. This does not mean the device or
                worker failed.
              </p>
            </Show>
            <section
              aria-label="Recent accepted frames"
              class="max-h-80 overflow-auto rounded outline-offset-2 focus-within:outline-2 focus-within:outline-accent"
            >
              <div class="sticky top-0 bg-surface p-2">
                <button
                  type="button"
                  class={buttonClass}
                  onClick={read.refresh}
                >
                  Refresh diagnostics
                </button>
              </div>
              <table class="w-full text-left text-xs">
                <caption class="sr-only">Recent accepted frames</caption>
                <thead>
                  <tr>
                    <th class="p-2">Message</th>
                    <th class="p-2">Package</th>
                    <th class="p-2">Processing</th>
                    <th class="p-2">Receipt ms</th>
                    <th class="p-2">Outputs</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={value().frames}>
                    {(frame) => (
                      <tr class="border-t border-outline">
                        <td class="max-w-48 break-all p-2">
                          {frame.message_id}
                        </td>
                        <td class="p-2">
                          {frame.package_id} @ {frame.package_version}
                        </td>
                        <td class="p-2">
                          <StatusBadge
                            tone={
                              frame.processing === 'poisoned'
                                ? 'critical'
                                : frame.processing === 'expired'
                                  ? 'warning'
                                  : 'unknown'
                            }
                            label={frame.processing}
                          />
                        </td>
                        <td class="p-2">{frame.received_at_ms}</td>
                        <td class="p-2">
                          {frame.observation_count ?? 'not decoded'}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </section>
            <div>
              <h3 class="mb-2 text-sm font-semibold">Observed sources</h3>
              <Show when={value().sources.length === 0}>
                <p class="text-xs text-muted">
                  No source tuples in this inspected prefix.
                </p>
              </Show>
              <ul class="grid gap-2">
                <For each={value().sources}>
                  {(source) => (
                    <li class="break-all rounded border border-outline p-2 text-xs">
                      {source.endpoint_id} / {source.signal_id}
                      <span class="ml-2 text-muted">
                        {source.package_id} @ {source.package_version}
                      </span>
                    </li>
                  )}
                </For>
              </ul>
            </div>
            <p class="text-xs text-muted">
              Queued or poisoned replay remains outstanding even if an earlier
              decoded result exists. Output count is independent. A lease can
              outlive its worker; expiry alone is not terminal poison.
            </p>
          </div>
        )}
      </Show>
    </DevicePanel>
  );
}
