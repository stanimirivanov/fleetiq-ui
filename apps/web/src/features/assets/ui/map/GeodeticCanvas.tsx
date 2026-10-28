import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { MapOwner } from '../../api/maplibre-adapter';
import type { FleetAsset } from '../../model/fleet';
export function GeodeticCanvas(props: {
  readonly assets: readonly FleetAsset[];
  readonly selected: string | null;
  readonly select: (id: string) => void;
}) {
  let container: HTMLDivElement | undefined;
  const [owner, setOwner] = createSignal<MapOwner>();
  const [message, setMessage] = createSignal('Opening geographic renderer…');
  let active = true;
  onMount(() => {
    void import('../../api/maplibre-adapter').then(
      ({ mountFleetMap }) => {
        if (!active || !container) return;
        try {
          setOwner(mountFleetMap(container, props.select, setMessage));
        } catch {
          setMessage(
            'Geographic rendering unavailable. Use the accessible asset list.',
          );
        }
      },
      () => {
        if (active)
          setMessage(
            'Map renderer could not load. Use the accessible asset list.',
          );
      },
    );
  });
  createEffect(() => owner()?.update(props.assets, props.selected));
  onCleanup(() => {
    active = false;
    owner()?.dispose();
  });
  return (
    <section
      class="grid min-w-0 gap-2"
      aria-label="Observed geographic positions"
    >
      <div
        ref={container}
        class="h-[32rem] overflow-hidden rounded-xl border border-outline bg-surface"
        data-testid="geodetic-canvas"
      />
      <p role="status" class="text-xs text-muted">
        {message()}
      </p>
    </section>
  );
}
