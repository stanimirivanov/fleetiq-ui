import { For } from 'solid-js';
import { TextLink } from '#shared/ui';
import type { FleetAsset } from '../../model/fleet';
export function OverviewAssetTable(props: {
  readonly assets: readonly FleetAsset[];
  readonly selected: string | null;
  readonly select: (id: string) => void;
  readonly inspect: (id: string) => string;
}) {
  return (
    <section
      class="max-h-80 overflow-auto"
      aria-label="Loaded asset discovery table"
    >
      <table class="w-full text-left text-xs">
        <thead>
          <tr>
            <th scope="col" class="p-2">
              Asset
            </th>
            <th scope="col" class="p-2">
              Type
            </th>
            <th scope="col" class="p-2">
              Location evidence
            </th>
            <th scope="col" class="p-2">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={props.assets}>
            {(asset) => (
              <tr class="border-t border-outline">
                <th scope="row" class="p-2 font-normal">
                  <button
                    type="button"
                    aria-pressed={props.selected === asset.id}
                    class="text-left font-semibold text-accent underline-offset-2 hover:underline aria-pressed:underline"
                    onClick={() => props.select(asset.id)}
                  >
                    {asset.name}
                  </button>
                  <span class="block break-all text-muted">{asset.id}</span>
                </th>
                <td class="p-2">
                  {asset.type.id} v{asset.type.version}
                </td>
                <td class="p-2">
                  {asset.location.status === 'observed'
                    ? `${asset.location.point.freshness} · ${asset.location.point.quality}`
                    : asset.location.status.replaceAll('_', ' ')}
                </td>
                <td class="p-2">
                  <TextLink href={props.inspect(asset.id)}>
                    Inspect {asset.name}
                  </TextLink>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </section>
  );
}
