import { Show } from 'solid-js';
import type {
  ExportCommand,
  ExportJob,
  ExportScope,
  HistoryExports,
} from '../../../model/history-export';
import { evidenceTime } from '../../../model/property-evidence';
import { HistoryAction, HistoryJobFeedback } from './HistoryJobControls';
import { useHistoryJob } from './useHistoryJob';

const descriptions = {
  pending:
    'Export pending. Refresh status or retry the exact request to resume interrupted work.',
  ready: 'Export ready. Download the selected snapshot before it expires.',
  cancelled: 'Export cancelled. Request a new export when needed.',
  expired: 'Export expired. Request a new export when needed.',
};

export function HistoryExportActions(props: {
  readonly scope: ExportScope;
  readonly port: HistoryExports;
}) {
  const { job, setJob, busy, message, replay, denied, run } =
    useHistoryJob<ExportJob>(
      'Export',
      'Export request failed. Review the window and archive coverage.',
    );
  let captured: ExportCommand | undefined;

  function create(command: ExportCommand) {
    void run((options) => props.port.create(command, options), setJob, true);
  }

  function start() {
    setJob(undefined);
    captured = { ...props.scope, key: crypto.randomUUID() };
    create(captured);
  }

  function save(bytes: ArrayBuffer, id: string) {
    const url = URL.createObjectURL(
      new Blob([bytes], { type: 'application/vnd.apache.parquet' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `fleetiq-export-${id}.parquet`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section aria-label="Historical export" class="mt-4 grid gap-2">
      <p class="text-xs text-muted">
        Export the selected property and window as Parquet, up to 16
        interpretations. Coverage is limited to the selected snapshot.
      </p>
      <Show when={job()} keyed>
        {(selected) => (
          <p role="status" class="text-xs">
            {descriptions[selected.state]} Expires at{' '}
            {evidenceTime(selected.expiresAt)}.
          </p>
        )}
      </Show>
      <HistoryJobFeedback busy={busy()} message={message()} />
      <Show when={!denied()}>
        <div class="flex flex-wrap gap-2">
          <Show
            when={
              !replay() &&
              (!job() ||
                job()?.state === 'expired' ||
                job()?.state === 'cancelled')
            }
          >
            <HistoryAction busy={busy()} label="Request export" run={start} />
          </Show>
          <Show when={replay() || (job()?.state === 'pending' && !message())}>
            <HistoryAction
              busy={busy()}
              label="Retry exact export request"
              run={() => {
                if (captured) create(captured);
              }}
            />
          </Show>
          <Show when={job()} keyed>
            {(selected) => (
              <>
                <HistoryAction
                  busy={busy()}
                  label="Refresh export status"
                  run={() =>
                    void run(
                      (options) =>
                        props.port.status(props.scope, selected.id, options),
                      setJob,
                    )
                  }
                />
                <Show
                  when={
                    selected.state === 'pending' || selected.state === 'ready'
                  }
                >
                  <HistoryAction
                    busy={busy()}
                    label="Cancel export"
                    run={() =>
                      void run(
                        (options) =>
                          props.port.cancel(props.scope, selected.id, options),
                        setJob,
                      )
                    }
                  />
                </Show>
                <Show when={selected.state === 'ready' && !message()}>
                  <HistoryAction
                    busy={busy()}
                    label="Download export"
                    run={() =>
                      void run(
                        (options) =>
                          props.port.download(props.scope, selected, options),
                        (bytes) => save(bytes, selected.id),
                      )
                    }
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
