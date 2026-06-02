import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '../src/ui/hooks/useTheme';
import { ScreenContainer, Card, Button, IconButton } from '../src/ui/components';
import { useEntitlements } from '../src/store/useEntitlements';
import { convertGregorianToHijri, getIslamicMonths, getTodayHijri, HijriDateResult, IslamicMonth } from '../src/services/hijriApi';

const formatGregorian = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const MONTH_NAMES = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Sha\'ban',
  'Ramadan',
  'Shawwal',
  'Dhul Qa\'dah',
  'Dhul Hijjah',
];

export default function HijriScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
  const router = useRouter();
  const plan = useEntitlements((state) => state.plan);
  const togglePlan = useEntitlements((state) => state.togglePlan);
  const canUseHijri = plan === 'pro';

  const [todayHijri, setTodayHijri] = useState<HijriDateResult | null>(null);
  const [months, setMonths] = useState<IslamicMonth[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gregorianDate, setGregorianDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [convertedHijri, setConvertedHijri] = useState<HijriDateResult | null>(null);

  useEffect(() => {
    let active = true;

    if (!canUseHijri) {
      return () => {
        active = false;
      };
    }

    const loadInitial = async () => {
      try {
        const [todayResult, monthsResult] = await Promise.all([getTodayHijri(), getIslamicMonths()]);

        if (!active) return;
        setTodayHijri(todayResult);
        setMonths(monthsResult);
      } catch {
        if (!active) return;
        setError('Unable to load Hijri calendar right now.');
      } finally {
        if (active) {
          setLoadingToday(false);
          setLoadingMonths(false);
        }
      }
    };

    loadInitial();

    return () => {
      active = false;
    };
  }, [canUseHijri]);

  const selectedDateLabel = useMemo(() => formatGregorian(gregorianDate), [gregorianDate]);

  const monthName = useMemo(() => {
    if (!todayHijri) return 'Hijri Month';
    return todayHijri.hijriMonthName || months.find((m) => m.month === todayHijri.hijriMonth)?.name || 'Hijri Month';
  }, [todayHijri, months]);

  const activeMonth = useMemo(() => {
    if (!todayHijri) return null;
    return months.find((m) => m.month === todayHijri.hijriMonth) || null;
  }, [months, todayHijri]);

  const getDisplayMonthName = (monthNumber: number, monthName?: string) => {
    const fallback = MONTH_NAMES[Math.max(0, Math.min(MONTH_NAMES.length - 1, monthNumber - 1))];
    const trimmed = (monthName || '').trim();
    if (!trimmed) return fallback;
    if (/^month\s*\d+$/i.test(trimmed)) return fallback;
    return trimmed;
  };

  const handleConvert = async () => {
    if (Number.isNaN(gregorianDate.getTime())) {
      setError('Pick a valid Gregorian date.');
      return;
    }

    setError(null);
    setConverting(true);
    try {
      const result = await convertGregorianToHijri(gregorianDate);
      setConvertedHijri(result);
    } catch {
      setError('Could not convert that date right now.');
    } finally {
      setConverting(false);
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: gregorianDate,
        mode: 'date',
        onChange: (_, date) => {
          if (date) {
            setGregorianDate(date);
          }
        },
      });
      return;
    }

    setShowDatePicker((current) => !current);
  };

  const heroGradient = isDark
    ? [colors.background, colors.surfaceAlt]
    : [colors.primarySoft, colors.background];

  const sourceLabel = todayHijri ? (todayHijri.source === 'api' ? 'Updated today' : 'Saved result') : 'Loading';

  if (!canUseHijri) {
    return (
      <ScreenContainer scrollable={false} heroGradient={heroGradient as readonly [string, string]}>
        <View style={styles.lockedContainer}>
          <Card style={[styles.lockedCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.md]}>
            <View style={[styles.lockedIconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="calendar-outline" size={30} color={colors.primary} />
            </View>
            <Text style={[typography.title, { color: colors.textPrimary, marginTop: spacing.lg }]}>Hijri Calendar is Pro</Text>
            <Text style={[typography.label, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 }]}>
              Upgrade to Pro to unlock the Hijri calendar, date conversion, and Islamic month browsing.
            </Text>

            <View style={{ width: '100%', marginTop: spacing.xl, gap: spacing.sm }}>
              <Button
                label="Upgrade to Pro"
                onPress={togglePlan}
                icon={<Ionicons name="star" size={18} color="#fff" />}
              />
              <Button
                label="Go Back"
                onPress={() => router.back()}
                variant="secondary"
              />
            </View>
          </Card>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} heroGradient={heroGradient as readonly [string, string]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={[typography.xs, { color: colors.textLabel, letterSpacing: 1.5 }]}>CALENDAR</Text>
          <Text style={[typography.title, { color: colors.screenTextPrimary, marginTop: 2 }]}>Hijri</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[typography.label, { color: colors.screenTextSecondary, marginBottom: spacing.lg }]}>
          Convert dates, browse Islamic months, and keep the current Hijri date at a glance.
        </Text>

        {error && (
          <Card style={[styles.alertCard, { backgroundColor: colors.errorSoft, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.error }]}>{error}</Text>
          </Card>
        )}

        <Card style={[styles.heroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.md]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroPill, { backgroundColor: colors.chipBackground }]}>
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>TODAY</Text>
            </View>
            <Text style={[typography.xs, { color: colors.textSecondary }]}>{sourceLabel}</Text>
          </View>

          {loadingToday ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[typography.label, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                Loading today&apos;s Hijri date...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.heroDateRow}>
                <Text style={[typography.displayLg, { color: colors.textPrimary }]}>
                  {todayHijri?.hijriDay || '—'}
                </Text>
                <View style={[styles.heroMonthBadge, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[typography.title, { color: colors.primary }]}>{monthName}</Text>
                </View>
              </View>

              <View style={styles.heroMetaRow}>
                <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>HIJRI YEAR</Text>
                  <Text style={[typography.title, { color: colors.textPrimary, marginTop: 4 }]}>
                    {todayHijri?.hijriYear ? `${todayHijri.hijriYear} AH` : '—'}
                  </Text>
                </View>
                <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>GREGORIAN</Text>
                  <Text style={[typography.title, { color: colors.textPrimary, marginTop: 4 }]}>
                    {formatGregorian(new Date())}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Convert Date</Text>
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: 4 }]}>
            Pick a Gregorian date from the calendar below.
          </Text>
          <View style={styles.dateActionRow}>
            <Button
              label="Choose Date"
              variant="secondary"
              onPress={openDatePicker}
              icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
              fullWidth={false}
              style={styles.chooseDateBtn}
            />
            <View style={[styles.selectedDatePill, { backgroundColor: colors.chipBackground }]}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text numberOfLines={1} style={[typography.label, { color: colors.textPrimary, marginLeft: 8, flexShrink: 1 }]}>
                {selectedDateLabel}
              </Text>
            </View>
          </View>
          {Platform.OS !== 'android' && showDatePicker && (
            <View style={[styles.datePickerShell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <DateTimePicker
                value={gregorianDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                themeVariant={isDark ? 'dark' : 'light'}
                textColor={colors.textPrimary}
                onChange={(_, date) => {
                  if (date) {
                    setGregorianDate(date);
                  }
                }}
                style={styles.datePicker}
              />
            </View>
          )}
          <Button
            label={converting ? 'Converting...' : 'Convert to Hijri'}
            onPress={handleConvert}
            loading={converting}
            style={styles.convertBtn}
          />

          {convertedHijri && (
            <View style={[styles.resultBox, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>CONVERSION</Text>
              <View style={styles.resultRow}>
                <Text style={[typography.headline, { color: colors.textPrimary }]}>
                  {convertedHijri.hijriDay}
                </Text>
                <View style={[styles.resultMonthPill, { backgroundColor: colors.surface }]}>
                  <Text style={[typography.title, { color: colors.primary }]}>
                    {convertedHijri.hijriMonthName || months.find((m) => m.month === convertedHijri.hijriMonth)?.name || 'Hijri Month'}
                  </Text>
                </View>
              </View>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 6 }]}>
                {convertedHijri.hijriYear} AH
              </Text>
            </View>
          )}
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[typography.title, { color: colors.textPrimary }]}>Islamic Months</Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 2 }]}>
                The full Hijri year at a glance.
              </Text>
            </View>
            {loadingMonths && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          <View style={styles.monthGrid}>
            {months.map((month) => {
              const isActive = activeMonth?.month === month.month;
              return (
                <View
                  key={month.month}
                  style={[
                    styles.monthCard,
                    {
                      backgroundColor: isActive ? colors.surface : colors.chipBackground,
                      borderColor: isActive ? colors.primarySoft : colors.border,
                    },
                  ]}
                >
                  <View style={styles.monthCardTopRow}>
                    <View style={[styles.monthNumberBadge, { backgroundColor: isActive ? colors.primarySoft : colors.surface }]}>
                      <Text style={[typography.xs, { color: isActive ? colors.primary : colors.textSecondary }]}>
                        {String(month.month).padStart(2, '0')}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <Text style={[typography.title, { color: colors.textPrimary, marginTop: 10 }]}>
                    Month {month.month} · {getDisplayMonthName(month.month, month.name)}
                  </Text>
                  {month.significance ? (
                    <Text numberOfLines={3} style={[typography.xs, { color: colors.textSecondary, marginTop: 6, lineHeight: 18 }]}>
                      {month.significance}
                    </Text>
                  ) : (
                    <Text style={[typography.xs, { color: colors.textMuted, marginTop: 6 }]}>
                      No description available.
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </Card>
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
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  lockedCard: {
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 28,
  },
  lockedIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCard: {
    marginBottom: 16,
  },
  heroCard: {
    marginBottom: 16,
    borderRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroPill: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  heroMonthBadge: {
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    maxWidth: '55%',
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  metaCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  presetChip: {
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  chooseDateBtn: {
    marginTop: 0,
  },
  datePickerShell: {
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 12,
    overflow: 'hidden',
  },
  datePicker: {
    width: '100%',
    alignSelf: 'stretch',
  },
  selectedDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
    minWidth: 0,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    fontSize: 16,
  },
  convertBtn: {
    marginTop: 12,
  },
  resultBox: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  resultMonthPill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthGrid: {
    gap: 12,
  },
  monthCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  monthCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNumberBadge: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
  },
});
