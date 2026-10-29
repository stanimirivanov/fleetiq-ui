import { createSignal } from 'solid-js';
import { supportedProperty } from '../../model/binding-authoring';
import { commandIdentifier } from '../../model/commissioning';
import type { DefinitionRef } from '../../model/metadata';
import { useMetadataRead } from '../connected/useMetadataRead';
/** Target eligibility comes from the target asset's pinned type, never a global property list. */
export function useBindingTarget(tenant: () => string) {
  const [asset, setAsset] = createSignal(''),
    [lookup, setLookup] = createSignal(''),
    [selected, setSelected] = createSignal<DefinitionRef>({
      id: '',
      version: 1,
    });
  const identity = useMetadataRead(
    () => (lookup() ? { tenantId: tenant(), assetId: lookup() } : null),
    (r, q, o) => r.getAsset(q, o),
  );
  const type = useMetadataRead(
    () => {
      const s = identity.state();
      return s.kind === 'ready'
        ? { tenantId: tenant(), ...s.value.assetType }
        : null;
    },
    (r, q, o) => r.getAssetType(q, o),
  );
  const properties = () => {
    const s = type.state();
    return s.kind === 'ready' ? s.value.supportedProperties : [];
  };
  const property = useMetadataRead(
    () =>
      supportedProperty(properties(), selected())
        ? { tenantId: tenant(), ...selected() }
        : null,
    (r, q, o) => r.getProperty(q, o),
  );
  return {
    asset,
    identity,
    type,
    property,
    properties,
    selected,
    value: () => ({ asset_id: asset(), property: selected() }),
    changeAsset: (v: string) => {
      setAsset(v);
      setLookup('');
      setSelected({ id: '', version: 1 });
    },
    load: () => {
      if (commandIdentifier(asset())) setLookup(asset());
    },
    select: (r: DefinitionRef) => setSelected(r),
    valid: () =>
      lookup() === asset() &&
      type.state().kind === 'ready' &&
      property.state().kind === 'ready' &&
      supportedProperty(properties(), selected()),
  };
}
export type BindingTargetController = ReturnType<typeof useBindingTarget>;
