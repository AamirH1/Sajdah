import { useColorScheme } from 'react-native';
import { useSettings } from '../store/useSettings';
import { colors, ThemeColors } from '../theme';

export function useThemeColors(): ThemeColors {
  const systemScheme = useColorScheme();
  const { theme } = useSettings();

  const effectiveTheme = theme === 'system' ? (systemScheme || 'light') : theme;
  return colors[effectiveTheme];
}
