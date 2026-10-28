import type { JSX } from 'solid-js';
import { StatusBadge, type StatusTone } from '#shared/ui';
/** Setup, validation and authorization failures are distinct from empty fleet data. */
export function MapNotice(props: {
  readonly heading: string;
  readonly label: string;
  readonly tone: StatusTone;
  readonly children: JSX.Element;
}) {
  return (
    <section
      class="grid gap-3 rounded-panel border border-outline bg-surface p-5"
      aria-label={props.heading}
    >
      <StatusBadge label={props.label} tone={props.tone} />
      <h2 class="text-lg font-semibold">{props.heading}</h2>
      <p class="text-sm text-muted">{props.children}</p>
    </section>
  );
}
