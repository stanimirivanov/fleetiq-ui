import { createMemo, For, type JSX, Show } from 'solid-js';
import { PageHeader } from '#shared/ui';
import type { OperationsGateway, WorkKind } from '../api/operations-gateway';
import { RecoveryPanel } from './RecoveryPanel';
import { SampledWork } from './SampledWork';
import { useOperationRead } from './use-operation-read';
import { workFamilies } from './work-families';

interface OperationsProps {
  gateway: OperationsGateway;
  tenant: string;
  actor: string;
  read: boolean;
  manage: boolean;
  kind: WorkKind;
  selectKind: (kind: WorkKind) => void;
  onUnauthorized: () => void;
  tenantControl: JSX.Element;
}

export function OperationsPage(props: OperationsProps) {
  const scope = createMemo(() =>
    props.read && props.tenant
      ? { tenant: props.tenant, actor: props.actor }
      : null,
  );
  return (
    <div class="grid min-w-0 gap-5">
      <PageHeader eyebrow="Workspace / Operations" title="Work operations">
        Review sampled work and choose an exact recovery action.
      </PageHeader>
      <div class="rounded-xl border border-outline bg-surface p-4">
        {props.tenantControl}
      </div>
      <Show
        when={scope()}
        keyed
        fallback={
          <p role="status">
            {props.tenant
              ? 'Diagnostics require a currently advertised operations.read grant.'
              : 'Choose a tenant to review work.'}
          </p>
        }
      >
        {(selected) => (
          <TenantOperations
            {...props}
            tenant={selected.tenant}
            actor={selected.actor}
          />
        )}
      </Show>
    </div>
  );
}

function TenantOperations(props: OperationsProps) {
  const diagnostic = useOperationRead(
    (signal) => props.gateway.diagnostics(props.tenant, signal),
    props.onUnauthorized,
  );
  return (
    <>
      <SampledWork diagnostic={diagnostic} />
      <Show
        when={props.manage}
        fallback={
          <p role="status">
            Recovery requires operations.manage as well as operations.read.
          </p>
        }
      >
        <label class="grid max-w-sm gap-1 text-sm font-medium">
          Recovery work family
          <select
            class="rounded-md border border-outline bg-surface p-2"
            value={props.kind}
            onChange={(event) => {
              const kind = event.currentTarget.value;
              if (Object.hasOwn(workFamilies, kind))
                props.selectKind(kind as WorkKind);
            }}
          >
            <For each={Object.keys(workFamilies) as WorkKind[]}>
              {(kind) => <option value={kind}>{workFamilies[kind]}</option>}
            </For>
          </select>
        </label>
        <Show when={props.kind} keyed>
          {(kind) => (
            <RecoveryPanel
              gateway={props.gateway}
              tenant={props.tenant}
              actor={props.actor}
              kind={kind}
              onUnauthorized={props.onUnauthorized}
              onChange={diagnostic.refresh}
            />
          )}
        </Show>
      </Show>
    </>
  );
}
