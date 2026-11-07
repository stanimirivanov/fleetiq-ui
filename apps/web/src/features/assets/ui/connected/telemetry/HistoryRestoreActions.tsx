import { Show } from 'solid-js';
import type {
  HistoryRestores,
  RestoreCommand,
  RestoreJob,
} from '../../../model/history-restore';
import type { RestoreSelection } from '../../../model/history-review-types';
import { metadataButtonClass, metadataInputClass } from '../MetadataPanel';
import { HistoryAction, HistoryJobFeedback } from './HistoryJobControls';
import { useHistoryJob } from './useHistoryJob';

const descriptions = {
  pending: 'Restore pending. Refresh or retry to resume interrupted work.',
  ready: 'Restore ready. Review the selected manifest in this window.',
  expired: 'Restore expired. Request the next generation to stage it again.',
  cancelled:
    'Restore cancelled. Request the next generation to stage it again.',
};

export function HistoryRestoreActions(props: {
  readonly tenantId: string;
  readonly port: HistoryRestores;
  readonly review: (selection: RestoreSelection) => void;
}) {
  const { job, setJob, busy, message, replay, denied, run } =
    useHistoryJob<RestoreJob>(
      'Restore',
      'Restore request failed. Check the manifest and previous generation.',
    );
  let captured: RestoreCommand | undefined;
  const request = (command: RestoreCommand) =>
    void run((options) => props.port.request(command, options), setJob, true);
  const mayStart = () =>
    !replay() &&
    (!job() || job()?.state === 'expired' || job()?.state === 'cancelled');

  return (
    <section aria-label="Archive restore" class="mt-4 grid gap-2">
      <p class="text-xs text-muted">
        Temporarily stage one published manifest.
      </p>
      <Show when={job()} keyed>
        {(selected) => (
          <p role="status" class="text-xs">
            {descriptions[selected.state]} Generation {selected.generation}.
          </p>
        )}
      </Show>
      <HistoryJobFeedback busy={busy()} message={message()} />
      <Show when={!denied()}>
        <Show when={mayStart()}>
          <form
            class="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (busy() || !mayStart()) return;
              const data = new FormData(event.currentTarget);
              captured = {
                tenantId: props.tenantId,
                manifestId: String(data.get('manifest')),
                expected: String(data.get('expected')),
              };
              setJob(undefined);
              request(captured);
            }}
          >
            <label class="grid gap-1 text-xs">
              Manifest to restore
              <input
                class={metadataInputClass}
                name="manifest"
                required
                maxlength={19}
                inputmode="numeric"
                value={job()?.manifestId ?? ''}
              />
            </label>
            <label class="grid gap-1 text-xs">
              Previous generation (0 for first request)
              <input
                class={metadataInputClass}
                name="expected"
                required
                maxlength={19}
                inputmode="numeric"
                value={job()?.generation ?? '0'}
              />
            </label>
            <button type="submit" class={metadataButtonClass} disabled={busy()}>
              Request restore
            </button>
          </form>
        </Show>
        <div class="flex flex-wrap gap-2">
          <Show when={replay() || job()?.state === 'pending'}>
            <HistoryAction
              label="Retry exact restore request"
              busy={busy()}
              run={() => {
                if (captured) request(captured);
              }}
            />
          </Show>
          <Show when={job()} keyed>
            {(selected) => (
              <>
                <HistoryAction
                  label="Refresh restore status"
                  busy={busy()}
                  run={() =>
                    void run(
                      (options) =>
                        props.port.status(props.tenantId, selected, options),
                      setJob,
                    )
                  }
                />
                <Show when={selected.state === 'ready' && !message()}>
                  <HistoryAction
                    label="Review restored history"
                    busy={busy()}
                    run={() => props.review(selected)}
                  />
                </Show>
              </>
            )}
          </Show>
        </div>
      </Show>
    </section>
  );
}
