import { For } from 'solid-js';
import type { NumericSummary } from '../../../model/history-review-types';
import { metadataButtonClass } from '../MetadataPanel';
export function SummaryEvidence(props: {
  readonly page: NumericSummary;
  readonly after?: string;
  readonly pageTo: (token: string | null) => void;
  readonly refresh: () => void;
}) {
  return (
    <div class="grid min-w-0 gap-3">
      <p role="status" class="rounded-lg border border-outline p-2 text-xs">
        Numeric summary — derived buckets, not raw interpretations. Summary
        publication {props.page.series}, revision {props.page.revision}.{' '}
        {props.page.restore
          ? `Hot and selected manifest ${props.page.restore.manifestId}, generation ${props.page.restore.generation}`
          : 'Hot snapshot only'}
        ; not complete interval coverage.
      </p>
      <p class="text-xs text-muted">
        Only good-quality samples contribute. Mean is the exact sum/count pair,
        undefined at zero count. Unit: {props.page.unit ?? 'No canonical unit'}.
        Refresh starts a new review; continuation retains the original
        publication.
      </p>
      <div class="min-w-0 overflow-x-auto">
        <table class="w-full text-left text-xs">
          <caption class="sr-only">Exact numeric summary buckets</caption>
          <thead>
            <tr>
              <For
                each={[
                  'Bucket (Unix ms, half-open)',
                  'Good / total / excluded',
                  'Minimum',
                  'Maximum',
                  'Sum',
                  'Exact mean (sum/count)',
                ]}
              >
                {(label) => (
                  <th scope="col" class="p-2">
                    {label}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={props.page.buckets}>
              {(b) => (
                <tr class="border-t border-outline">
                  <td class="p-2">
                    <code>
                      {b.start}–{b.end}
                    </code>
                  </td>
                  <td class="p-2">
                    {b.count} / {b.total} / {b.excluded}
                  </td>
                  <td class="break-all p-2">
                    <code>{b.min ?? '—'}</code>
                  </td>
                  <td class="break-all p-2">
                    <code>{b.max ?? '—'}</code>
                  </td>
                  <td class="break-all p-2">
                    <code>{b.sum}</code>
                  </td>
                  <td class="break-all p-2">
                    <code>
                      {b.count
                        ? `${b.sum} / ${b.count}`
                        : 'Undefined (no good samples)'}
                    </code>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class={metadataButtonClass}
          disabled={!props.after}
          onClick={() => props.pageTo(null)}
        >
          First summary page
        </button>
        <button
          type="button"
          class={metadataButtonClass}
          disabled={!props.page.nextAfter}
          onClick={() => props.pageTo(props.page.nextAfter)}
        >
          Next summary page
        </button>
        <button
          type="button"
          class={metadataButtonClass}
          onClick={props.refresh}
        >
          Refresh summary
        </button>
      </div>
    </div>
  );
}
