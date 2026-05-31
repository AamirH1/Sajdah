export const colors = {
  light: {
    primary: '#059669',
    primaryVariant: '#047857',
    onPrimary: '#FFFFFF',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    onBackground: '#0F172A',
    onSurface: '#1E293B',
    onSurfaceSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  dark: {
    primary: '#10B981',
    primaryVariant: '#34D399',
    onPrimary: '#1E293B',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    onBackground: '#F8FAFC',
    onSurface: '#F8FAFC',
    onSurfaceSecondary: '#94A3B8',
    border: '#334155',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
  }
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };

export const typography = {
  displayLg: { fontSize: 48, fontWeight: '700' as const, lineHeight: 56 },
  headline: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  title: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  xs: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
};

export const shadows = {
  none: { elevation: 0, shadowOpacity: 0 },
  sm: { shadowColor: '#059669', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
};