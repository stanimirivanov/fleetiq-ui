/** Light operator palette; dark-theme tokens arrive in a separate slice. */
export const colors = {
  canvas: '#f4f7fa',
  surface: '#ffffff',
  outline: '#d8e0e8',
  foreground: '#142235',
  muted: '#475569',
  accent: '#006b8f',
  unknown: '#825700',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const typography = { body: 16, label: 14, title: 30 } as const;
