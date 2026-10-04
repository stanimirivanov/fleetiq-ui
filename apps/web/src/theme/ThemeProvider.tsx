import {
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
  type ThemeScheme,
} from '@fleetiq/theme-preference';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: ThemeScheme;
  saveFailed: boolean;
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function storedPreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

function systemScheme(): ThemeScheme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/** Apply the saved palette before mock setup and React rendering. */
export function initializeDocumentTheme() {
  document.documentElement.dataset.theme = resolveTheme(
    storedPreference(),
    systemScheme(),
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, updatePreference] = useState(storedPreference);
  const [system, updateSystem] = useState(systemScheme);
  const [saveFailed, setSaveFailed] = useState(false);
  const scheme = resolveTheme(preference, system);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const onChange = () => updateSystem(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = scheme;
  }, [scheme]);

  function setPreference(value: ThemePreference) {
    updatePreference(value);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, value);
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }

  return (
    <ThemeContext.Provider
      value={{ preference, scheme, saveFailed, setPreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider is missing');
  return value;
}
