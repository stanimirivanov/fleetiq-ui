import type { ThemePreference } from '@fleetiq/theme-preference';
import { Icon } from '../app/Icons';
import { useTheme } from './ThemeProvider';

const sequence: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function ThemeControl() {
  const { preference, saveFailed, setPreference } = useTheme();
  const next =
    sequence[(sequence.indexOf(preference) + 1) % sequence.length] ?? 'light';

  return (
    <div className="relative">
      <button
        aria-label={`Theme: ${preference}. Switch to ${next}.`}
        className="grid size-10 place-items-center rounded-lg text-foreground transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onClick={() => setPreference(next)}
        title={`Theme: ${preference}. Switch to ${next}.`}
        type="button"
      >
        <Icon
          name={
            preference === 'light'
              ? 'sun'
              : preference === 'dark'
                ? 'moon'
                : 'system'
          }
        />
      </button>
      {saveFailed && (
        <span
          className="absolute right-0 top-full z-40 w-48 rounded-lg border border-outline bg-surface p-2 text-xs text-foreground shadow-lg"
          role="alert"
        >
          Theme choice could not be saved.
        </span>
      )}
    </div>
  );
}
