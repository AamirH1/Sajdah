import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { Button, Card, IconButton, ScreenContainer } from '../src/ui/components';
import { getDynamicScreenGradient, hexToRgba } from '../src/ui/colorUtils';
import { fetchZakatNisab, type ZakatNisabResponse, type ZakatStandard, type ZakatUnit } from '../src/services/zakatApi';

const CURRENCIES = ['usd', 'gbp', 'eur', 'inr', 'aed', 'bdt', 'pkr'] as const;
const UNITS: ZakatUnit[] = ['g', 'oz'];
const STANDARDS: Array<{ value: ZakatStandard; label: string; description: string }> = [
  { value: 'classical', label: 'Classical', description: '87.48g gold / 612.36g silver' },
  { value: 'common', label: 'Common', description: '85g gold / 595g silver' },
];
const BENCHMARKS = ['gold', 'silver'] as const;
type BenchmarkType = (typeof BENCHMARKS)[number];

const formatMoney = (value?: number, currency?: string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  const code = (currency || 'usd').toUpperCase();
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
};

const formatWeight = (value?: number, unit?: string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  const suffix = unit === 'oz' ? 'oz' : 'g';
  return `${value.toFixed(2)} ${suffix}`;
};

const parseMoney = (value: string) => {
  const cleaned = value.replace(/,/g, '').trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeMoneyInput = (value: string) => value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

export default function ZakatScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
  const router = useRouter();
  const apiKey = process.env.EXPO_PUBLIC_ISLAMIC_API_KEY?.trim() || '';

  const [standard, setStandard] = useState<ZakatStandard>('classical');
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>('inr');
  const [unit, setUnit] = useState<ZakatUnit>('g');
  const [data, setData] = useState<ZakatNisabResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkType>('gold');
  const [assetsValue, setAssetsValue] = useState('');
  const [debtsValue, setDebtsValue] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError(null);
        const result = await fetchZakatNisab(standard, currency, unit, apiKey);
        if (!active) return;
        setData(result);
      } catch {
        if (!active) return;
        setError('We could not load Zakat Nisab values right now.');
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
  }, [apiKey, currency, standard, unit, refreshTick]);

  const heroGradient = useMemo(() => getDynamicScreenGradient(colors, isDark), [colors, isDark]);
  const metadata = data?.data?.nisab_thresholds;
  const selectedBenchmark = benchmark === 'silver' ? metadata?.silver?.nisab_amount : metadata?.gold?.nisab_amount;
  const benchmarkLabel = benchmark === 'silver' ? 'Silver' : 'Gold';
  const calculator = useMemo(() => {
    const grossAssets = parseMoney(assetsValue);
    const liabilities = parseMoney(debtsValue);
    const netWealth = grossAssets - liabilities;
    const threshold = typeof selectedBenchmark === 'number' && Number.isFinite(selectedBenchmark) ? selectedBenchmark : undefined;
    const aboveNisab = typeof threshold === 'number' ? netWealth >= threshold : false;
    const zakatDue = aboveNisab ? Math.max(netWealth, 0) * 0.025 : 0;
    const surplus = typeof threshold === 'number' ? netWealth - threshold : 0;

    return {
      grossAssets,
      netWealth,
      threshold,
      aboveNisab,
      zakatDue,
      surplus,
    };
  }, [assetsValue, debtsValue, selectedBenchmark]);

  const handleRefresh = () => {
    setError(null);
    setLoading(true);
    setRefreshTick((current) => current + 1);
  };

  return (
    <ScreenContainer scrollable={false} heroGradient={heroGradient}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={[typography.xs, { color: colors.textLabel, letterSpacing: 1.5 }]}>TOOLS</Text>
          <Text style={[typography.title, { color: colors.screenTextPrimary, marginTop: 2 }]}>Zakat Nisab</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={[styles.noteBanner, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.label, { color: colors.textPrimary, lineHeight: 20 }]}>
              Consult an Aalim for Zakat calculations, eligibility questions, and rulings, as they are trained in Islamic Fiqh (jurisprudence).
            </Text>
            <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 6, lineHeight: 16 }]}>
              Nisab is the minimum wealth limit required before you need to pay Zakat.
            </Text>
            <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 6, lineHeight: 16 }]}>
              This calculator is for guidance only and does not replace scholarly advice.
            </Text>
          </View>
        </Card>

        <Text style={[typography.label, { color: colors.screenTextSecondary, lineHeight: 22, marginBottom: spacing.lg }]}>
          Check current gold and silver Nisab values using live market pricing.
        </Text>

        {error && (
          <Card style={[styles.errorCard, { backgroundColor: colors.errorSoft, borderColor: colors.border }]}>
            <Text style={[typography.label, { color: colors.error }]}>{error}</Text>
          </Card>
        )}

        <Card style={[styles.heroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.md]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroPill, { backgroundColor: colors.primarySoft }]}>
              <Text style={[typography.xs, { color: colors.primary, letterSpacing: 1 }]}>LIVE</Text>
            </View>
            <View style={[styles.iconBadge, { backgroundColor: hexToRgba(colors.primary, 0.12) }]}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            </View>
          </View>

          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.md }]}>
            Updated Nisab thresholds for gold and silver.
          </Text>
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
            Choose a calculation standard, currency, and unit, then compare the gold and silver thresholds at a glance.
          </Text>

          <View style={styles.metaRow}>
            <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>STANDARD</Text>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 4 }]}>
                {standard.charAt(0).toUpperCase() + standard.slice(1)}
              </Text>
            </View>
            <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>CURRENCY</Text>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 4 }]}>
                {currency.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.benchmarkRow}>
            {BENCHMARKS.map((item) => {
              const selected = benchmark === item;
              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.75}
                  onPress={() => setBenchmark(item)}
                  style={[
                    styles.benchmarkPill,
                    { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={[typography.label, { color: selected ? colors.onPrimary : colors.textPrimary, fontWeight: '700' }]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)} benchmark
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Calculation Options</Text>
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: 4 }]}>
            Pick the standard and output unit.
          </Text>

          <View style={styles.choiceGrid}>
            {STANDARDS.map((item) => {
              const selected = standard === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.75}
                  onPress={() => {
                    setError(null);
                    setLoading(true);
                    setStandard(item.value);
                  }}
                  style={[
                    styles.choiceCard,
                    { backgroundColor: selected ? colors.chipBackground : colors.surface, borderColor: selected ? colors.primary : colors.border },
                  ]}
                >
                  <View style={styles.choiceRow}>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={selected ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[typography.label, { color: colors.textPrimary, marginLeft: 8, fontWeight: '700' }]}>
                      {item.label}
                    </Text>
                  </View>
                  <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 6, lineHeight: 18 }]}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.choiceRowWrap}>
            <Text style={[typography.label, { color: colors.textPrimary }]}>Unit</Text>
            <View style={styles.pillGroup}>
              {UNITS.map((item) => {
                const selected = unit === item;
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.75}
                    onPress={() => {
                      setError(null);
                      setLoading(true);
                      setUnit(item);
                    }}
                    style={[
                      styles.pill,
                      { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={[typography.label, { color: selected ? colors.onPrimary : colors.textPrimary, fontWeight: '700' }]}>
                      {item.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.choiceRowWrap}>
            <Text style={[typography.label, { color: colors.textPrimary }]}>Currency</Text>
            <View style={styles.currencyGrid}>
              {CURRENCIES.map((item) => {
                const selected = currency === item;
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.75}
                    onPress={() => {
                      setError(null);
                      setLoading(true);
                      setCurrency(item);
                    }}
                    style={[
                      styles.currencyPill,
                      { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border },
                    ]}
                  >
                    <Text style={[typography.xs, { color: selected ? colors.onPrimary : colors.textPrimary, fontWeight: '700' }]}>
                      {item.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Zakat Calculator</Text>
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
            Enter your total zakatable assets and subtract immediate liabilities. The calculator uses the live {benchmarkLabel.toLowerCase()} Nisab threshold.
          </Text>

          <View style={styles.inputGrid}>
            <View style={styles.inputBlock}>
              <Text style={[typography.label, { color: colors.textPrimary, marginBottom: 8 }]}>Total assets</Text>
              <TextInput
                value={assetsValue}
                onChangeText={(text) => setAssetsValue(sanitizeMoneyInput(text))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                ]}
              />
              <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 6, lineHeight: 16 }]}>
                Include cash, gold, silver, investments, and business stock.
              </Text>
            </View>

            <View style={styles.inputBlock}>
              <Text style={[typography.label, { color: colors.textPrimary, marginBottom: 8 }]}>Debts and liabilities</Text>
              <TextInput
                value={debtsValue}
                onChangeText={(text) => setDebtsValue(sanitizeMoneyInput(text))}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary },
                ]}
              />
              <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 6, lineHeight: 16 }]}>
                Enter immediate debts you want to subtract.
              </Text>
            </View>
          </View>

          <View style={styles.resultGrid}>
            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>GROSS ASSETS</Text>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 8 }]}>
                {formatMoney(calculator.grossAssets, data?.currency)}
              </Text>
            </View>
            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>NET WEALTH</Text>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 8 }]}>
                {formatMoney(calculator.netWealth, data?.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.resultGrid}>
            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>
                {benchmarkLabel.toUpperCase()} NISAB
              </Text>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 8 }]}>
                {formatMoney(calculator.threshold, data?.currency)}
              </Text>
            </View>
            <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>ZAKAT DUE</Text>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 8 }]}>
                {formatMoney(calculator.zakatDue, data?.currency)}
              </Text>
            </View>
          </View>

          <View style={[styles.statusCard, { backgroundColor: calculator.aboveNisab ? colors.successSoft : colors.chipBackground }]}>
            <Ionicons
              name={calculator.aboveNisab ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={18}
              color={calculator.aboveNisab ? colors.success : colors.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: calculator.aboveNisab ? colors.success : colors.textPrimary }]}>
                {typeof calculator.threshold === 'number'
                  ? calculator.aboveNisab
                    ? 'Your net wealth is above Nisab.'
                    : 'Your net wealth is below Nisab.'
                  : 'Load Nisab values to compare your wealth.'}
              </Text>
              {typeof calculator.threshold === 'number' ? (
                <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                  {calculator.aboveNisab
                    ? `Estimated surplus above Nisab: ${formatMoney(calculator.surplus, data?.currency)}`
                    : 'Try adding more assets or switching the benchmark.'}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[typography.title, { color: colors.textPrimary }]}>Nisab Values</Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 2 }]}>
                {data?.updated_at ? `Updated ${new Date(data.updated_at).toLocaleString()}` : 'Live market values'}
              </Text>
            </View>
            {loading && <ActivityIndicator color={colors.primary} />}
          </View>

          <View style={styles.thresholdGrid}>
            <View style={[styles.thresholdCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.thresholdTopRow}>
                <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>Gold</Text>
                <Ionicons name="diamond-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 10 }]}>
                {formatMoney(metadata?.gold?.nisab_amount, data?.currency)}
              </Text>
              <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 8, lineHeight: 18 }]}>
                {formatWeight(metadata?.gold?.weight, data?.weight_unit)} at {formatMoney(metadata?.gold?.unit_price, data?.currency)} per {data?.weight_unit === 'oz' ? 'oz' : 'g'}.
              </Text>
            </View>

            <View style={[styles.thresholdCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.thresholdTopRow}>
                <Text style={[typography.label, { color: colors.primary, fontWeight: '700' }]}>Silver</Text>
                <Ionicons name="disc-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[typography.headline, { color: colors.textPrimary, marginTop: 10 }]}>
                {formatMoney(metadata?.silver?.nisab_amount, data?.currency)}
              </Text>
              <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 8, lineHeight: 18 }]}>
                {formatWeight(metadata?.silver?.weight, data?.weight_unit)} at {formatMoney(metadata?.silver?.unit_price, data?.currency)} per {data?.weight_unit === 'oz' ? 'oz' : 'g'}.
              </Text>
            </View>
          </View>

          <View style={[styles.noteCard, { backgroundColor: colors.chipBackground }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[typography.xs, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>
              {data?.data?.zakat_rate || '2.5%'} Zakat rate applies when wealth stays above Nisab for a lunar year.
            </Text>
          </View>

          {data?.data?.notes ? (
            <Text style={[typography.xs, { color: colors.textMuted, marginTop: 10, lineHeight: 18 }]}>
              {data.data.notes}
            </Text>
          ) : null}
        </Card>

        <Button
          label={loading ? 'Refreshing...' : 'Refresh'}
          onPress={handleRefresh}
          icon={<Ionicons name="refresh-outline" size={18} color={loading ? colors.textSecondary : colors.onPrimary} />}
          disabled={loading}
        />
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
  noteBanner: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  metaCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  sectionCard: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    padding: 16,
  },
  choiceGrid: {
    gap: 12,
    marginTop: 14,
  },
  choiceCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceRowWrap: {
    marginTop: 16,
    gap: 10,
  },
  benchmarkRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  benchmarkPill: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    minWidth: 54,
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyPill: {
    minWidth: 62,
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  inputGrid: {
    marginTop: 16,
    gap: 14,
  },
  inputBlock: {
    gap: 0,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  resultGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  resultCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  statusCard: {
    marginTop: 16,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  thresholdGrid: {
    gap: 12,
  },
  thresholdCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  thresholdTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteCard: {
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
});
