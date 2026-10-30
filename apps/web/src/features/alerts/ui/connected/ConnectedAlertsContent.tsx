import { useLocation, useNavigate } from '@solidjs/router';
import { createMemo, For, Show } from 'solid-js';
import { TextLink } from '#shared/ui';
import {
  alertHref,
  alertQuery,
  alertTenantHref,
  clearSelection,
} from '../../model/alert-query';
import { phases } from '../../model/connected-alerts';
import { AlertRuleConfiguration } from '../AlertRuleConfiguration';
import { useAlertContext } from './AlertProvider';
import { AlertReadPanel } from './AlertReadPanel';
import { ConnectedAlertDetail } from './ConnectedAlertDetail';
import { useAlertRead } from './useAlertRead';
export function ConnectedAlertsContent() {
  const location = useLocation(),
    navigate = useNavigate(),
    context = useAlertContext();
  const q = createMemo(() => alertQuery(location.search));
  const request = createMemo(() =>
    q().invalid || !q().tenant
      ? null
      : { tenant: q().tenant, phase: q().phase, after: q().after },
  );
  const queue = useAlertRead(request, (reader, r, o) => reader.queue(r, o));
  return (
    <div class="grid min-w-0 gap-4">
      <p class="text-sm text-muted">
        Read-only lifecycle observations. Each page is bounded to 20 records;
        traversal is not a snapshot. Missing or unusable evidence is unknown,
        never proof of a healthy condition.
      </p>
      {context.tenantControl?.(q().tenant)}
      <label class="grid max-w-xs gap-1 text-sm">
        Phase filter
        <select
          class="rounded border border-border bg-surface p-2"
          value={q().phase ?? 'open'}
          onChange={(e) =>
            navigate(
              alertHref(location.search, {
                phase: e.currentTarget.value,
                after: undefined,
                ...clearSelection,
              }),
            )
          }
        >
          <option value="open">Open (pending or firing)</option>
          <For each={phases}>{(p) => <option value={p}>{p}</option>}</For>
        </select>
      </label>
      <Show when={q().invalid}>
        <p role="alert">
          Invalid alert URL. Correct the tenant, phase, selection or cursor
          before reading.
        </p>
      </Show>
      <Show when={!q().invalid && !q().tenant}>
        <p role="status">Select a tenant to read alerts.</p>
      </Show>
      <Show when={!q().invalid && q().tenant}>
        <AlertRuleConfiguration tenant={q().tenant} rule={q().configure} />
        <AlertReadPanel
          label="Alert queue"
          state={queue.state()}
          retry={queue.retry}
        >
          {(page) => (
            <>
              <Show
                when={page.alerts.length > 0}
                fallback={
                  <p>
                    No observed alerts on this page. This does not establish
                    condition health.
                  </p>
                }
              >
                <ul class="grid gap-2">
                  <For each={page.alerts}>
                    {(a) => (
                      <li class="min-w-0 rounded border border-border p-3 break-all">
                        <TextLink
                          href={alertHref(location.search, {
                            rule: a.rule_id,
                            revision: a.rule_revision,
                            history_after: undefined,
                            evaluation: undefined,
                            outputs_after: undefined,
                          })}
                        >
                          {a.rule_id} · revision {a.rule_revision}
                        </TextLink>
                        <p>
                          {a.phase} · lifecycle {a.version}
                        </p>
                        <p class="text-sm text-muted">
                          Scope {a.scope_asset_id} · target {a.target_asset_id}{' '}
                          · event {a.last_event_at_ms} ms
                        </p>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
              <nav aria-label="Alert queue pages" class="flex flex-wrap gap-4">
                <Show when={q().after}>
                  <TextLink href={alertTenantHref(location.search, q().tenant)}>
                    First alert page
                  </TextLink>
                </Show>
                <Show when={page.next_after}>
                  {(after) => (
                    <TextLink
                      href={alertHref(location.search, {
                        after: after(),
                        ...clearSelection,
                      })}
                    >
                      Next alerts
                    </TextLink>
                  )}
                </Show>
              </nav>
            </>
          )}
        </AlertReadPanel>
        <Show when={q().rule && q().revision}>
          <ConnectedAlertDetail query={q()} search={location.search} />
        </Show>
      </Show>
    </div>
  );
}
