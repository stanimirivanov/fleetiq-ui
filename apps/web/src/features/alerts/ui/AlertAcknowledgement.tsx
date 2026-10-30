import { Show } from 'solid-js';
import type {
  Acknowledgement,
  AcknowledgementRequest,
} from '../model/acknowledgement';
import type { Alert } from '../model/connected-alerts';
import { AlertCommandFeedback } from './connected/AlertCommandFeedback';
import { useAlertContext } from './connected/AlertProvider';
import { useAlertCommand } from './connected/useAlertCommand';
export function AcknowledgementNote(props: {
  readonly receipt?: Acknowledgement | null;
}) {
  return (
    <Show when={props.receipt}>
      {(a) => (
        <p class="break-all">
          Acknowledged version {a().version} by {a().actor_id} · recorded{' '}
          {a().recorded_at_ms} ms. Operator intent only; no resolution, silence
          or delivery suppression.
        </p>
      )}
    </Show>
  );
}
export function AlertAcknowledgement(props: {
  readonly tenant: string;
  readonly alert: Alert;
  readonly committed: (receipt: Acknowledgement) => void;
  readonly refresh: () => void;
}) {
  const context = useAlertContext(),
    command = useAlertCommand<AcknowledgementRequest, Acknowledgement>(
      (r, o) => {
        const write = context.reader?.acknowledge;
        if (!write) throw new Error('Acknowledgement is unavailable');
        return write(r, o);
      },
      props.committed,
    );
  const allowed = () =>
    context.actions?.()?.includes('alerts.acknowledge') === true &&
    Boolean(context.actorId?.());
  const open = () =>
    props.alert.phase === 'pending' || props.alert.phase === 'firing';
  const observed = () => props.alert.latest_transition.acknowledgement;
  return (
    <section aria-label="Alert acknowledgement" class="grid gap-3">
      <h3 class="font-semibold">
        Acknowledge lifecycle version {props.alert.version}
      </h3>
      <AcknowledgementNote receipt={observed()} />
      <p>
        Acknowledgement records operator intent for this exact version. It does
        not resolve, silence, assign or suppress delivery.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const actor = context.actorId?.();
          if (!allowed() || !open() || observed() || !actor) return;
          command.submit({
            tenant: props.tenant,
            rule: props.alert.rule_id,
            revision: props.alert.rule_revision,
            expected_version: props.alert.version,
            actor,
          });
        }}
      >
        <button
          type="submit"
          class="text-accent underline"
          disabled={
            command.locked() || !allowed() || !open() || Boolean(observed())
          }
        >
          Acknowledge displayed version
        </button>
      </form>
      <Show when={!allowed()}>
        <p>
          Requires an independently advertised alerts.acknowledge grant and a
          current operator session. The backend reauthorizes every command.
        </p>
      </Show>
      <Show when={!open()}>
        <p>This observed version is closed and cannot be newly acknowledged.</p>
      </Show>
      <AlertCommandFeedback
        state={command.state()}
        replay={command.replay}
        reload={props.refresh}
        reloadLabel="Refresh current alert"
      />
    </section>
  );
}
