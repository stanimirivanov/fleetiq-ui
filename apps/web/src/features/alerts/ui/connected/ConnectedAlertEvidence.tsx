import { For, Show } from 'solid-js';
import { TextLink } from '#shared/ui';
import { alertHref } from '../../model/alert-query';
import type { EvidenceRequest } from '../../model/connected-alerts';
import { AlertReadPanel } from './AlertReadPanel';
import { useAlertRead } from './useAlertRead';
export function ConnectedAlertEvidence(props: {
  readonly request: EvidenceRequest;
  readonly search: string;
  readonly after?: string;
}) {
  const evidence = useAlertRead(
    () => props.request,
    (reader, r, o) => reader.evaluation(r, o),
  );
  const outputs = useAlertRead(
    () => {
      const s = evidence.state();
      return s.kind === 'ready'
        ? { ...props.request, evidence: s.value, after: props.after }
        : null;
    },
    (reader, r, o) => reader.outputs(r, o),
  );
  return (
    <div class="grid min-w-0 gap-4 lg:col-span-2">
      <p class="text-sm text-muted">
        Calculator evidence requires independent telemetry.read permission.
        Alert access does not grant it.
      </p>
      <Show when={props.request.transition.evidence.output_index === null}>
        <p>
          No usable output slot was referenced. This is unknown evidence, not a
          false condition.
        </p>
      </Show>
      <AlertReadPanel
        label="Calculator evaluation evidence"
        state={evidence.state()}
        retry={evidence.retry}
      >
        {(e) => (
          <div class="grid min-w-0 gap-2 break-all">
            <p>
              Evaluation {e.evaluation.evaluation_id} · outcome{' '}
              {e.evaluation.outcome}
            </p>
            <p>
              Release {e.evaluation.calculator.id}@
              {e.evaluation.calculator.version} ·{' '}
              {e.evaluation.calculator.implementation} · configuration{' '}
              {e.evaluation.configuration_id}
            </p>
            <p>
              Input property {e.evaluation.input_property.id}@
              {e.evaluation.input_property.version} · scope{' '}
              {e.evaluation.scope_asset_id}
            </p>
            <p>
              Window [{e.evaluation.window.start_at_ms},{' '}
              {e.evaluation.window.end_at_ms}) ms · finalize{' '}
              {e.evaluation.window.finalize_at_ms} · known{' '}
              {e.evaluation.window.known_at_ms} · evaluated{' '}
              {e.evaluation.evaluated_at_ms}
            </p>
            <p>
              {e.evaluation.input_count} retained input references · minimum
              samples {e.evaluation.minimum_samples} ·{' '}
              {e.evaluation.output_count} outputs. Showing the first{' '}
              {Math.min(20, e.inputs.length)} input references; no raw payload
              expansion.
            </p>
            <ul>
              <For each={e.inputs.slice(0, 20)}>
                {(i) => (
                  <li>
                    {i.evidence_id} · event {i.event_at_ms} ms
                  </li>
                )}
              </For>
            </ul>
          </div>
        )}
      </AlertReadPanel>
      <Show when={evidence.state().kind === 'ready'}>
        <AlertReadPanel
          label="Calculator outputs"
          state={outputs.state()}
          retry={outputs.retry}
        >
          {(page) => (
            <>
              <Show
                when={page.outputs.length}
                fallback={<p>No retained outputs on this page.</p>}
              >
                <ul class="grid gap-2">
                  <For each={page.outputs}>
                    {(o) => (
                      <li class="min-w-0 break-all">
                        <p>
                          Output {o.output_index}
                          {o.output_index ===
                          props.request.transition.evidence.output_index
                            ? ' · referenced slot'
                            : ''}{' '}
                          · target {o.asset_id} · {o.property_id}@
                          {o.property_version}
                        </p>
                        <p class="font-mono">
                          {o.value} {o.unit ?? '(dimensionless)'}
                        </p>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
              <nav aria-label="Output pages" class="flex flex-wrap gap-4">
                <Show when={props.after}>
                  <TextLink
                    href={alertHref(props.search, { outputs_after: undefined })}
                  >
                    First outputs
                  </TextLink>
                </Show>
                <Show when={page.next_after}>
                  {(after) => (
                    <TextLink
                      href={alertHref(props.search, { outputs_after: after() })}
                    >
                      Next outputs
                    </TextLink>
                  )}
                </Show>
              </nav>
            </>
          )}
        </AlertReadPanel>
      </Show>
    </div>
  );
}
