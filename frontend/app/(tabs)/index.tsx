import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettings } from '../../src/store/useSettings';
import { getPrayerTimes, formatPrayerTime, PrayerName, PrayerTimeResult } from '../../src/services/prayer';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { ScreenContainer, Card } from '../../src/ui/components';

export default function HomeScreen() {
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const router = useRouter();
  const { location, calculationMethod, madhhab, offsets } = useSettings();

  const [now, setNow] = useState(new Date());

  // Keep 'now' continuously in sync with the device clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Extract string to reliably trigger memoized schedule recalculations only when the calendar day changes
  const todayStr = now.toLocaleDateString();

  const calculateTimes = (date: Date): PrayerTimeResult[] => {
    try {
      const rawTimes = getPrayerTimes(
        date,
        location.latitude,
        location.longitude,
        calculationMethod,
        madhhab,
        offsets
      );

      // Clone times so we can safely mutate the Date objects
      const times = rawTimes.map(p => ({ ...p, time: new Date(p.time) }));
      
      const fajr = times.find(t => t.name === 'fajr');
      const sunrise = times.find(t => t.name === 'sunrise');
      const maghrib = times.find(t => t.name === 'maghrib');
      const isha = times.find(t => t.name === 'isha');

      if (fajr && isha && maghrib && sunrise) {
        const fH = fajr.time.getHours();
        const fM = fajr.time.getMinutes();
        const iH = isha.time.getHours();
        const iM = isha.time.getMinutes();
        
        // High Latitude Bug Fix:
        // For extreme latitudes (like London) in summer, standard calculation fallbacks
        // force Fajr and Isha to converge to the exact same minute (e.g., 12:58 AM).
        // We intercept this and apply the trusted 'Seventh of the Night' calculation.
        if (fH === iH && Math.abs(fM - iM) <= 1) {
          console.log('High latitude convergence detected (Fajr/Isha match). Applying Seventh of the Night correction.');
          const dayDuration = maghrib.time.getTime() - sunrise.time.getTime();
          const nightDurationMs = (24 * 3600000) - dayDuration;
          const portionMs = nightDurationMs / 7;

          isha.time = new Date(maghrib.time.getTime() + portionMs);
          fajr.time = new Date(sunrise.time.getTime() - portionMs);
        }
      }

      return times;
    } catch (e) {
      // Fallback prayer times
      const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return [
        { name: 'fajr' as const, label: 'Fajr', time: new Date(base.getTime() + 5 * 3600000), isNext: false },
        { name: 'sunrise' as const, label: 'Sunrise', time: new Date(base.getTime() + 6.25 * 3600000), isNext: false },
        { name: 'dhuhr' as const, label: 'Dhuhr', time: new Date(base.getTime() + 12.25 * 3600000), isNext: false },
        { name: 'asr' as const, label: 'Asr', time: new Date(base.getTime() + 15.75 * 3600000), isNext: false },
        { name: 'maghrib' as const, label: 'Maghrib', time: new Date(base.getTime() + 18.5 * 3600000), isNext: false },
        { name: 'isha' as const, label: 'Isha', time: new Date(base.getTime() + 20 * 3600000), isNext: false },
      ];
    }
  };

  const todayPrayerTimes = useMemo(() => calculateTimes(new Date()), [todayStr, location.latitude, location.longitude, calculationMethod, madhhab, offsets]);
  
  const tomorrowPrayerTimes = useMemo(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return calculateTimes(tmrw);
  }, [todayStr, location.latitude, location.longitude, calculationMethod, madhhab, offsets]);

  const nextPrayer = useMemo<PrayerTimeResult | null>(() => {
    // Find the first prayer strictly AFTER the exact current time
    let next = todayPrayerTimes.find((p) => p.time.getTime() > now.getTime());
    
    // If none are left today (after Isha), tomorrow's Fajr is the next prayer
    if (!next && tomorrowPrayerTimes.length > 0) {
      next = tomorrowPrayerTimes[0];
    }
    
    return next || null;
  }, [todayPrayerTimes, tomorrowPrayerTimes, now]);

  // Isolate UI list data so the active indicator turns off today if we are waiting for tomorrow's Fajr
  const displayPrayerTimes = useMemo(() => {
    return todayPrayerTimes.map(p => ({
      ...p,
      isNext: nextPrayer ? p.name === nextPrayer.name && p.time.getTime() === nextPrayer.time.getTime() : false
    }));
  }, [todayPrayerTimes, nextPrayer]);

  const countdown = useMemo(() => {
    if (!nextPrayer) return { hours: 0, minutes: 0, seconds: 0 };
    const diffMs = Math.max(0, nextPrayer.time.getTime() - now.getTime());
    return {
      hours: Math.floor(diffMs / (1000 * 60 * 60)),
      minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diffMs % (1000 * 60)) / 1000),
    };
  }, [now, nextPrayer]);

  const getPrayerGradient = (prayerName?: string) => {
    if (isDark) return ['#020617', '#0B1020'] as const;
    switch(prayerName) {
      case 'fajr': return ['#1e3a8a', '#f59e0b'] as const;
      case 'sunrise': return ['#f59e0b', '#fbbf24'] as const;
      case 'dhuhr': return ['#38bdf8', '#0284c7'] as const;
      case 'asr': return ['#0ea5e9', '#0369a1'] as const;
      case 'maghrib': return ['#ea580c', '#431407'] as const;
      case 'isha': return ['#1e1b4b', '#1e3a8a'] as const;
      default: return ['#059669', '#047857'] as const;
    }
  };

  const quickActions = [
    { icon: 'book-outline' as const, label: 'Quran', testID: 'quick-action-quran', href: '/quran' as const },
    { icon: 'compass-outline' as const, label: 'Qibla', testID: 'quick-action-qibla', href: '/qibla' as const },
    { icon: 'calendar-outline' as const, label: 'Hijri', testID: 'quick-action-hijri', href: '/hijri' as const },
    { icon: 'sunny-outline' as const, label: 'Azkar', testID: 'quick-action-morning-azkar', href: '/azkar/morning' as const },
    { icon: 'radio-button-on-outline' as const, label: 'Tasbih', testID: 'quick-action-tasbih', href: '/tasbih' as const },
  ];

  const getPrayerIcon = (prayerName: PrayerName): keyof typeof Ionicons.glyphMap => {
    switch (prayerName) {
      case 'fajr':
        return 'moon-outline';
      case 'sunrise':
        return 'partly-sunny-outline';
      case 'dhuhr':
        return 'sunny';
      case 'asr':
        return 'sunny-outline';
      case 'maghrib':
        return 'cloudy-night-outline';
      case 'isha':
        return 'moon';
      default:
        return 'time-outline';
    }
  };

  const heroTextColor = isDark ? colors.textPrimary : colors.onPrimary;
  const heroSubTextColor = isDark ? colors.textSecondary : 'rgba(255,255,255,0.85)';

  return (
    <ScreenContainer heroGradient={getPrayerGradient(nextPrayer?.name)}>
      <View style={{ paddingHorizontal: spacing.lg, flex: 1 }}>
        
        {/* Header */}
        <View style={styles.heroContainer}>
          <View>
            <Text style={[typography.xs, { color: heroSubTextColor, marginBottom: 2 }]}>
              Assalamu Alaikum
            </Text>
            <Text style={[typography.headline, { color: heroTextColor }]}>Prayer Times</Text>
          </View>
          <View style={[styles.heroLocationBadge, { backgroundColor: isDark ? colors.chipBackground : 'rgba(255,255,255,0.22)' }]}>
            <Ionicons name="location" size={14} color={heroTextColor} />
            <Text style={[typography.xs, { color: heroTextColor, marginLeft: 4 }]}>{location.city}</Text>
          </View>
        </View>

        {/* Hero Next Prayer Block */}
        <View style={styles.heroNextPrayer}>
          <Text style={[typography.label, { color: heroSubTextColor }]}>Next Prayer</Text>
          <Text style={[typography.displayLg, { color: heroTextColor, marginVertical: 4 }]}>{nextPrayer?.label || '—'}</Text>
          <Text style={[typography.body, { color: isDark ? colors.textPrimary : 'rgba(255,255,255,0.9)' }]}>
            {nextPrayer ? formatPrayerTime(nextPrayer.time) : '—'}
          </Text>
        </View>
          
        {/* Countdown Card (White/Light Section) */}
        <Card elevated style={[styles.countdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.label, styles.countdownTitle, { color: colors.textSecondary }]}>Time Remaining</Text>
          <View style={styles.countdownContainer}>
            <View style={styles.countdownBlock}>
              <Text style={[typography.headline, styles.countdownValue, { color: colors.textPrimary }]}>
                {String(countdown.hours).padStart(2, '0')}
              </Text>
              <Text style={[typography.xs, styles.countdownLabel, { color: colors.textMuted }]}>hr</Text>
            </View>
            <Text style={[styles.countdownSeparator, { color: colors.textMuted }]}>:</Text>
            <View style={styles.countdownBlock}>
              <Text style={[typography.headline, styles.countdownValue, { color: colors.textPrimary }]}>
                {String(countdown.minutes).padStart(2, '0')}
              </Text>
              <Text style={[typography.xs, styles.countdownLabel, { color: colors.textMuted }]}>min</Text>
            </View>
            <Text style={[styles.countdownSeparator, { color: colors.textMuted }]}>:</Text>
            <View style={styles.countdownBlock}>
              <Text style={[typography.headline, styles.countdownValue, { color: colors.textPrimary }]}>
                {String(countdown.seconds).padStart(2, '0')}
              </Text>
              <Text style={[typography.xs, styles.countdownLabel, { color: colors.textMuted }]}>sec</Text>
            </View>
          </View>
        </Card>

        {/* Today's Prayer List */}
        <View style={styles.sectionTitleContainer}>
          <Text style={[typography.title, styles.sectionTitle, { color: colors.textPrimary }]}>Today&apos;s Prayers</Text>
        </View>
        <Card style={[styles.prayerListContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          {displayPrayerTimes.map((prayer) => (
            <View
              key={prayer.name}
              testID={`prayer-item-${prayer.name}`}
              style={[
                styles.prayerRow,
                { 
                  backgroundColor: prayer.isNext ? colors.successSoft : colors.surfaceAlt, 
                  borderBottomColor: colors.border 
                },
              ]}
            >
              {prayer.isNext && <View style={[styles.activePrayerRow, { backgroundColor: colors.success }]} />}
              <View style={styles.prayerRowLeft}>
                <Ionicons
                  name={getPrayerIcon(prayer.name)}
                  size={20}
                  color={prayer.isNext ? colors.success : colors.textSecondary}
                />
                <Text style={[typography.label, styles.prayerName, { color: prayer.isNext ? colors.success : colors.textPrimary }]}>
                  {prayer.label}
                </Text>
              </View>
              <Text style={[typography.body, styles.prayerTime, { color: prayer.isNext ? colors.success : colors.textSecondary }]}>
                {formatPrayerTime(prayer.time)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Quick Actions */}
        <View style={styles.sectionTitleContainer}>
          <Text style={[typography.title, styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        </View>
        <View testID="quick-actions" style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              testID={action.testID}
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => router.navigate(action.href as any)}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: colors.chipBackground }]}>
                <Ionicons name={action.icon} size={28} color={colors.primary} />
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[typography.xs, styles.quickActionLabel, { color: colors.textPrimary, fontWeight: '600' }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
    paddingRight: 8,
  },
  heroLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  heroNextPrayer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  countdownCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 32,
  },
  countdownTitle: {
    marginBottom: 16,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownBlock: {
    alignItems: 'center',
  },
  countdownValue: {
    minWidth: 48,
    textAlign: 'center',
  },
  countdownLabel: {
    marginTop: 4,
  },
  countdownSeparator: {
    fontSize: 24,
    marginHorizontal: 12,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {},
  prayerListContainer: {
    padding: 0,
    marginBottom: 32,
    overflow: 'hidden',
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  prayerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  prayerName: {},
  prayerTime: {},
  activePrayerRow: {
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
  },
  quickActionCard: {
    width: '18%',
    alignItems: 'center',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    textAlign: 'center',
  }
});
