import { createContext, type JSX, useContext } from 'solid-js';
import type { BindingGateway } from '../../model/binding-authoring';
import type { CommissioningGateway } from '../../model/commissioning';
import type { FleetReader } from '../../model/fleet';
import type { MetadataReader } from '../../model/metadata';
import type { TelemetryReader } from '../../model/property-evidence';

interface MetadataReaderContext {
  readonly bindings?: BindingGateway;
  readonly commissioning?: CommissioningGateway;
  readonly actions?: () => readonly string[] | undefined;
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

/** Required only inside the explicitly configured commissioning subtree. */
export function useCommissioningGateway(): CommissioningGateway {
  const gateway = useMetadataReader().commissioning;
  if (!gateway) throw new Error('Commissioning gateway is not configured');
  return gateway;
}
