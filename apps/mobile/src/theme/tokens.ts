import type { ThemeScheme } from '@fleetiq/theme-preference';

/** Semantic palette roles shared with the web theme. */
export const palettes = {
  light: {
    canvas: '#f4f7fa',
    surface: '#ffffff',
    outline: '#d8e0e8',
    foreground: '#142235',
    muted: '#475569',
    accent: '#006b8f',
    unknown: '#825700',
  },
  dark: {
    canvas: '#101b2a',
    surface: '#18273a',
    outline: '#3c5269',
    foreground: '#f1f7fc',
    muted: '#b8c8d7',
    accent: '#7ad3ed',
    unknown: '#f5c777',
  },
} as const;

export type ThemeColors = (typeof palettes)[ThemeScheme];

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const typography = { body: 16, label: 14, title: 30 } as const;
