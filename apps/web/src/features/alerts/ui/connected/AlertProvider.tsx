import { createContext, type JSX, useContext } from 'solid-js';
import type { AlertReader } from '../../model/connected-alerts';

interface Context {
  readonly reader?: AlertReader;
  readonly actions?: () => readonly string[] | undefined;
  readonly onUnauthorized?: () => void;
  readonly tenantControl?: (selected: string) => JSX.Element;
}
const Context = createContext<Context>({});
export function AlertProvider(
  props: Context & { readonly children: JSX.Element },
) {
  return <Context.Provider value={props}>{props.children}</Context.Provider>;
}
export const useAlertContext = () => useContext(Context);
