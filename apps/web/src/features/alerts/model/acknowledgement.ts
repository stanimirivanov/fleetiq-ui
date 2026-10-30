export interface Acknowledgement {
  readonly version: string;
  readonly actor_id: string;
  readonly recorded_at_ms: string;
}
export interface AcknowledgementRequest {
  readonly tenant: string;
  readonly rule: string;
  readonly revision: number;
  readonly expected_version: string;
  readonly actor: string;
}
