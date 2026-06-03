import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettings } from '../../src/store/useSettings';
import { getPrayerTimes, formatPrayerTime, PrayerName, PrayerTimeResult } from '../../src/services/prayer';
import { getTodayHijri, HijriDateResult } from '../../src/services/hijriApi';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { ScreenContainer, Card } from '../../src/ui/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFloatingTabBarContentPadding } from '../../src/ui/tabBarMetrics';

export default function HomeScreen() {
  const { colors, typography, spacing, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { location, calculationMethod, madhhab, offsets } = useSettings();

  const [now, setNow] = useState(new Date());
  const [todayHijri, setTodayHijri] = useState<HijriDateResult | null>(null);
  const [hijriLoading, setHijriLoading] = useState(true);

  // Keep 'now' continuously in sync with the device clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadTodayHijri = async () => {
      try {
        const result = await getTodayHijri();
        if (!active) return;
        setTodayHijri(result);
      } catch (e) {
        console.warn('Failed to load today Hijri date:', e);
      } finally {
        if (active) {
          setHijriLoading(false);
        }
      }
    };

    loadTodayHijri();

    return () => {
      active = false;
    };
  }, []);

  // Extract string to reliably trigger memoized schedule recalculations only when the calendar day changes
  const todayStr = now.toLocaleDateString();

  const calculateTimes = useCallback((date: Date): PrayerTimeResult[] => {
    try {
      return getPrayerTimes(
        date,
        location.latitude,
        location.longitude,
        calculationMethod,
        madhhab,
        offsets
      );
    } catch {
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
  }, [calculationMethod, location.latitude, location.longitude, madhhab, offsets]);

  const todayPrayerTimes = useMemo(() => {
    void todayStr;
    return calculateTimes(new Date());
  }, [todayStr, calculateTimes]);
  
  const tomorrowPrayerTimes = useMemo(() => {
    void todayStr;
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    return calculateTimes(tmrw);
  }, [todayStr, calculateTimes]);

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
    if (isDark) {
      switch(prayerName) {
        case 'fajr': return ['#111C14', '#2A3420'] as const;
        case 'sunrise': return ['#111C14', '#3A2D12'] as const;
        case 'dhuhr': return ['#111C14', '#203420'] as const;
        case 'asr': return ['#111C14', '#2A3420'] as const;
        case 'maghrib': return ['#111C14', '#3A2516'] as const;
        case 'isha': return ['#111C14', '#17231B'] as const;
        default: return ['#111C14', '#2A3420'] as const;
      }
    }

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
    { icon: 'calendar-number-outline' as const, label: 'Events', testID: 'quick-action-islamic-events', href: '/islamic-events' as const },
    { icon: 'time-outline' as const, label: 'Prayer Month', testID: 'quick-action-prayer-times-month', href: '/prayer-times-month' as const },
    { icon: 'sunny-outline' as const, label: 'Azkar', testID: 'quick-action-morning-azkar', href: '/azkar/morning' as const },
    { icon: 'radio-button-on-outline' as const, label: 'Tasbih', testID: 'quick-action-tasbih', href: '/tasbih' as const },
    { icon: 'sparkles-outline' as const, label: '99 Names', testID: 'quick-action-asma-ul-husna', href: '/asma-ul-husna' as const },
    { icon: 'search-outline' as const, label: 'Search Dua', testID: 'quick-action-dua-search', href: '/dua-search' as const },
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
  const sectionTextColor = isDark ? colors.screenTextPrimary : colors.textPrimary;
  const currentHijriDate = todayHijri
    ? `${todayHijri.hijriDay} ${todayHijri.hijriMonthName || `Month ${todayHijri.hijriMonth}`}`
    : 'Loading Hijri date...';
  const currentHijriYear = todayHijri ? `${todayHijri.hijriYear} AH` : '';

  return (
    <ScreenContainer
      heroGradient={getPrayerGradient(nextPrayer?.name)}
      // Match scroll padding to the floating tab bar so Home content remains tappable above Android navigation.
      style={{ paddingBottom: getFloatingTabBarContentPadding(insets.bottom) }}
    >
      <View style={{ paddingHorizontal: spacing.lg, flex: 1 }}>
        
        {/* Header */}
        <View style={styles.heroContainer}>
          <View>
            <Text style={[typography.xs, { color: heroSubTextColor, marginBottom: 2 }]}>
              Assalamu Alaikum
            </Text>
            <Text style={[typography.headline, { color: heroTextColor }]}>Prayer Times</Text>
          </View>
          <View style={styles.heroLocationCluster}>
            <View style={[styles.heroLocationBadge, { backgroundColor: isDark ? colors.accentGoldSoft : 'rgba(255,255,255,0.22)' }]}>
              <Ionicons name="location" size={14} color={heroTextColor} />
              <Text style={[typography.xs, { color: heroTextColor, marginLeft: 4 }]}>{location.city}</Text>
            </View>
            <View style={styles.heroDateHint}>
              <Text style={[typography.xs, { color: heroSubTextColor, textAlign: 'right' }]}>
                {hijriLoading ? 'Loading Hijri date...' : currentHijriDate}
              </Text>
              {!hijriLoading && currentHijriYear ? (
                <Text style={[typography.xs, { color: heroSubTextColor, textAlign: 'right', marginTop: 2 }]}>
                  {currentHijriYear}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Hero Next Prayer Block */}
        <View style={styles.heroNextPrayer}>
          <Text style={[typography.label, { color: heroSubTextColor }]}>Next Prayer</Text>
          <Text style={[typography.displayLg, { color: isDark ? colors.primary : heroTextColor, marginVertical: 4 }]}>{nextPrayer?.label || '—'}</Text>
          <Text style={[typography.body, { color: isDark ? colors.textPrimary : 'rgba(255,255,255,0.9)' }]}>
            {nextPrayer ? formatPrayerTime(nextPrayer.time) : '—'}
          </Text>
        </View>

        {/* Countdown Card (White/Light Section) */}
        <Card elevated style={[styles.countdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.label, styles.countdownTitle, { color: isDark ? colors.textLabel : colors.textSecondary }]}>Time Remaining</Text>
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
          <Text style={[typography.title, styles.sectionTitle, { color: sectionTextColor }]}>Today&apos;s Prayers</Text>
        </View>
        <Card style={[styles.prayerListContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          {displayPrayerTimes.map((prayer) => (
            <View
              key={prayer.name}
              testID={`prayer-item-${prayer.name}`}
              style={[
                styles.prayerRow,
                { 
                  backgroundColor: prayer.isNext ? colors.primarySoft : colors.surfaceAlt, 
                  borderBottomColor: colors.divider 
                },
              ]}
            >
              {prayer.isNext && <View style={[styles.activePrayerRow, { backgroundColor: colors.primary }]} />}
              <View style={styles.prayerRowLeft}>
                <Ionicons
                  name={getPrayerIcon(prayer.name)}
                  size={20}
                  color={prayer.isNext ? colors.primary : colors.textSecondary}
                />
                <Text style={[typography.label, styles.prayerName, { color: prayer.isNext ? colors.primary : colors.textPrimary }]}>
                  {prayer.label}
                </Text>
              </View>
              <Text style={[typography.body, styles.prayerTime, { color: prayer.isNext ? colors.primary : colors.textSecondary }]}>
                {formatPrayerTime(prayer.time)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Quick Actions */}
        <View style={styles.sectionTitleContainer}>
          <Text style={[typography.title, styles.sectionTitle, { color: sectionTextColor }]}>Quick Actions</Text>
        </View>
        <View testID="quick-actions" style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              testID={action.testID}
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => {
                if (action.testID === 'quick-action-morning-azkar') {
                  router.push({ pathname: '/azkar/[categoryId]', params: { categoryId: 'morning' } } as any);
                  return;
                }
                router.push(action.href as any);
              }}
            >
              <View style={[styles.quickActionIconContainer, { backgroundColor: colors.chipBackground }]}>
                <Ionicons name={action.icon} size={28} color={colors.primary} />
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[typography.xs, styles.quickActionLabel, { color: sectionTextColor, fontWeight: '600' }]}>{action.label}</Text>
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
  heroLocationCluster: {
    alignItems: 'flex-end',
  },
  heroDateHint: {
    marginTop: 6,
    alignItems: 'flex-end',
    maxWidth: 180,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quickActionCard: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    textAlign: 'center',
  }
});
