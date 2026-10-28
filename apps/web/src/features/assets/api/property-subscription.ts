import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import { validProperty } from '../model/property-evidence';
import type { SubscribeProperty } from '../model/property-live';
import { parsePropertyLive } from './parse-property-live';
/** Transport closes on every terminal control; no native automatic reconnect. */
export function propertySubscription(api: BrowserApi): SubscribeProperty {
  return async (request, receive, options) => {
    validProperty(request);
    if (!api.stream) throw new RequestFailure('unavailable');
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal.addEventListener('abort', abort, { once: true });
    if (options.signal.aborted) controller.abort();
    let terminal = false;
    const parts = [
      request.tenantId,
      request.assetId,
      request.property.id,
      String(request.property.version),
    ].map(encodeURIComponent);
    try {
      await api.stream(
        `/api/v1/tenants/${parts[0]}/assets/${parts[1]}/properties/${parts[2]}/versions/${parts[3]}/live`,
        (frame) => {
          if (terminal || controller.signal.aborted) return;
          const event = parsePropertyLive(frame, request);
          terminal =
            event.kind === 'stream-ended' ||
            event.kind === 'resnapshot-required';
          receive(event);
          if (terminal) controller.abort();
        },
        {
          signal: controller.signal,
          ...(options.cursor ? { cursor: options.cursor } : {}),
        },
      );
    } catch (cause) {
      if (!terminal) throw cause;
    } finally {
      controller.abort();
      options.signal.removeEventListener('abort', abort);
    }
  };
}
