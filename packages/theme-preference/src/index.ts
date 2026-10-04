/** Persisted choice. An absent or invalid value preserves the light default. */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeScheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'fleetiq.theme.preference.v1';

/** Validate storage input without allowing an unknown value to select dark mode. */
export function parseThemePreference(value: unknown): ThemePreference {
  return value === 'dark' || value === 'system' ? value : 'light';
}

/** Explicit choices take precedence; system mode falls back to light. */
export function resolveTheme(
  preference: ThemePreference,
  systemScheme: ThemeScheme | null | undefined,
): ThemeScheme {
  return preference === 'system'
    ? systemScheme === 'dark'
      ? 'dark'
      : 'light'
    : preference;
}
