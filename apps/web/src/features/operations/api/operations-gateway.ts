import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import type {
  WorkKind,
  WorkRecoveryCommand,
} from '../../../generated/fleetiq-api';

export type { WorkKind };
export type RecoveryBody = WorkRecoveryCommand;
export interface RecoveryRequest {
  readonly tenant: string;
  readonly kind: WorkKind;
  readonly actor: string;
  readonly requestId: string;
  readonly body: RecoveryBody;
}

const maxFence = 9223372036854775807n;
const fitsI64 = (value: string) => {
  const number = BigInt(value);
  return (
    String(number) === value && number >= -maxFence - 1n && number <= maxFence
  );
};
const invalid = () => {
  throw new RequestFailure('invalid-response');
};

export function createOperationsGateway(api: BrowserApi) {
  return {
    async diagnostics(tenant: string, signal: AbortSignal) {
      const view = await api.run(
        (client) => client.getWorkDiagnostics(tenant, {}),
        { signal },
      );
      if (
        !fitsI64(view.observed_at_ms) ||
        new Set(view.queues.map((q) => q.kind)).size !== 4
      )
        invalid();
      for (const q of view.queues) {
        const oldest = q.oldest_sampled_eligible_at_ms;
        if (
          q.eligible + q.leased + q.failed + q.blocked + q.deferred >
            q.sampled ||
          (q.truncated && q.sampled !== view.sample_limit) ||
          (oldest !== null && (!fitsI64(oldest) || q.eligible === 0))
        )
          invalid();
      }
      return view;
    },
    async prepare(tenant: string, kind: WorkKind, signal: AbortSignal) {
      const view = await api.run(
        (client) => client.getWorkRecoveryTargets(tenant, kind, {}),
        { signal },
      );
      if (
        view.kind !== kind ||
        !fitsI64(view.control.generation) ||
        (view.control.paused && view.control.generation === '0') ||
        (view.truncated && view.targets.length !== 32) ||
        new Set(view.targets.map(({ target }) => JSON.stringify(target)))
          .size !== view.targets.length
      )
        invalid();
      for (const { target, expected_generation } of view.targets) {
        if (
          !fitsI64(expected_generation) ||
          BigInt(expected_generation) === maxFence ||
          kind === 'alert_evaluation' ||
          ('id' in target
            ? kind === 'notification'
            : kind !== 'notification' ||
              BigInt(target.revision) > 4294967295n ||
              !fitsI64(target.firing_version))
        )
          invalid();
      }
      return view;
    },
    async apply(request: RecoveryRequest, signal: AbortSignal) {
      const receipt = await api.run(
        (client) =>
          client.applyWorkRecovery(
            request.tenant,
            request.kind,
            request.requestId,
            {
              params: { Origin: api.origin, 'X-FleetIQ-CSRF': '1' },
              payload: request.body,
            },
          ),
        { signal },
      );
      if (
        receipt.request_id !== request.requestId ||
        receipt.actor_id !== request.actor ||
        !fitsI64(receipt.generation) ||
        !fitsI64(receipt.recorded_at_ms) ||
        BigInt(receipt.generation) !==
          BigInt(request.body.expected_generation) + 1n
      )
        invalid();
      return receipt;
    },
  };
}

export type OperationsGateway = ReturnType<typeof createOperationsGateway>;
export type RecoveryReceipt = Awaited<ReturnType<OperationsGateway['apply']>>;
