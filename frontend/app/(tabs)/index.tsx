import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useSettings } from '../../src/store/useSettings';
import { getPrayerTimes, formatPrayerTime, PrayerTimeResult } from '../../src/services/prayer';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { ScreenContainer, Card } from '../../src/ui/components';

export default function HomeScreen() {
  const { colors, typography, spacing, radius } = useTheme();
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
      return getPrayerTimes(
        date,
        location.latitude,
        location.longitude,
        calculationMethod,
        madhhab,
        offsets
      );
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

  useEffect(() => {
    console.log('Prayer calc inputs', {
      city: location.city,
      lat: location.latitude,
      lng: location.longitude,
      calculationMethod,
      madhhab,
      now: now.toString(),
      nextPrayerName: nextPrayer?.label,
      nextPrayerTime: nextPrayer?.time.toString(),
    });
  }, [location.city, calculationMethod, madhhab, nextPrayer?.label]);

  const getPrayerGradient = (prayerName?: string) => {
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
    { icon: 'sunny-outline' as const, label: 'Azkar', testID: 'quick-action-morning-azkar', href: '/azkar/morning' as const },
    { icon: 'radio-button-on-outline' as const, label: 'Tasbih', testID: 'quick-action-tasbih', href: '/tasbih' as const },
  ];

  return (
    <ScreenContainer heroGradient={getPrayerGradient(nextPrayer?.name)}>
      <View style={{ paddingHorizontal: spacing.lg, flex: 1 }}>
        
        {/* Header */}
        <View style={styles.heroContainer}>
          <View>
            <Text style={[typography.xs, styles.heroSubtitle]}>
              Assalamu Alaikum
            </Text>
            <Text style={[typography.headline, styles.heroTitle]}>Prayer Times</Text>
          </View>
          <View style={styles.heroLocationBadge}>
            <Ionicons name="location" size={14} color="#ffffff" />
            <Text style={[typography.xs, styles.heroLocationText]}>{location.city}</Text>
          </View>
        </View>

        {/* Hero Next Prayer Block */}
        <View style={styles.heroNextPrayer}>
          <Text style={[typography.label, styles.heroMeta]}>Next Prayer</Text>
          <Text style={[typography.displayLg, styles.heroNextPrayerName]}>{nextPrayer?.label || '—'}</Text>
          <Text style={[typography.body, styles.heroNextPrayerTime]}>
            {nextPrayer ? formatPrayerTime(nextPrayer.time) : '—'}
          </Text>
        </View>
          
        {/* Countdown Card (White/Light Section) */}
        <Card elevated style={[styles.countdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.label, styles.countdownTitle, { color: colors.onSurfaceSecondary }]}>Time Remaining</Text>
          <View style={styles.countdownContainer}>
            <View style={styles.countdownBlock}>
              <Text style={[typography.headline, styles.countdownValue, { color: colors.onSurface }]}>
                {String(countdown.hours).padStart(2, '0')}
              </Text>
              <Text style={[typography.xs, styles.countdownLabel, { color: colors.onSurfaceSecondary }]}>hr</Text>
            </View>
            <Text style={[styles.countdownSeparator, { color: colors.onSurfaceSecondary }]}>:</Text>
            <View style={styles.countdownBlock}>
              <Text style={[typography.headline, styles.countdownValue, { color: colors.onSurface }]}>
                {String(countdown.minutes).padStart(2, '0')}
              </Text>
              <Text style={[typography.xs, styles.countdownLabel, { color: colors.onSurfaceSecondary }]}>min</Text>
            </View>
            <Text style={[styles.countdownSeparator, { color: colors.onSurfaceSecondary }]}>:</Text>
            <View style={styles.countdownBlock}>
              <Text style={[typography.headline, styles.countdownValue, { color: colors.onSurface }]}>
                {String(countdown.seconds).padStart(2, '0')}
              </Text>
              <Text style={[typography.xs, styles.countdownLabel, { color: colors.onSurfaceSecondary }]}>sec</Text>
            </View>
          </View>
        </Card>

        {/* Today's Prayer List */}
        <View style={styles.sectionTitleContainer}>
          <Text style={[typography.title, styles.sectionTitle, { color: colors.onBackground }]}>Today&apos;s Prayers</Text>
        </View>
        <Card style={[styles.prayerListContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {displayPrayerTimes.map((prayer) => (
            <View
              key={prayer.name}
              testID={`prayer-item-${prayer.name}`}
              style={[
                styles.prayerRow,
                { 
                  backgroundColor: prayer.isNext ? colors.surfaceElevated : colors.surface, 
                  borderBottomColor: colors.border 
                },
              ]}
            >
              {prayer.isNext && <View style={[styles.activePrayerRow, { backgroundColor: colors.primary }]} />}
              <View style={styles.prayerRowLeft}>
                <Ionicons
                  name={prayer.name === 'sunrise' ? 'sunny' : 'time-outline'}
                  size={20}
                  color={prayer.isNext ? colors.primary : colors.onSurfaceSecondary}
                />
                <Text style={[typography.label, styles.prayerName, { color: prayer.isNext ? colors.primary : colors.onSurface }]}>
                  {prayer.label}
                </Text>
              </View>
              <Text style={[typography.body, styles.prayerTime, { color: prayer.isNext ? colors.primary : colors.onSurfaceSecondary }]}>
                {formatPrayerTime(prayer.time)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Quick Actions */}
        <View style={styles.sectionTitleContainer}>
          <Text style={[typography.title, styles.sectionTitle, { color: colors.onBackground }]}>Quick Actions</Text>
        </View>
        <View testID="quick-actions" style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href as any}
              asChild
            >
              <TouchableOpacity
                testID={action.testID}
                style={styles.quickActionCard}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIconContainer, { backgroundColor: colors.primary + '1A' }]}>
                  <Ionicons name={action.icon} size={28} color={colors.primary} />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[typography.xs, styles.quickActionLabel, { color: colors.onSurface, fontWeight: '600' }]}>{action.label}</Text>
              </TouchableOpacity>
            </Link>
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
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 2,
  },
  heroTitle: {
    color: '#ffffff',
  },
  heroLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  heroLocationText: {
    color: '#ffffff',
    marginLeft: 4,
  },
  heroNextPrayer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.8)',
  },
  heroNextPrayerName: {
    color: '#ffffff',
    marginVertical: 4,
  },
  heroNextPrayerTime: {
    color: 'rgba(255,255,255,0.9)',
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
