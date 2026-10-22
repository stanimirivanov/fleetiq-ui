import { A, useLocation } from '@solidjs/router';
import { Show } from 'solid-js';
import {
  OperatorAccountControl,
  operatorConnectionLabel,
  useOperatorSession,
} from '#features/identity';
import { isDevelopmentSampleRoute } from '../sample-route';
import { ThemeButton } from '../theme/ThemeButton';
import { useThemePreference } from '../theme/use-theme-preference';

function HeaderIcon(props: { kind: 'search' | 'bell' | 'language' }) {
  const paths = {
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l4 4',
    bell: 'M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6z M10 20h4',
    language:
      'M3 5h11 M8 3v2 M12 5c-.4 5.2-3.3 8.6-8 11 M5 9c1.4 2.6 3.8 4.7 7 6 M14 20l4-10 4 10 M15 17h6',
  } as const;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="size-4.5"
    >
      <path d={paths[props.kind]} />
    </svg>
  );
}

/** Persistent product header and its locally owned theme preference. */
export function AppHeader() {
  const theme = useThemePreference();
  const operator = useOperatorSession();
  const location = useLocation();
  const sampleMode = () =>
    isDevelopmentSampleRoute(
      location.pathname,
      location.search,
      import.meta.env.DEV,
    );
  const sourceStatus = () =>
    sampleMode()
      ? 'Sample data · development'
      : operatorConnectionLabel(operator.state());

  return (
    <header class="fi-app-header sticky top-0 z-20 flex h-14 xl:grid items-center gap-3 border-b border-outline bg-surface px-3 sm:px-5">
      <div class="fi-header-identity flex min-w-0 shrink-0 items-center gap-3">
        <A
          href="/"
          class="fi-brand flex shrink-0 items-center gap-2 text-foreground no-underline"
        >
          <span
            aria-hidden="true"
            class="grid size-8 place-items-center rounded-md bg-accent text-[0.65rem] font-extrabold tracking-tight text-on-accent"
          >
            FI
          </span>
          <span class="text-base font-bold tracking-tight">FleetIQ</span>
        </A>
        <Show when={sampleMode()}>
          <div class="fi-tenant-context hidden min-w-0 items-center gap-2 border-l border-outline pl-3 lg:flex">
            <span
              aria-hidden="true"
              class="size-1.5 shrink-0 rounded-full bg-accent"
            />
            <span class="min-w-0 truncate text-xs font-semibold text-foreground">
              Northern Corridor Operations
            </span>
            <span class="rounded border border-outline px-1.5 py-0.5 text-[0.625rem] font-medium text-muted">
              Sample
            </span>
          </div>
        </Show>
      </div>
      <button
        type="button"
        disabled
        title="Fleet search is planned"
        class="fi-header-search hidden w-full min-w-0 items-center gap-2 rounded-md border border-outline bg-canvas px-3 py-1.5 text-xs text-muted xl:flex"
      >
        <HeaderIcon kind="search" />
        <span>Search fleet</span>
        <span class="ml-auto text-[0.625rem] uppercase tracking-wide">
          Planned
        </span>
      </button>
      <div class="fi-header-actions ml-auto flex min-w-0 shrink-0 items-center justify-end gap-2">
        <span class="hidden whitespace-nowrap text-xs font-medium text-muted md:inline">
          {sourceStatus()}
        </span>
        <div class="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <ThemeButton
            preference={theme.preference}
            resolvedTheme={theme.resolvedTheme}
            onCycle={theme.cycle}
          />
          <button
            type="button"
            disabled
            aria-label="Language selection planned"
            title="Language selection is planned"
            class="fi-header-icon hidden lg:grid"
          >
            <HeaderIcon kind="language" />
          </button>
          <button
            type="button"
            disabled
            aria-label="Notifications planned"
            title="Notifications are planned"
            class="fi-header-icon"
          >
            <HeaderIcon kind="bell" />
          </button>
          <OperatorAccountControl />
        </div>
      </div>
    </header>
  );
}
