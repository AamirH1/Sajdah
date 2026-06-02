import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { Button, Card, IconButton, ScreenContainer } from '../src/ui/components';
import { getIslamicEvents, IslamicEventsResponse } from '../src/services/islamicEventsApi';
import { getDynamicScreenGradient } from '../src/ui/colorUtils';

export default function IslamicEventsScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<IslamicEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError(null);
        const result = await getIslamicEvents();
        if (!active) return;
        setData(result);
      } catch {
        if (!active) return;
        setError('We could not load Islamic events right now.');
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
  }, []);

  const heroGradient = getDynamicScreenGradient(colors, isDark);

  const currentHijri = data?.currentHijriDate.hijri;
  const currentGregorian = data?.currentHijriDate.gregorian;

  return (
    <ScreenContainer scrollable={false} heroGradient={heroGradient}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={[typography.xs, { color: colors.textLabel, letterSpacing: 1.5 }]}>FEATURE</Text>
          <Text style={[typography.title, { color: colors.screenTextPrimary, marginTop: 2 }]}>Islamic Events</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[typography.label, { color: colors.screenTextSecondary, lineHeight: 22, marginBottom: spacing.lg }]}>
          Keep track of today&apos;s Hijri date and upcoming Islamic observances.
        </Text>

        {error && (
          <Card style={[styles.errorCard, { backgroundColor: colors.errorSoft, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.error }]}>{error}</Text>
          </Card>
        )}

        <Card style={[styles.heroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.md]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroPill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[typography.xs, { color: colors.primary, letterSpacing: 1 }]}>TODAY</Text>
            </View>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[typography.label, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                Loading Islamic events...
              </Text>
            </View>
          ) : (
            <>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 12 }]}>
                {currentHijri?.formatted || 'Hijri date unavailable'}
              </Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
                {currentGregorian?.formatted || 'Gregorian date unavailable'}
              </Text>
              {data?.currentHijriDate.islamicInfo?.note ? (
                <Text style={[typography.xs, { color: colors.textMuted, marginTop: 10, lineHeight: 18 }]}>
                  {data.currentHijriDate.islamicInfo.note}
                </Text>
              ) : null}
            </>
          )}
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[typography.title, { color: colors.textPrimary }]}>Next Event</Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 2 }]}>
                Upcoming observance in the Hijri calendar.
              </Text>
            </View>
          </View>
          <View style={[styles.nextEventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.primary }]}>
              {data?.nextEvent?.hijriDate || '—'}
            </Text>
            <Text style={[typography.title, { color: colors.textPrimary, marginTop: 6 }]}>
              {data?.nextEvent?.name || 'No event found'}
            </Text>
          </View>
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[typography.title, { color: colors.textPrimary }]}>Events</Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 2 }]}>
                Major dates in the Islamic calendar.
              </Text>
            </View>
          </View>

          <View style={styles.eventList}>
            {data?.events.map((event) => (
              <View key={`${event.month}-${event.day}-${event.name}`} style={[styles.eventRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.eventDateBadge, { backgroundColor: colors.chipBackground }]}>
                  <Text style={[typography.xs, { color: colors.textSecondary }]}>
                    {String(event.day).padStart(2, '0')} / {String(event.month).padStart(2, '0')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label, { color: colors.textPrimary }]}>
                    {event.name}
                  </Text>
                  <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                    {event.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {!loading && !error && (
          <Button
            label="Refresh"
            onPress={async () => {
              setLoading(true);
              try {
                setError(null);
                const result = await getIslamicEvents(true);
                setData(result);
              } catch {
                setError('We could not load Islamic events right now.');
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
  sectionCard: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  nextEventCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  eventList: {
    gap: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  eventDateBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  refreshBtn: {
    marginTop: 4,
  },
});
