import type { ReactNode } from 'react';
import { NavLink, useMatch } from 'react-router';
import { ThemeControl } from '../theme/ThemeControl';
import { BrandMark, Icon } from './Icons';

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    isActive
      ? 'bg-accent text-surface'
      : 'text-muted hover:bg-canvas hover:text-foreground',
  ].join(' ');
}

/** Persistent product chrome owns layout and navigation, never feature data. */
export function AppShell({ children }: { children: ReactNode }) {
  const assetRoute = useMatch('/tenants/:tenantId/assets/*');
  const assetList = useMatch('/tenants/:tenantId/assets');
  const tenantId =
    assetRoute?.params.tenantId ?? assetList?.params.tenantId ?? 'tenant-a';
  const assetsPath = `/tenants/${encodeURIComponent(tenantId)}/assets`;

  return (
    <div className="min-h-dvh bg-canvas text-foreground lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:grid-rows-[4rem_minmax(0,1fr)]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline bg-surface px-4 shadow-sm sm:px-6 lg:col-span-2">
        <NavLink
          aria-label="FleetIQ overview"
          className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          to="/"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-surface">
            <BrandMark />
          </span>
          <span className="text-lg font-semibold tracking-tight">FleetIQ</span>
        </NavLink>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            aria-label="Language: English; other languages are not available"
            className="flex h-10 items-center gap-2 rounded-lg px-2 text-muted sm:px-3"
            disabled
            title="Only English is available"
            type="button"
          >
            <Icon name="globe" />
            <span className="hidden text-sm sm:inline">English</span>
          </button>
          <ThemeControl />
          <button
            aria-label="Notifications are not connected"
            className="grid size-10 place-items-center rounded-lg text-muted"
            disabled
            title="Notifications are not connected"
            type="button"
          >
            <Icon name="bell" />
          </button>
          <button
            aria-label="Account is not connected"
            className="grid size-10 place-items-center rounded-full border border-outline bg-canvas text-muted"
            disabled
            title="Account is not connected"
            type="button"
          >
            <Icon name="user" />
          </button>
        </div>
      </header>
      <aside className="border-b border-outline bg-surface px-3 py-3 lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:flex lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <nav aria-label="Primary navigation" className="flex gap-2 lg:flex-col">
          <div className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted lg:block">
            Workspace
          </div>
          <NavLink className={navClass} end to="/">
            <Icon name="overview" />
            Overview
          </NavLink>
          <div className="hidden px-3 pb-2 pt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted lg:block">
            Assets
          </div>
          <NavLink className={navClass} to={assetsPath}>
            <Icon name="assets" />
            Asset catalogue
          </NavLink>
        </nav>
        <p className="mt-auto hidden border-t border-outline px-3 pt-4 text-xs leading-5 text-muted lg:block">
          Asset identities are a development preview. Live operations are not
          connected.
        </p>
      </aside>
      <div className="min-w-0">
        <div className="mx-auto w-full max-w-[90rem]">{children}</div>
      </div>
    </div>
  );
}
