import { createMemo, For, Show } from 'solid-js';
import { TextLink } from '#shared/ui';
import {
  type AlertQuery,
  alertHref,
  clearEvidence,
} from '../../model/alert-query';
import type { DetailRequest } from '../../model/connected-alerts';
import { AlertReadPanel } from './AlertReadPanel';
import { ConnectedAlertEvidence } from './ConnectedAlertEvidence';
import { useAlertRead } from './useAlertRead';
export function ConnectedAlertDetail(props: {
  readonly query: AlertQuery;
  readonly search: string;
}) {
  const request = createMemo<DetailRequest | null>(() =>
    props.query.rule && props.query.revision
      ? {
          tenant: props.query.tenant,
          rule: props.query.rule,
          revision: props.query.revision,
        }
      : null,
  );
  const detail = useAlertRead(request, (reader, r, o) => reader.detail(r, o));
  const ready = createMemo(() => {
    const s = detail.state();
    return s.kind === 'ready' ? s.value : null;
  });
  const history = useAlertRead(
    () => {
      const d = ready(),
        r = request();
      return d && r
        ? { ...r, detail: d, after: props.query.history_after }
        : null;
    },
    (reader, r, o) => reader.history(r, o),
  );
  const selected = createMemo(() => {
    const d = ready();
    if (!d || !props.query.evaluation) return null;
    const h = history.state();
    return (
      [
        d.alert.latest_transition,
        ...(h.kind === 'ready' ? h.value.transitions : []),
      ].find((t) => t.evidence.evaluation_id === props.query.evaluation) ?? null
    );
  });
  const evidenceRequest = createMemo(() => {
    const d = ready(),
      t = selected();
    return d && t
      ? { tenant: props.query.tenant, detail: d, transition: t }
      : undefined;
  });
  return (
    <div class="grid min-w-0 gap-4 lg:grid-cols-2">
      <AlertReadPanel
        label="Alert detail"
        state={detail.state()}
        retry={detail.retry}
      >
        {(d) => (
          <div class="grid gap-2 break-all">
            <h3>
              {d.alert.rule_id} · revision {d.alert.rule_revision} ·{' '}
              {d.alert.phase}
            </h3>
            <p>
              Lifecycle version {d.alert.version} · processing{' '}
              {d.alert.selected ? 'selected' : 'not selected'}. Selection does
              not describe condition health.
            </p>
            <p>
              Scope {d.definition.scope} · target {d.definition.target}
            </p>
            <p>
              Calculator {d.definition.calculator}@{d.definition.version} ·{' '}
              {d.definition.output_property}@{d.definition.output_version} ·
              output {d.definition.output_index}
            </p>
            <p>
              Condition {d.definition.comparison} {d.definition.threshold}{' '}
              {d.definition.threshold_unit ?? '(dimensionless)'} · hold{' '}
              {d.definition.hold_ms} ms · resolve on false after{' '}
              {d.definition.resolve_after_ms} ms
            </p>
            <p>
              Last event {d.alert.last_event_at_ms} ms · duration candidate
              since {d.alert.candidate_since_ms ?? '—'}
            </p>
            <TextLink
              href={alertHref(props.search, {
                evaluation: d.alert.latest_transition.evidence.evaluation_id,
                outputs_after: undefined,
              })}
            >
              Inspect latest transition evidence
            </TextLink>
            <p class="text-sm text-muted">
              Exact revision detail is independent of the current queue page and
              can be newer than its observation.
            </p>
          </div>
        )}
      </AlertReadPanel>
      <Show when={ready()}>
        <AlertReadPanel
          label="Transition history"
          state={history.state()}
          retry={history.retry}
        >
          {(page) => (
            <>
              <Show
                when={page.transitions.length}
                fallback={<p>No transitions on this page.</p>}
              >
                <ol class="grid gap-3">
                  <For each={page.transitions}>
                    {(t) => (
                      <li class="break-all">
                        <p>
                          Version {t.version} · {t.phase} · event{' '}
                          {t.event_at_ms} ms · recorded {t.recorded_at_ms} ms ·
                          activation {t.activation_generation}
                        </p>
                        <TextLink
                          href={alertHref(props.search, {
                            evaluation: t.evidence.evaluation_id,
                            outputs_after: undefined,
                          })}
                        >
                          Inspect evidence for version {t.version}
                        </TextLink>
                      </li>
                    )}
                  </For>
                </ol>
              </Show>
              <nav aria-label="Transition pages" class="flex flex-wrap gap-4">
                <Show when={props.query.history_after}>
                  <TextLink
                    href={alertHref(props.search, {
                      history_after: undefined,
                      ...clearEvidence,
                    })}
                  >
                    First transitions
                  </TextLink>
                </Show>
                <Show when={page.next_after}>
                  {(after) => (
                    <TextLink
                      href={alertHref(props.search, {
                        history_after: after(),
                        ...clearEvidence,
                      })}
                    >
                      Next transitions
                    </TextLink>
                  )}
                </Show>
              </nav>
            </>
          )}
        </AlertReadPanel>
        <Show when={props.query.evaluation && !selected()}>
          <p role="status">
            Selected evaluation is not referenced by the latest transition or
            this history page. Select a visible transition.
          </p>
        </Show>
        <Show when={evidenceRequest()}>
          {(request) => (
            <ConnectedAlertEvidence
              request={request()}
              search={props.search}
              after={props.query.outputs_after}
            />
          )}
        </Show>
      </Show>
    </div>
  );
}
