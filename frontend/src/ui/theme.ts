export const colors = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    surfaceMuted: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: 'rgba(148, 163, 184, 0.45)',
    divider: 'rgba(148, 163, 184, 0.24)',
    primary: '#059669',
    primarySoft: 'rgba(5, 150, 105, 0.10)',
    success: '#10B981',
    successSoft: 'rgba(16, 185, 129, 0.10)',
    error: '#EF4444',
    errorSoft: 'rgba(239, 68, 68, 0.12)',
    warning: '#F59E0B',
    chipBackground: 'rgba(148, 163, 184, 0.12)',
    onPrimary: '#FFFFFF',
  },
  dark: {
    background: '#050814',
    surface: '#0B1020',
    surfaceAlt: '#0F172A',
    surfaceMuted: '#020617',
    textPrimary: '#E5E9F5',
    textSecondary: '#9CA3B8',
    textMuted: '#6B7280',
    border: 'rgba(148, 163, 184, 0.45)',
    divider: 'rgba(148, 163, 184, 0.24)',
    primary: '#F59E4A',
    primarySoft: 'rgba(245, 158, 74, 0.10)',
    success: '#22C55E',
    successSoft: 'rgba(34, 197, 94, 0.10)',
    error: '#F97373',
    errorSoft: 'rgba(248, 113, 113, 0.12)',
    warning: '#FACC15',
    chipBackground: 'rgba(148, 163, 184, 0.12)',
    onPrimary: '#0B1020',
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