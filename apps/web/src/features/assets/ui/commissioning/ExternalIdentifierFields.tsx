import { Index } from 'solid-js';
import type { ExternalIdentifier } from '../../model/metadata';
import { CommandField } from './CommandFields';
export function ExternalIdentifierFields(props: {
  values: readonly ExternalIdentifier[];
  change: (values: readonly ExternalIdentifier[]) => void;
}) {
  const update = (
    index: number,
    key: keyof ExternalIdentifier,
    value: string,
  ) =>
    props.change(
      props.values.map((row, i) =>
        i === index
          ? { ...row, [key]: key === 'authority' && !value ? null : value }
          : row,
      ),
    );
  return (
    <section aria-label="External identifiers" class="grid gap-2">
      <p class="text-xs text-muted">
        Optional typed identifiers. Blank authority means no authority; internal
        ID remains separate.
      </p>
      <Index each={props.values}>
        {(row, index) => (
          <div class="grid gap-2 rounded border border-outline p-2 sm:grid-cols-3">
            <CommandField
              label={`Identifier ${index + 1} kind`}
              value={row().kind}
              change={(v) => update(index, 'kind', v)}
            />
            <CommandField
              label={`Identifier ${index + 1} authority`}
              required={false}
              value={row().authority ?? ''}
              change={(v) => update(index, 'authority', v)}
            />
            <CommandField
              label={`Identifier ${index + 1} value`}
              value={row().value}
              change={(v) => update(index, 'value', v)}
            />
            <button
              type="button"
              class="fi-action-button"
              onClick={() =>
                props.change(props.values.filter((_, i) => i !== index))
              }
            >
              Remove identifier {index + 1}
            </button>
          </div>
        )}
      </Index>
      <button
        type="button"
        class="fi-action-button"
        disabled={props.values.length >= 100}
        onClick={() =>
          props.change([
            ...props.values,
            { kind: '', authority: null, value: '' },
          ])
        }
      >
        Add external identifier
      </button>
    </section>
  );
}
