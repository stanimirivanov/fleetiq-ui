/** Feature-owned operation values. Durable counters and clocks retain exact decimal strings. */
export type WorkKind =
  | 'replay'
  | 'calculator'
  | 'alert_evaluation'
  | 'notification';

export type RecoveryTarget =
  | { readonly id: string }
  | {
      readonly destination: string;
      readonly ruleId: string;
      readonly revision: string;
      readonly firingVersion: string;
    };

export type RecoveryBody =
  | {
      readonly operation: 'retry';
      readonly target: RecoveryTarget;
      readonly expectedGeneration: string;
    }
  | {
      readonly operation: 'pause' | 'resume';
      readonly target: Readonly<Record<string, never>>;
      readonly expectedGeneration: string;
    };

export interface RecoveryRequest {
  readonly tenant: string;
  readonly kind: WorkKind;
  readonly actor: string;
  readonly requestId: string;
  readonly body: RecoveryBody;
}

export interface RecoveryReceipt {
  readonly requestId: string;
  readonly actorId: string;
  readonly generation: string;
  readonly recordedAtMs: string;
}

export interface RecoveryPreparation {
  readonly kind: WorkKind;
  readonly control: { readonly generation: string; readonly paused: boolean };
  readonly targets: readonly {
    readonly target: RecoveryTarget;
    readonly expectedGeneration: string;
  }[];
  readonly truncated: boolean;
}

/** Existing diagnostic projection, owned here to keep the public port transport independent. */
export interface WorkDiagnostics {
  readonly observed_at_ms: string;
  readonly worker_liveness: 'not_observed';
  readonly notification_seeding: 'not_observed';
  readonly sample_limit: 64;
  readonly queues: readonly {
    readonly kind: WorkKind;
    readonly sampled: number;
    readonly eligible: number;
    readonly leased: number;
    readonly failed: number;
    readonly blocked: number;
    readonly deferred: number;
    readonly max_attempts: number;
    readonly oldest_sampled_eligible_at_ms: string | null;
    readonly failure_categories: readonly (
      | 'attempts_exhausted'
      | 'transport'
      | 'rejected'
      | 'response_limit'
      | 'invalid_payload'
    )[];
    readonly truncated: boolean;
  }[];
}

export interface OperationsGateway {
  diagnostics(tenant: string, signal: AbortSignal): Promise<WorkDiagnostics>;
  prepare(
    tenant: string,
    kind: WorkKind,
    signal: AbortSignal,
  ): Promise<RecoveryPreparation>;
  apply(
    request: RecoveryRequest,
    signal: AbortSignal,
  ): Promise<RecoveryReceipt>;
}
