import { createSignal, For, onCleanup, Show } from 'solid-js';
import { RequestFailure } from '#shared/model';
import type {
  OperationsGateway,
  RecoveryBody,
  RecoveryReceipt,
  RecoveryRequest,
  WorkKind,
} from '../api/operations-gateway';
import { operationFailure, useOperationRead } from './use-operation-read';

const effects = {
  retry:
    'Rearms this failed position with its original inputs. Scheduling keeps its current pause state.',
  pause:
    'Stops new scheduling for this family in the selected tenant. Work already in progress can finish.',
  resume:
    'Allows new scheduling for this family in the selected tenant. Existing work and evidence are retained.',
};

function targetLabel(target: RecoveryBody['target']) {
  if ('id' in target) return target.id;
  if ('destination' in target)
    return `${target.rule_id} · revision ${target.revision} · firing ${target.firing_version} · destination ${target.destination}`;
  return 'Entire work family';
}

export function RecoveryPanel(props: {
  gateway: OperationsGateway;
  tenant: string;
  actor: string;
  kind: WorkKind;
  onUnauthorized: () => void;
  onChange: () => void;
}) {
  const preparation = useOperationRead(
    (signal) => props.gateway.prepare(props.tenant, props.kind, signal),
    props.onUnauthorized,
  );
  const [review, setReview] = createSignal<RecoveryBody>();
  const [pending, setPending] = createSignal(false);
  const [uncertain, setUncertain] = createSignal(false);
  const [denied, setDenied] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [receipt, setReceipt] = createSignal<RecoveryReceipt>();
  let captured: RecoveryRequest | undefined;
  let controller: AbortController | undefined;
  onCleanup(() => controller?.abort());
  const locked = () => pending() || uncertain() || denied();
  const ready = () => {
    const state = preparation.state();
    return state.kind === 'ready' ? state.value : undefined;
  };
  const readError = () => {
    const state = preparation.state();
    return state.kind === 'error'
      ? new RequestFailure(state.failure).message
      : undefined;
  };
  const select = (body: RecoveryBody) => {
    if (locked() || !ready()) return;
    setReview(body);
    setMessage('');
    setReceipt(undefined);
  };
  const send = async (request: RecoveryRequest) => {
    if (pending()) return;
    const attempt = new AbortController();
    controller = attempt;
    setPending(true);
    setMessage('');
    try {
      const result = await props.gateway.apply(request, attempt.signal);
      if (attempt.signal.aborted) return;
      setReceipt(result);
      setUncertain(false);
      captured = undefined;
      preparation.refresh();
      props.onChange();
    } catch (error) {
      if (attempt.signal.aborted) return;
      const failure = operationFailure(error);
      if (failure === 'unauthorized') props.onUnauthorized();
      if (
        failure === 'unavailable' ||
        failure === 'invalid-response' ||
        (uncertain() && failure !== 'conflict')
      ) {
        setUncertain(true);
        setMessage(
          'Outcome is unconfirmed. Retry the same request to recover its receipt. Leaving this scope discards the local retry.',
        );
      } else {
        captured = undefined;
        setUncertain(false);
        if (failure === 'forbidden') setDenied(true);
        setMessage(
          failure === 'conflict'
            ? 'Work changed. Review the refreshed preparation before submitting again.'
            : failure === 'forbidden'
              ? 'Recovery access was denied. Refresh tenant access before trying again.'
              : new RequestFailure(failure).message,
        );
        preparation.refresh();
        props.onChange();
      }
    } finally {
      if (!attempt.signal.aborted) setPending(false);
    }
  };
  const confirm = (body: RecoveryBody) => {
    if (locked() || !ready()) return;
    captured = {
      tenant: props.tenant,
      kind: props.kind,
      actor: props.actor,
      requestId: crypto.randomUUID(),
      body,
    };
    setReview(undefined);
    void send(captured);
  };
  return (
    <section
      aria-label="Work recovery"
      class="grid min-w-0 gap-3 rounded-xl border border-outline bg-surface p-4"
    >
      <h2 class="text-lg font-semibold">Work recovery</h2>
      <Show when={preparation.state().kind === 'loading'}>
        <p role="status">Loading recovery targets…</p>
      </Show>
      <Show when={readError()}>
        {(error) => (
          <div class="grid justify-items-start gap-2">
            <p role="alert">{error()}</p>
            <button
              type="button"
              class="text-accent underline"
              onClick={preparation.refresh}
            >
              Refresh recovery targets
            </button>
          </div>
        )}
      </Show>
      <Show when={ready()}>
        {(view) => (
          <>
            <p>
              Scheduling {view().control.paused ? 'paused' : 'enabled'} ·
              generation {view().control.generation}
            </p>
            <div>
              <button
                type="button"
                class="text-accent underline"
                disabled={
                  locked() ||
                  view().control.generation === '9223372036854775807'
                }
                onClick={() =>
                  select({
                    operation: view().control.paused ? 'resume' : 'pause',
                    expected_generation: view().control.generation,
                    target: {},
                  })
                }
              >
                Review {view().control.paused ? 'resume' : 'pause'}
              </button>
            </div>
            <Show when={view().truncated}>
              <p>Showing the first 32 eligible retry targets.</p>
            </Show>
            <Show
              when={view().targets.length}
              fallback={<p>No eligible retry targets in this observation.</p>}
            >
              <ul class="grid gap-2">
                <For each={view().targets}>
                  {(candidate) => (
                    <li class="break-all">
                      <button
                        type="button"
                        class="text-left text-accent underline"
                        disabled={locked()}
                        onClick={() =>
                          select({ operation: 'retry', ...candidate })
                        }
                      >
                        Review retry for {targetLabel(candidate.target)}
                      </button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </>
        )}
      </Show>
      <Show when={review()}>
        {(body) => (
          <form
            aria-label="Review recovery command"
            tabIndex={-1}
            ref={(form) => queueMicrotask(() => form.focus())}
            class="grid justify-items-start gap-2 border-t border-outline pt-3"
            onSubmit={(event) => {
              event.preventDefault();
              confirm(body());
            }}
          >
            <h3 class="font-semibold">Review {body().operation}</h3>
            <p>{effects[body().operation]}</p>
            <p class="break-all">
              {props.tenant} · {targetLabel(body().target)}
            </p>
            <p>Expected generation {body().expected_generation}</p>
            <div class="flex flex-wrap gap-3">
              <button type="submit" class="text-accent underline">
                Confirm {body().operation}
              </button>
              <button
                type="button"
                class="text-accent underline"
                onClick={() => setReview(undefined)}
              >
                Cancel review
              </button>
            </div>
          </form>
        )}
      </Show>
      <Show when={pending()}>
        <p role="status">Submitting reviewed command…</p>
      </Show>
      <Show when={message()}>
        <p role="alert">{message()}</p>
      </Show>
      <Show when={uncertain() && !pending()}>
        <div>
          <button
            type="button"
            class="text-accent underline"
            onClick={() => {
              if (captured) void send(captured);
            }}
          >
            Retry exact command
          </button>
        </div>
      </Show>
      <Show when={receipt()}>
        {(value) => (
          <p role="status" class="break-all">
            Recorded generation {value().generation} by {value().actor_id} ·{' '}
            {value().recorded_at_ms} ms · request {value().request_id}. This
            receipt records the original command.
          </p>
        )}
      </Show>
    </section>
  );
}
