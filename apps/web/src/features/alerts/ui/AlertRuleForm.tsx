import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import type { Definition } from '../model/alert-definition';
import {
  type RuleCommand,
  type RuleScope,
  validDefinition,
} from '../model/alert-rules';
import { AlertCommandFeedback } from './connected/AlertCommandFeedback';
import { useAlertContext } from './connected/AlertProvider';
import { useAlertCommand } from './connected/useAlertCommand';

const fields = [
  ['calculator', 'Calculator ID'],
  ['version', 'Calculator version'],
  ['scope', 'Input scope asset ID'],
  ['target', 'Output target asset ID'],
  ['output_property', 'Output property ID'],
  ['output_version', 'Output property version'],
  ['threshold', 'Exact threshold'],
  ['threshold_unit', 'Canonical unit (blank means dimensionless)'],
  ['hold_ms', 'Hold duration (ms)'],
  ['resolve_after_ms', 'Resolve duration (ms)'],
] as const;
export function AlertRuleForm(props: {
  readonly locked: (value: boolean) => void;
  readonly blocked: () => boolean;
  readonly scope: RuleScope;
  readonly revision: number;
  readonly initial?: Definition;
  readonly committed: (message: string) => void;
  readonly reload: () => void;
}) {
  const context = useAlertContext();
  const [values, setValues] = createSignal<Record<string, string>>(
    Object.fromEntries(
      fields.map(([k]) => [
        k,
        String(
          props.initial?.[k] ??
            (k === 'output_version' ? '1' : k.endsWith('_ms') ? '0' : ''),
        ),
      ]),
    ),
  );
  const [comparison, setComparison] = createSignal<Definition['comparison']>(
      props.initial?.comparison ?? 'gt',
    ),
    [invalid, setInvalid] = createSignal(false);
  const command = useAlertCommand<RuleCommand, string>((r, o) => {
    const gateway = context.reader?.rules;
    if (!gateway) throw new Error('Rule gateway unavailable');
    return gateway.command(r, o);
  }, props.committed);
  createEffect(() => props.locked(command.locked()));
  onCleanup(() => props.locked(false));
  const allowed = () => context.actions?.()?.includes('alerts.manage') === true;
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!allowed() || props.blocked()) return;
    const v = values();
    const d: Definition = {
      kind: 'numeric-threshold-v1',
      calculator: v.calculator ?? '',
      version: v.version ?? '',
      scope: v.scope ?? '',
      target: v.target ?? '',
      output_property: v.output_property ?? '',
      output_version: Number(v.output_version),
      output_index: 0,
      comparison: comparison(),
      threshold: v.threshold ?? '',
      threshold_unit: v.threshold_unit || null,
      hold_ms: Number(v.hold_ms),
      resolution: 'resolve_on_false',
      resolve_after_ms: Number(v.resolve_after_ms),
    };
    if (
      !validDefinition(d) ||
      !['output_version', 'hold_ms', 'resolve_after_ms'].every((k) =>
        /^(0|[1-9][0-9]*)$/.test(v[k] ?? ''),
      )
    ) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    command.submit({
      ...props.scope,
      kind: 'append',
      revision: props.revision,
      definition: d,
    });
  };
  return (
    <form onSubmit={submit} class="grid min-w-0 gap-3">
      <h3 class="font-semibold">Append rule revision {props.revision}</h3>
      <p class="text-sm text-muted">
        Immutable numeric threshold over exact identifiers, output slot 0.
        Missing evidence is unknown; creation does not activate the rule.
      </p>
      <fieldset
        disabled={command.locked() || props.blocked() || !allowed()}
        class="grid min-w-0 gap-3 sm:grid-cols-2"
      >
        <For each={fields}>
          {([key, label]) => (
            <label class="grid min-w-0 gap-1">
              {label}
              <input
                class="min-w-0 rounded border border-border bg-surface p-2"
                value={values()[key]}
                maxLength={key === 'threshold' ? 256 : 128}
                onInput={(e) =>
                  setValues((v) => ({ ...v, [key]: e.currentTarget.value }))
                }
              />
            </label>
          )}
        </For>
        <label class="grid gap-1">
          Comparison
          <select
            class="rounded border border-border bg-surface p-2"
            value={comparison()}
            onChange={(e) =>
              setComparison(e.currentTarget.value as Definition['comparison'])
            }
          >
            <For each={['gt', 'gte', 'lt', 'lte']}>
              {(c) => <option value={c}>{c}</option>}
            </For>
          </select>
        </label>
        <button type="submit" class="text-accent underline">
          Append immutable revision
        </button>
      </fieldset>
      <Show when={!allowed()}>
        <p>
          Rule commands require an advertised alerts.manage grant. The server
          rechecks authority.
        </p>
      </Show>
      <Show when={invalid()}>
        <p role="alert">
          Check exact IDs, positive property version, decimal magnitude/fraction
          bounds and integer durations (0–604800000 ms).
        </p>
      </Show>
      <AlertCommandFeedback
        state={command.state()}
        replay={command.replay}
        reload={props.reload}
      />
    </form>
  );
}
