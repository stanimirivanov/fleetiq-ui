import { useLocation, useNavigate } from '@solidjs/router';
import { createSignal, Show } from 'solid-js';
import { RequestFailure } from '#shared/model';
import { alertHref } from '../model/alert-query';
import type { RuleScope } from '../model/alert-rules';
import { identifier } from '../model/connected-alerts';
import { AlertRuleActivation } from './AlertRuleActivation';
import { AlertRuleForm } from './AlertRuleForm';
import { useAlertContext } from './connected/AlertProvider';
import { AlertReadPanel } from './connected/AlertReadPanel';
import { useAlertRead } from './connected/useAlertRead';
export function AlertRuleConfiguration(props: {
  readonly tenant: string;
  readonly rule?: string;
}) {
  const context = useAlertContext(),
    location = useLocation(),
    navigate = useNavigate(),
    [id, setId] = createSignal(props.rule ?? ''),
    [invalid, setInvalid] = createSignal(false);
  return (
    <Show when={context.reader?.rules}>
      <section
        aria-label="Alert rule configuration"
        class="grid min-w-0 gap-4 rounded-xl border border-border bg-surface p-4"
      >
        <h2 class="font-semibold">Alert rule configuration</h2>
        <p>
          No rule catalogue is published. Enter an exact rule ID to inspect
          retained configuration or create its first revision.
        </p>
        <form
          class="flex min-w-0 flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!identifier(id())) {
              setInvalid(true);
              return;
            }
            setInvalid(false);
            navigate(alertHref(location.search, { configure: id() }));
          }}
        >
          <label class="grid min-w-0 gap-1">
            Rule ID to configure
            <input
              class="min-w-0 rounded border border-border bg-surface p-2"
              maxLength={128}
              value={id()}
              onInput={(e) => setId(e.currentTarget.value)}
            />
          </label>
          <button type="submit" class="text-accent underline">
            Inspect rule configuration
          </button>
        </form>
        <Show when={invalid()}>
          <p role="alert">Enter a valid exact rule ID.</p>
        </Show>
        <Show
          when={
            props.rule ? JSON.stringify([props.tenant, props.rule]) : undefined
          }
          keyed
        >
          {(_key) => (
            <RuleEditor tenant={props.tenant} rule={props.rule ?? ''} />
          )}
        </Show>
      </section>
    </Show>
  );
}
function RuleEditor(props: RuleScope) {
  const [note, setNote] = createSignal('');
  const [appendLocked, setAppendLocked] = createSignal(false),
    [activationLocked, setActivationLocked] = createSignal(false);
  const blocked = () => appendLocked() || activationLocked();
  const head = useAlertRead(
    () => ({ ...props }),
    (reader, r, o) => {
      if (!reader.rules) throw new Error('Rule gateway unavailable');
      return reader.rules.head(r, o).catch((e) => {
        if (e instanceof RequestFailure && e.kind === 'not-found') return null;
        throw e;
      });
    },
  );
  const ready = () => {
    const s = head.state();
    return s.kind === 'ready' ? { head: s.value } : undefined;
  };
  const exact = useAlertRead(
    () => {
      const h = ready()?.head;
      return h ? { ...props, revision: h.latest_revision } : null;
    },
    (reader, r, o) => {
      if (!reader.rules) throw new Error('Rule gateway unavailable');
      return reader.rules.revision(r, o);
    },
  );
  const initial = () => {
    const r = ready(),
      s = exact.state();
    return r && (r.head === null || s.kind === 'ready')
      ? { definition: s.kind === 'ready' ? s.value.definition : undefined }
      : undefined;
  };
  const committed = (message: string) => {
    setNote(message);
    head.retry();
  };
  return (
    <>
      <Show when={note()}>
        <p role="status">{note()}</p>
      </Show>
      <button
        type="button"
        class="justify-self-start text-accent underline"
        disabled={blocked()}
        onClick={head.retry}
      >
        Refresh rule configuration
      </button>
      <AlertReadPanel
        label="Rule configuration head"
        state={head.state()}
        retry={head.retry}
      >
        {(h) => (
          <p class="break-all">
            {props.rule} ·{' '}
            {h
              ? `latest revision ${h.latest_revision}`
              : 'No retained rule; the first revision is 1.'}
          </p>
        )}
      </AlertReadPanel>
      <Show when={ready()?.head}>
        <AlertReadPanel
          label="Retained rule revision"
          state={exact.state()}
          retry={exact.retry}
        >
          {(r) => (
            <p class="break-all">
              Revision {r.revision} · actor {r.actor_id} · recorded{' '}
              {r.recorded_at_ms} ms · {r.definition.calculator}@
              {r.definition.version}
            </p>
          )}
        </AlertReadPanel>
      </Show>
      <Show when={initial()} keyed>
        {(i) => (
          <AlertRuleForm
            scope={props}
            revision={(ready()?.head?.latest_revision ?? 0) + 1}
            initial={i.definition}
            locked={setAppendLocked}
            blocked={activationLocked}
            committed={committed}
            reload={head.retry}
          />
        )}
      </Show>
      <Show when={ready()?.head} keyed>
        {(h) => (
          <AlertRuleActivation
            scope={props}
            head={h}
            locked={setActivationLocked}
            blocked={appendLocked}
            committed={committed}
            reload={head.retry}
          />
        )}
      </Show>
    </>
  );
}
