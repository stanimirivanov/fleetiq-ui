import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import type { RestoreJob as WireJob } from '../../../generated/fleetiq-api';
import type { HistoryRestores } from '../model/history-restore';
import { positiveId } from '../model/history-review';

function decode(
  wire: typeof WireJob.Type,
  manifestId: string,
  generation: string,
) {
  if (wire.manifest_id !== manifestId || wire.restore_generation !== generation)
    throw new RequestFailure('invalid-response');
  return { manifestId, generation, state: wire.state };
}

export function createHistoryRestores(api: BrowserApi): HistoryRestores {
  const params = { Origin: api.origin, 'X-FleetIQ-CSRF': '1' as const };
  return {
    async request({ tenantId, manifestId, expected }, options) {
      if (
        !positiveId(manifestId) ||
        (expected !== '0' && !positiveId(expected)) ||
        expected === '9223372036854775807'
      )
        throw new RequestFailure('invalid-request');
      const wire = await api.run(
        (client) =>
          client.requestArchiveRestore(tenantId, manifestId, expected, {
            params,
          }),
        options,
      );
      return decode(wire, manifestId, String(BigInt(expected) + 1n));
    },
    async status(tenantId, { manifestId, generation }, options) {
      if (!positiveId(manifestId) || !positiveId(generation))
        throw new RequestFailure('invalid-request');
      const wire = await api.run(
        (client) =>
          client.getArchiveRestoreStatus(
            tenantId,
            manifestId,
            generation,
            undefined,
          ),
        options,
      );
      return decode(wire, manifestId, generation);
    },
  };
}
