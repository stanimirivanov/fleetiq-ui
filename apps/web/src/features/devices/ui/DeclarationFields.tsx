import { Index } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { Endpoint, Identifier } from '../model/devices';
import { buttonClass, DeviceField, inputClass } from './DevicePrimitives';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** Declaration rows retain index owners while editing; no raw JSON entry is needed. */
export function IdentifierFields(props: {
  changed: (rows: readonly Identifier[]) => void;
}) {
  const [rows, setRows] = createStore<Mutable<Identifier>[]>([]);
  const update = (
    index: number,
    key: 'kind' | 'authority' | 'value',
    value: string,
  ) => {
    setRows(index, key, key === 'authority' && value === '' ? null : value);
    props.changed(rows.map((r) => ({ ...r })));
  };
  return (
    <div class="grid gap-3">
      <Index each={rows}>
        {(row, index) => (
          <div class="grid gap-2 rounded border border-outline p-3">
            <DeviceField label={`Identifier ${index + 1} kind`}>
              {(controlId) => (
                <>
                  <input
                    id={controlId}
                    class={inputClass}
                    value={row().kind}
                    onInput={(e) =>
                      update(index, 'kind', e.currentTarget.value)
                    }
                  />
                </>
              )}
            </DeviceField>
            <DeviceField label={`Identifier ${index + 1} authority (optional)`}>
              {(controlId) => (
                <>
                  <input
                    id={controlId}
                    class={inputClass}
                    value={row().authority ?? ''}
                    onInput={(e) =>
                      update(index, 'authority', e.currentTarget.value)
                    }
                  />
                </>
              )}
            </DeviceField>
            <DeviceField label={`Identifier ${index + 1} value`}>
              {(controlId) => (
                <>
                  <input
                    id={controlId}
                    class={inputClass}
                    value={row().value}
                    onInput={(e) =>
                      update(index, 'value', e.currentTarget.value)
                    }
                  />
                </>
              )}
            </DeviceField>
            <button
              type="button"
              class={buttonClass}
              onClick={() => {
                setRows(rows.filter((_, i) => i !== index));
                props.changed(rows.map((r) => ({ ...r })));
              }}
            >
              Remove identifier {index + 1}
            </button>
          </div>
        )}
      </Index>
      <button
        type="button"
        class={buttonClass}
        disabled={rows.length >= 100}
        onClick={() => {
          setRows([...rows, { kind: '', authority: null, value: '' }]);
          props.changed(rows.map((r) => ({ ...r })));
        }}
      >
        Add external identifier
      </button>
      <p class="text-xs text-muted">
        IMEI and serial numbers are external identifiers, not internal asset IDs
        or proof of authentication.
      </p>
    </div>
  );
}
export function EndpointFields(props: {
  changed: (rows: readonly Endpoint[]) => void;
}) {
  const [rows, setRows] = createStore<Mutable<Endpoint>[]>([]);
  return (
    <div class="grid gap-3">
      <Index each={rows}>
        {(row, index) => (
          <div class="grid gap-2 rounded border border-outline p-3">
            <Index each={['id', 'kind', 'name'] as const}>
              {(key) => (
                <DeviceField label={`Endpoint ${index + 1} ${key()}`}>
                  {(controlId) => (
                    <>
                      <input
                        id={controlId}
                        class={inputClass}
                        value={row()[key()]}
                        onInput={(e) => {
                          setRows(index, key(), e.currentTarget.value);
                          props.changed(rows.map((r) => ({ ...r })));
                        }}
                      />
                    </>
                  )}
                </DeviceField>
              )}
            </Index>
            <button
              type="button"
              class={buttonClass}
              onClick={() => {
                setRows(rows.filter((_, i) => i !== index));
                props.changed(rows.map((r) => ({ ...r })));
              }}
            >
              Remove endpoint {index + 1}
            </button>
          </div>
        )}
      </Index>
      <button
        type="button"
        class={buttonClass}
        disabled={rows.length >= 100}
        onClick={() => {
          setRows([...rows, { id: '', kind: '', name: '' }]);
          props.changed(rows.map((r) => ({ ...r })));
        }}
      >
        Add endpoint
      </button>
      <p class="text-xs text-muted">
        Endpoint IDs are unique within this device. Declaration order is
        retained. An empty declaration is valid.
      </p>
    </div>
  );
}
