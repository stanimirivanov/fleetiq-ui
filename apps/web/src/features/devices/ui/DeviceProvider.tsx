import {
  createContext,
  type JSX,
  type ParentProps,
  useContext,
} from 'solid-js';
import type { DeviceGateway } from '../model/devices';
export interface DeviceContext {
  readonly gateway: DeviceGateway;
  readonly actions: () => readonly string[] | undefined;
  readonly tenantControl: (selected: string) => JSX.Element;
  readonly onUnauthorized: () => void;
}
const Context = createContext<DeviceContext>();
export function DeviceProvider(props: ParentProps<DeviceContext>) {
  return <Context.Provider value={props}>{props.children}</Context.Provider>;
}
export function useDevices() {
  const context = useContext(Context);
  if (!context) throw new Error('Device provider required');
  return context;
}
