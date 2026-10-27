import type { Accessor } from 'solid-js';
import { RequestFailure } from '#shared/model';
import type { AssetReadOptions } from '../../../model/asset-catalogue';
import type { TelemetryReader } from '../../../model/property-evidence';
import { useMetadataReader } from '../MetadataReaderProvider';
import { type MetadataReadState, useMetadataRead } from '../useMetadataRead';
/** Reuses the account/tenant-keyed cancellable owner, with an independent telemetry port. */
export function useTelemetryRead<R, T>(
  request: Accessor<R | null>,
  execute: (
    reader: TelemetryReader,
    request: R,
    options: AssetReadOptions,
  ) => Promise<T>,
) {
  const context = useMetadataReader();
  const read = useMetadataRead(
    () => (context.reader?.telemetry ? request() : null),
    (_metadata, query, options) => {
      const port = context.reader?.telemetry;
      if (!port) throw new RequestFailure('unavailable');
      return execute(port, query, options);
    },
  );
  return {
    retry: read.retry,
    state: (): MetadataReadState<T> =>
      context.reader?.telemetry ? read.state() : { kind: 'unconfigured' },
  };
}
