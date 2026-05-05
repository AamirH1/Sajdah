import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { spacing, radius, typography } from '../../src/theme';
import { useSettings } from '../../src/store/useSettings';
import { getPrayerTimes, formatPrayerTime, getTimeUntilPrayer, PrayerTimeResult } from '../../src/services/prayer';

export default function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { location, calculationMethod, madhhab, offsets } = useSettings();
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeResult[]>(() => {
    try {
      return getPrayerTimes(
        new Date(),
        location.latitude,
        location.longitude,
        calculationMethod,
        madhhab,
        offsets
      );
    } catch (e) {
      // Fallback prayer times
      const today = new Date();
      const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return [
        { name: 'fajr' as const, label: 'Fajr', time: new Date(base.getTime() + 5 * 3600000), isNext: false },
        { name: 'sunrise' as const, label: 'Sunrise', time: new Date(base.getTime() + 6.25 * 3600000), isNext: false },
        { name: 'dhuhr' as const, label: 'Dhuhr', time: new Date(base.getTime() + 12.25 * 3600000), isNext: true },
        { name: 'asr' as const, label: 'Asr', time: new Date(base.getTime() + 15.75 * 3600000), isNext: false },
        { name: 'maghrib' as const, label: 'Maghrib', time: new Date(base.getTime() + 18.5 * 3600000), isNext: false },
        { name: 'isha' as const, label: 'Isha', time: new Date(base.getTime() + 20 * 3600000), isNext: false },
      ];
    }
  });
  const [nextPrayer, setNextPrayer] = useState<PrayerTimeResult | null>(() => {
    return prayerTimes.find((p) => p.isNext) || prayerTimes[0] || null;
  });

  useEffect(() => {
    if (!nextPrayer) return;
    const update = () => setCountdown(getTimeUntilPrayer(nextPrayer.time));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [nextPrayer]);

  const quickActions = [
    { icon: 'book-outline' as const, label: 'Quran', href: '/(tabs)/quran' as const },
    { icon: 'sunny-outline' as const, label: 'Morning\nAzkar', href: '/azkar/morning' as const },
    { icon: 'moon-outline' as const, label: 'Evening\nAzkar', href: '/azkar/evening' as const },
    { icon: 'radio-button-on-outline' as const, label: 'Tasbih', href: '/tasbih' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Assalamu Alaikum</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Prayer Times</Text>
          </View>
          <View style={[styles.locationBadge, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.primary }]}>{location.city}</Text>
          </View>
        </View>

        {/* Next Prayer Card */}
        <View testID="next-prayer-card" style={[styles.nextPrayerCard, { backgroundColor: colors.primary }]}>
          <View style={styles.nextPrayerTop}>
            <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
            <Text style={styles.nextPrayerName}>{nextPrayer?.label || '—'}</Text>
          </View>
          <View style={styles.countdownRow}>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{String(countdown.hours).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>hrs</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{String(countdown.minutes).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>min</Text>
            </View>
            <Text style={styles.countdownSeparator}>:</Text>
            <View style={styles.countdownItem}>
              <Text style={styles.countdownNumber}>{String(countdown.seconds).padStart(2, '0')}</Text>
              <Text style={styles.countdownLabel}>sec</Text>
            </View>
          </View>
          <Text style={styles.nextPrayerTime}>
            {nextPrayer ? formatPrayerTime(nextPrayer.time) : '—'}
          </Text>
        </View>

        {/* Today's Prayer List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today&apos;s Prayers</Text>
        </View>
        <View testID="prayer-list" style={[styles.prayerList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {prayerTimes.map((prayer) => (
            <View
              key={prayer.name}
              testID={`prayer-item-${prayer.name}`}
              style={[
                styles.prayerItem,
                prayer.isNext && { backgroundColor: colors.accentLight },
                { borderBottomColor: colors.border },
              ]}
            >
              {prayer.isNext && <View style={[styles.activeBorder, { backgroundColor: colors.primary }]} />}
              <View style={styles.prayerInfo}>
                <Ionicons
                  name={prayer.name === 'sunrise' ? 'sunny' : 'time-outline'}
                  size={20}
                  color={prayer.isNext ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.prayerName, { color: prayer.isNext ? colors.primary : colors.textPrimary }]}>
                  {prayer.label}
                </Text>
              </View>
              <Text style={[styles.prayerTime, { color: prayer.isNext ? colors.primary : colors.textSecondary }]}>
                {formatPrayerTime(prayer.time)}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        </View>
        <View testID="quick-actions" style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href as any}
              asChild
            >
              <TouchableOpacity
                testID={`quick-action-${action.label.replace(/\n/g, '-').toLowerCase()}`}
                style={[styles.quickActionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name={action.icon} size={24} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.huge },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  greeting: { ...typography.small, marginBottom: 2 },
  title: { ...typography.h2 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  locationText: { ...typography.xs, fontWeight: '600', marginLeft: 4 },
  nextPrayerCard: { borderRadius: radius.xxl, padding: spacing.xxl, marginBottom: spacing.xxl, elevation: 4, shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 },
  nextPrayerTop: { alignItems: 'center', marginBottom: spacing.lg },
  nextPrayerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  nextPrayerName: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  countdownItem: { alignItems: 'center' },
  countdownNumber: { color: '#fff', fontSize: 40, fontWeight: '700', minWidth: 56, textAlign: 'center' },
  countdownLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  countdownSeparator: { color: 'rgba(255,255,255,0.5)', fontSize: 32, fontWeight: '300', marginHorizontal: 8 },
  nextPrayerTime: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', fontWeight: '500' },
  sectionHeader: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3 },
  prayerList: { borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, marginBottom: spacing.xxl },
  prayerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1 },
  activeBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: radius.xl, borderBottomLeftRadius: radius.xl },
  prayerInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prayerName: { ...typography.bodyBold },
  prayerTime: { ...typography.body },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickActionCard: { width: '47%', borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, alignItems: 'center' },
  quickActionIcon: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickActionLabel: { ...typography.small, fontWeight: '600', textAlign: 'center' },
});
