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
    if (isDark) {
      return colors.dark.primary;
    }

    try {
      const lat = location?.latitude ?? 21.422487;
      const lng = location?.longitude ?? 39.826206;
      const times = getPrayerTimes(new Date(now), lat, lng, calculationMethod, madhhab, offsets);
      const next = times.find(p => p.isNext) || times[0];
      
      switch (next?.name) {
        case 'fajr':
        case 'sunrise': return '#d97706';
        case 'dhuhr': return '#0284c7';
        case 'asr': return '#0369a1';
        case 'maghrib': return '#ea580c';
        case 'isha': return '#4f46e5';
        default: return colors.light.primary;
      }
    } catch {
      // Fallback to blue (Dhuhr) if calculation fails, matching the Home screen fallback
      return '#0284c7';
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
    isDark,
    shadows: isDark 
      ? { none: shadows.none, sm: shadows.none, md: shadows.none } 
      : { ...shadows, sm: { ...shadows.sm, shadowColor: dynamicPrimary }, md: { ...shadows.md, shadowColor: dynamicPrimary } },
  };
};
