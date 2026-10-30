import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import {
  type RuleCommand,
  type RuleHead,
  type RuleScope,
  uint,
} from '../model/alert-rules';
import { AlertCommandFeedback } from './connected/AlertCommandFeedback';
import { useAlertContext } from './connected/AlertProvider';
import { useAlertCommand } from './connected/useAlertCommand';
export function AlertRuleActivation(props: {
  readonly locked: (value: boolean) => void;
  readonly blocked: () => boolean;
  readonly scope: RuleScope;
  readonly head: RuleHead;
  readonly committed: (message: string) => void;
  readonly reload: () => void;
}) {
  const context = useAlertContext(),
    [revision, setRevision] = createSignal(
      String(props.head.activation.revision ?? props.head.latest_revision),
    ),
    [invalid, setInvalid] = createSignal(false);
  const command = useAlertCommand<RuleCommand, string>((r, o) => {
    const g = context.reader?.rules;
    if (!g) throw new Error('Rule gateway unavailable');
    return g.command(r, o);
  }, props.committed);
  createEffect(() => props.locked(command.locked()));
  onCleanup(() => props.locked(false));
  const allowed = () => context.actions?.()?.includes('alerts.manage') === true;
  function change(revision: number | null) {
    if (props.blocked()) return;
    if (
      !allowed() ||
      (revision !== null &&
        (!uint(revision, 1) || revision > props.head.latest_revision))
    ) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    command.submit({
      ...props.scope,
      kind: 'activate',
      expected_generation: props.head.activation.generation,
      revision,
    });
  }
  return (
    <form
      class="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^[1-9][0-9]*$/.test(revision())) {
          setInvalid(true);
          return;
        }
        change(Number(revision()));
      }}
    >
      <h3 class="font-semibold">Rule activation</h3>
      <p>
        Observed generation {props.head.activation.generation} · selected
        revision {props.head.activation.revision ?? 'none'} · actor{' '}
        {props.head.activation.actor_id ?? 'none'} · recorded{' '}
        {props.head.activation.recorded_at_ms ?? 'none'} ms
      </p>
      <fieldset
        disabled={command.locked() || props.blocked() || !allowed()}
        class="flex flex-wrap items-end gap-3"
      >
        <label class="grid gap-1">
          Retained revision to activate
          <input
            class="rounded border border-border bg-surface p-2"
            value={revision()}
            maxLength={10}
            onInput={(e) => setRevision(e.currentTarget.value)}
          />
        </label>
        <button type="submit" class="text-accent underline">
          Activate retained revision
        </button>
        <button
          type="button"
          class="text-accent underline"
          onClick={() => change(null)}
        >
          Deactivate rule
        </button>
      </fieldset>
      <Show when={invalid()}>
        <p role="alert">
          Choose a retained positive revision, no greater than the observed
          head.
        </p>
      </Show>
      <p class="text-sm text-muted">
        Activation affects future processing. Retrying an older receipt does not
        restore its selection.
      </p>
      <AlertCommandFeedback
        state={command.state()}
        replay={command.replay}
        reload={props.reload}
      />
    </form>
  );
}
