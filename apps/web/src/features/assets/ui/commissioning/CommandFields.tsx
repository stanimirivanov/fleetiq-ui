import { createUniqueId, type JSX } from 'solid-js';
export const fieldClass = 'rounded border border-outline bg-canvas p-2 text-sm';
export function CommandField(props: {
  label: string;
  value: string;
  change: (value: string) => void;
  required?: boolean;
  maxLength?: number;
}) {
  const id = createUniqueId();
  return (
    <label for={id} class="grid gap-1 text-xs">
      {props.label}
      <input
        id={id}
        class={fieldClass}
        value={props.value}
        required={props.required ?? true}
        maxLength={props.maxLength ?? 128}
        onInput={(e) => props.change(e.currentTarget.value)}
      />
    </label>
  );
}
export function CommandForm(props: {
  label: string;
  submit: () => void;
  locked: boolean;
  valid: boolean;
  children: JSX.Element;
}) {
  return (
    <form
      aria-label={props.label}
      class="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (props.valid && !props.locked) props.submit();
      }}
    >
      <fieldset class="grid min-w-0 gap-3" disabled={props.locked}>
        {props.children}
        <button class="fi-action-button" type="submit" disabled={!props.valid}>
          Submit {props.label.toLowerCase()}
        </button>
      </fieldset>
    </form>
  );
}
