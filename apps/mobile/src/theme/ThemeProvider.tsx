import {
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@fleetiq/theme-preference';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Appearance, Platform, useColorScheme, View } from 'react-native';
import { palettes } from './tokens';

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: 'light' | 'dark';
  colors: (typeof palettes)['light'] | (typeof palettes)['dark'];
  saveFailed: boolean;
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Native storage and appearance remain behind the mobile app boundary. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, updatePreference] = useState<ThemePreference>('light');
  const [hydrated, setHydrated] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const system = useColorScheme();
  const scheme = resolveTheme(preference, system === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (mounted) updatePreference(parseThemePreference(value));
      })
      .catch(() => {
        if (mounted) setSaveFailed(true);
      })
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (hydrated)
      Appearance.setColorScheme(
        preference === 'system' ? 'unspecified' : preference,
      );
    return () => Appearance.setColorScheme('unspecified');
  }, [hydrated, preference]);

  function setPreference(value: ThemePreference) {
    updatePreference(value);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, value).then(
      () => setSaveFailed(false),
      () => setSaveFailed(true),
    );
  }

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: palettes.light.canvas }} />;
  }

  return (
    <ThemeContext.Provider
      value={{
        preference,
        scheme,
        colors: palettes[scheme],
        saveFailed,
        setPreference,
      }}
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
