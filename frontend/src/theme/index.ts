import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const colors = {
  light: {
    primary: '#059669',
    primaryHover: '#047857',
    background: '#F8FAFC',
    screenTextPrimary: '#0F172A',
    screenTextSecondary: '#64748B',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textLabel: '#64748B',
    onSurface: '#0F172A',
    onSurfaceSecondary: '#64748B',
    onPrimary: '#FFFFFF',
    onBackground: '#0F172A',
    border: '#E2E8F0',
    divider: 'rgba(148, 163, 184, 0.24)',
    error: '#EF4444',
    success: '#10B981',
    accent: '#059669',
    accentLight: '#D1FAE5',
    cardShadow: 'rgba(5, 150, 105, 0.05)',
  },
  dark: {
    primary: '#D4A017',
    primaryHover: '#D4A017',
    background: '#EAE6DE',
    screenTextPrimary: '#111C14',
    screenTextSecondary: '#4B4A42',
    surface: '#111C14',
    surfaceElevated: '#111C14',
    textPrimary: '#E8E8E0',
    textSecondary: '#C8C8BC',
    textMuted: '#9A9A8A',
    textLabel: '#8B7D3A',
    onSurface: '#E8E8E0',
    onSurfaceSecondary: '#C8C8BC',
    onPrimary: '#111C14',
    onBackground: '#111C14',
    border: 'rgba(255,255,255,0.07)',
    divider: 'rgba(255,255,255,0.10)',
    error: '#F87171',
    success: '#D4A017',
    accent: '#D4A017',
    accentLight: 'rgba(212,160,23,0.12)',
    cardShadow: 'transparent',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
  xs: { fontSize: 12, fontWeight: '400' as const },
  arabic: { fontSize: 24, fontWeight: '400' as const, lineHeight: 44 },
  arabicLarge: { fontSize: 28, fontWeight: '400' as const, lineHeight: 52 },
  counter: { fontSize: 64, fontWeight: '700' as const },
};

export const SCREEN_WIDTH_CONST = SCREEN_WIDTH;

export type ThemeColors = typeof colors.light;
