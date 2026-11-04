import { For, Show } from 'solid-js';
import { RequestFailure } from '#shared/model';
import type { OperationsGateway } from '../api/operations-gateway';
import type { useOperationRead } from './use-operation-read';
import { workFamilies } from './work-families';

type Diagnostics = Awaited<ReturnType<OperationsGateway['diagnostics']>>;

export function SampledWork(props: {
  diagnostic: ReturnType<typeof useOperationRead<Diagnostics>>;
}) {
  const diagnostic = props.diagnostic;
  const observation = () => {
    const state = diagnostic.state();
    return state.kind === 'ready' ? state.value : undefined;
  };
  const error = () => {
    const state = diagnostic.state();
    return state.kind === 'error' ? state.failure : undefined;
  };
  return (
    <section aria-label="Work diagnostics" class="grid min-w-0 gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold">Sampled work</h2>
        <button
          type="button"
          class="text-accent underline"
          onClick={diagnostic.refresh}
        >
          Refresh diagnostics
        </button>
      </div>
      <p class="text-sm text-muted">
        Up to 64 positions per family. Worker liveness and notification seeding
        are unobserved.
      </p>
      <Show when={diagnostic.state().kind === 'loading'}>
        <p role="status">Loading work diagnostics…</p>
      </Show>
      <Show when={error()}>
        {(failure) => (
          <p role="alert">{new RequestFailure(failure()).message}</p>
        )}
      </Show>
      <Show when={observation()}>
        {(view) => (
          <div class="grid gap-3 lg:grid-cols-2">
            <For each={view().queues}>
              {(queue) => {
                const age = () => {
                  const oldest = queue.oldest_sampled_eligible_at_ms;
                  if (oldest === null) return;
                  const delta = BigInt(view().observed_at_ms) - BigInt(oldest);
                  return delta >= 0n ? `${delta / 1000n} s` : 'unavailable';
                };
                return (
                  <article class="grid gap-2 rounded-xl border border-outline bg-surface p-4">
                    <h3 class="font-semibold">{workFamilies[queue.kind]}</h3>
                    <p>
                      {queue.sampled} sampled
                      {queue.truncated ? ' · additional positions omitted' : ''}
                    </p>
                    <ul class="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      <li>{queue.eligible} eligible</li>
                      <li>{queue.leased} leased</li>
                      <li>{queue.failed} failed</li>
                      <li>{queue.blocked} blocked</li>
                      <li>{queue.deferred} deferred</li>
                    </ul>
                    <p class="text-sm text-muted">
                      Oldest sampled eligible age: {age() ?? 'unobserved'}
                    </p>
                    <p class="text-sm text-muted">
                      Highest sampled attempts: {queue.max_attempts}
                    </p>
                    <Show when={queue.failure_categories.length}>
                      <p class="text-sm">
                        Observed failure categories:{' '}
                        {queue.failure_categories
                          .map((failure) => failure.replaceAll('_', ' '))
                          .join(', ')}
                      </p>
                    </Show>
                  </article>
                );
              }}
            </For>
            <p class="text-sm text-muted">
              Observed at {view().observed_at_ms} ms since epoch.
            </p>
          </div>
        )}
      </Show>
    </section>
  );
}
