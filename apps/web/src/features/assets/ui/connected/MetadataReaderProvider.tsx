import { createContext, type JSX, useContext } from 'solid-js';
import type { FleetReader } from '../../model/fleet';
import type { MetadataReader } from '../../model/metadata';
import type { TelemetryReader } from '../../model/property-evidence';

interface MetadataReaderContext {
  readonly reader?: MetadataReader & {
    readonly fleet?: FleetReader;
    readonly telemetry?: TelemetryReader;
  };
  /** Advisory availability; the server always authorizes the protected request. */
  readonly accessBlock?: () => string | undefined;
  /** A changed identity invalidates retained evidence even for an unchanged URL. */
  readonly accessRevision?: () => unknown;
  /** App-owned composition slot keeps identity controls outside this feature. */
  readonly tenantControl?: (props: {
    readonly tenantId: () => string;
  }) => JSX.Element;
  readonly onUnauthorized?: () => void;
}
const Context = createContext<MetadataReaderContext>({});

/** Composition supplies the transport port; feature views never own credentials. */
export function MetadataReaderProvider(
  props: MetadataReaderContext & { readonly children: JSX.Element },
) {
  return <Context.Provider value={props}>{props.children}</Context.Provider>;
}

export function useMetadataReader(): MetadataReaderContext {
  return useContext(Context);
}
