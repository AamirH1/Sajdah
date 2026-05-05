import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const colors = {
  light: {
    primary: '#059669',
    primaryHover: '#047857',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    error: '#EF4444',
    success: '#10B981',
    accent: '#059669',
    accentLight: '#D1FAE5',
    cardShadow: 'rgba(5, 150, 105, 0.05)',
  },
  dark: {
    primary: '#10B981',
    primaryHover: '#34D399',
    background: '#0F172A',
    surface: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    error: '#F87171',
    success: '#34D399',
    accent: '#10B981',
    accentLight: '#064E3B',
    cardShadow: 'rgba(0, 0, 0, 0.3)',
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
