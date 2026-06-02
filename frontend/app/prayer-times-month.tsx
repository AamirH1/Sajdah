import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { Button, Card, IconButton, ScreenContainer } from '../src/ui/components';
import { useSettings } from '../src/store/useSettings';
import {
  getMonthlyPrayerTimes,
  MonthlyPrayerTimesDay,
  MonthlyPrayerTimesResult,
} from '../src/services/prayerMonthApi';

const PRAYER_ORDER: (keyof Pick<MonthlyPrayerTimesDay, 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'>)[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export default function PrayerTimesMonthScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
  const router = useRouter();
  const { location, calculationMethod, madhhab, hasHydrated } = useSettings();
  const [data, setData] = useState<MonthlyPrayerTimesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!hasHydrated) {
        return;
      }

      try {
        setError(null);
        const latitude = Number(location?.latitude);
        const longitude = Number(location?.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new Error('Location is missing coordinates.');
        }

        const result = await getMonthlyPrayerTimes(latitude, longitude, {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          method: calculationMethod,
          madhab,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        if (!active) return;
        setData(result);
      } catch {
        if (!active) return;
        setError('We could not load the month prayer times right now.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [hasHydrated, location?.latitude, location?.longitude, calculationMethod, madhhab]);

  const heroGradient = isDark
    ? [colors.background, colors.surfaceAlt]
    : [colors.primarySoft, colors.background];

  const todayKey = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todayItem = data?.days.find((day) => day.gregorianDate === todayKey || day.dayLabel?.includes(todayKey));

  return (
    <ScreenContainer scrollable={false} heroGradient={heroGradient as readonly [string, string]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>FEATURE</Text>
          <Text style={[typography.title, { color: colors.textPrimary, marginTop: 2 }]}>Prayer Month</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[typography.label, { color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg }]}>
          Get prayer times for every day of the month. Great for caching in mobile apps.
        </Text>

        {error && (
          <Card style={[styles.errorCard, { backgroundColor: colors.errorSoft, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.error }]}>{error}</Text>
          </Card>
        )}

        <Card style={[styles.heroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.md]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroPill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[typography.xs, { color: colors.primary, letterSpacing: 1 }]}>MONTHLY CACHE</Text>
            </View>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[typography.label, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                {hasHydrated ? 'Loading month prayer times...' : 'Loading saved location...'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 12 }]}>
                {data?.monthLabel || 'Current Month'}
              </Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 4 }]}>
                {data?.yearLabel || location.city}
              </Text>
              {data?.locationLabel ? (
                <Text style={[typography.xs, { color: colors.textMuted, marginTop: 8 }]}>
                  {data.locationLabel}
                </Text>
              ) : null}
              <Text style={[typography.xs, { color: colors.textMuted, marginTop: 8 }]}>
                Using {location.city} · {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Text>
              {data?.note ? (
                <Text style={[typography.xs, { color: colors.textMuted, marginTop: 10, lineHeight: 18 }]}>
                  {data.note}
                </Text>
              ) : null}
            </>
          )}
        </Card>

        {todayItem && (
          <Card style={[styles.todayCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[typography.title, { color: colors.textPrimary }]}>Today</Text>
                <Text style={[typography.label, { color: colors.textSecondary, marginTop: 2 }]}>
                  {todayItem.dayLabel || todayItem.gregorianDate}
                </Text>
              </View>
              <View style={[styles.todayBadge, { backgroundColor: colors.chipBackground }]}>
                <Text style={[typography.xs, { color: colors.textSecondary }]}>Today</Text>
              </View>
            </View>
            <View style={styles.prayerChipRow}>
              {PRAYER_ORDER.map((prayer) => (
                <View key={prayer} style={[styles.prayerChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[typography.xs, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
                    {prayer}
                  </Text>
                  <Text style={[typography.label, { color: colors.textPrimary, marginTop: 4 }]}>
                    {todayItem[prayer] || '—'}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        <Card style={[styles.listCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[typography.title, { color: colors.textPrimary }]}>Month View</Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 2 }]}>
                Each day with prayer times.
              </Text>
            </View>
          </View>

          <FlatList
            data={data?.days || []}
            keyExtractor={(item) => item.gregorianDate}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isToday = item.gregorianDate === todayKey;
              return (
                <View style={[
                  styles.dayRow,
                  {
                    backgroundColor: isToday ? colors.primarySoft : colors.surface,
                    borderColor: isToday ? colors.primarySoft : colors.border,
                  },
                ]}>
                  <View style={styles.dayRowTop}>
                    <View>
                      <Text style={[typography.label, { color: colors.textPrimary }]}>
                        {item.dayLabel || item.gregorianDate}
                      </Text>
                      {item.hijriDate ? (
                        <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 2 }]}>
                          {item.hijriDate}
                        </Text>
                      ) : null}
                    </View>
                    {isToday ? (
                      <View style={[styles.todayBadge, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[typography.xs, { color: colors.primary }]}>Today</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.dayPrayerRow}>
                    {PRAYER_ORDER.map((prayer) => (
                      <View key={`${item.gregorianDate}-${prayer}`} style={styles.dayPrayerItem}>
                        <Text style={[typography.xs, { color: colors.textMuted, textTransform: 'uppercase' }]}>
                          {prayer}
                        </Text>
                        <Text style={[typography.xs, { color: colors.textPrimary, marginTop: 2 }]}>
                          {item[prayer] || '—'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            }}
          />
        </Card>

        {!loading && !error && (
          <Button
            label="Refresh"
            onPress={async () => {
              setLoading(true);
              try {
                setError(null);
                const latitude = Number(location?.latitude);
                const longitude = Number(location?.longitude);

                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                  throw new Error('Location is missing coordinates.');
                }

                const result = await getMonthlyPrayerTimes(
                  latitude,
                  longitude,
                  {
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    method: calculationMethod,
                    madhab,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  },
                  true
                );
                setData(result);
              } catch {
                setError('We could not load the month prayer times right now.');
              } finally {
                setLoading(false);
              }
            }}
            style={styles.refreshBtn}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCenter: {
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  errorCard: {
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 28,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroPill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  todayCard: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    padding: 16,
  },
  listCard: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  todayBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  prayerChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prayerChip: {
    width: '31%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
  },
  dayRow: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  dayRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  dayPrayerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPrayerItem: {
    width: '31%',
  },
  refreshBtn: {
    marginTop: 4,
  },
});
