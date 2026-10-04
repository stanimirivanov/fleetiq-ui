import { useTheme } from './ThemeProvider';

export function ThemeControl() {
  const { preference, saveFailed, setPreference } = useTheme();

  return (
    <div className="absolute right-5 top-6 z-10 flex items-center gap-2 text-sm text-foreground sm:right-8">
      <label htmlFor="theme-preference">Appearance</label>
      <select
        className="rounded-lg border border-outline bg-surface px-2 py-1.5 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        id="theme-preference"
        onChange={(event) =>
          setPreference(event.target.value as 'light' | 'dark' | 'system')
        }
        value={preference}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      {saveFailed && <span role="alert">Theme choice could not be saved.</span>}
    </div>
  );
}
