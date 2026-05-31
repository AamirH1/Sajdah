import { useMemo, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '../../store/useSettings';
import { getPrayerTimes } from '../../services/prayer';
import { colors, spacing, radius, typography, shadows } from '../theme';

export const useTheme = () => {
  const { theme: userTheme, location, calculationMethod, madhhab, offsets } = useSettings();
  const systemTheme = useColorScheme();
  const activeTheme = userTheme === 'system' ? (systemTheme || 'light') : userTheme;
  const isDark = activeTheme === 'dark';

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Force re-evaluation of dynamic colors every minute to catch prayer time rollovers seamlessly
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dynamicPrimary = useMemo(() => {
    try {
      const lat = location?.latitude ?? 21.422487;
      const lng = location?.longitude ?? 39.826206;
      const times = getPrayerTimes(new Date(now), lat, lng, calculationMethod, madhhab, offsets);
      const next = times.find(p => p.isNext) || times[0];
      
      switch (next?.name) {
        case 'fajr':
        case 'sunrise': return isDark ? '#f59e0b' : '#d97706'; // Amber/Orange
        case 'dhuhr': return isDark ? '#38bdf8' : '#0284c7'; // Light Blue
        case 'asr': return isDark ? '#0ea5e9' : '#0369a1'; // Mid Blue
        case 'maghrib': return isDark ? '#f97316' : '#ea580c'; // Orange
        case 'isha': return isDark ? '#818cf8' : '#4f46e5'; // Indigo (since #1e1b4b is too dark for UI elements)
        default: return isDark ? colors.dark.primary : colors.light.primary;
      }
    } catch {
      // Fallback to blue (Dhuhr) if calculation fails, matching the Home screen fallback
      return isDark ? '#38bdf8' : '#0284c7';
    }
  }, [now, location?.latitude, location?.longitude, calculationMethod, madhhab, offsets, isDark]);

  const currentColors = isDark ? colors.dark : colors.light;

  return {
    colors: {
      ...currentColors,
      primary: dynamicPrimary,
    },
    spacing,
    radius,
    typography,
    shadows: isDark 
      ? { ...shadows, sm: { ...shadows.sm, shadowColor: '#000', shadowOpacity: 0.3 }, md: { ...shadows.md, shadowColor: '#000', shadowOpacity: 0.4 } } 
      : { ...shadows, sm: { ...shadows.sm, shadowColor: dynamicPrimary }, md: { ...shadows.md, shadowColor: dynamicPrimary } },
  };
};