import { Schema } from 'effect';
import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import { AlertAcknowledgement } from '../../../generated/fleetiq-api';
import type {
  Acknowledgement,
  AcknowledgementRequest,
} from '../model/acknowledgement';
import {
  identifier,
  lifecycle,
  millis,
  type ReadOptions,
  revision,
} from '../model/connected-alerts';

function invalid(): never {
  throw new RequestFailure('invalid-response');
}
export function parseAcknowledgement(
  input: unknown,
  version: string,
  actor?: string,
): Acknowledgement {
  let w: typeof AlertAcknowledgement.Type;
  try {
    w = Schema.decodeUnknownSync(AlertAcknowledgement)(input);
  } catch {
    invalid();
  }
  if (
    w.version !== version ||
    !lifecycle(w.version) ||
    !identifier(w.actor_id) ||
    !millis(w.recorded_at_ms) ||
    (actor !== undefined && w.actor_id !== actor)
  )
    invalid();
  return w;
}
export function createAcknowledgementWriter(api: BrowserApi) {
  return async (
    r: AcknowledgementRequest,
    o?: ReadOptions,
  ): Promise<Acknowledgement> => {
    if (
      ![r.tenant, r.rule, r.actor].every(identifier) ||
      !revision(r.revision) ||
      !lifecycle(r.expected_version)
    )
      throw new RequestFailure('invalid-request');
    const w = await api.run(
      (c) =>
        c.acknowledgeAlert(r.tenant, r.rule, String(r.revision), {
          params: { Origin: api.origin, 'X-FleetIQ-CSRF': '1' },
          payload: { expected_version: r.expected_version },
        }),
      o,
    );
    return parseAcknowledgement(w, r.expected_version, r.actor);
  };
}
