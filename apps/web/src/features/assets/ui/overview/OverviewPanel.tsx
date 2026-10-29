import type { JSX } from 'solid-js';
export function OverviewPanel(props: {
  readonly title: string;
  readonly description?: string;
  readonly action?: JSX.Element;
  readonly children: JSX.Element;
}) {
  return (
    <section
      aria-label={props.title}
      class="min-w-0 overflow-hidden rounded-panel border border-outline bg-surface shadow-sm"
    >
      <header class="flex flex-wrap items-start justify-between gap-2 border-b border-outline px-4 py-3">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold">{props.title}</h2>
          <p class="mt-1 text-xs text-muted">{props.description}</p>
        </div>
        {props.action}
      </header>
      <div class="p-4">{props.children}</div>
    </section>
  );
}
