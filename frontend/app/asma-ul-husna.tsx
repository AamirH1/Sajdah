import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { Card, IconButton, ScreenContainer, Button } from '../src/ui/components';
import { AsmaUlHusnaItem, getAsmaUlHusna } from '../src/services/duaApi';
import { getAsmaUlHusnaByLanguage, getAsmaUlHusnaLanguageLabel, hasIslamicApiKey } from '../src/services/asmaUlHusnaApi';
import { useEntitlements } from '../src/store/useEntitlements';
import { useSettings } from '../src/store/useSettings';

export default function AsmaUlHusnaScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
  const router = useRouter();
  const translationLang = useSettings((state) => state.translationLang);
  const plan = useEntitlements((state) => state.plan);
  const togglePlan = useEntitlements((state) => state.togglePlan);
  const [items, setItems] = useState<AsmaUlHusnaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canUseTranslations = plan === 'pro';
  const effectiveLanguage = canUseTranslations ? translationLang : 'english';

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!canUseTranslations && translationLang !== 'english') {
          setError('English is shown for now. More 99 Names languages are included with Pro.');
        }

        const result = effectiveLanguage === 'english'
          ? await getAsmaUlHusna()
          : await getAsmaUlHusnaByLanguage(effectiveLanguage);
        if (!active) return;
        setItems(result);
      } catch (err) {
        if (!active) return;
        if (effectiveLanguage !== 'english') {
          if (!canUseTranslations) {
            setError('English is shown for now. More 99 Names languages are included with Pro.');
          } else if (!hasIslamicApiKey()) {
            setError('English is shown for now because this 99 Names language is not ready yet.');
          } else {
            setError('English is shown for now because this 99 Names language is not ready yet.');
          }
          try {
            const fallback = await getAsmaUlHusna();
            if (!active) return;
            setItems(fallback);
            return;
          } catch {
            // Fall through to the generic error below.
          }
        } else {
          console.warn('Failed to load Asma ul Husna:', err);
        }
        setError('We could not load the 99 names right now.');
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
  }, [effectiveLanguage, translationLang, canUseTranslations]);

  const heroGradient = isDark
    ? [colors.background, colors.surfaceAlt]
    : [colors.primarySoft, colors.background];

  const activeLanguageLabel = getAsmaUlHusnaLanguageLabel(effectiveLanguage);

  const renderItem = ({ item, index }: { item: AsmaUlHusnaItem; index: number }) => (
    <Card style={[styles.itemCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.sm]}>
      <View style={styles.itemTopRow}>
        <View style={[styles.numberBadge, { backgroundColor: colors.chipBackground }]}>
          <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>
            {String(item.number || index + 1).padStart(2, '0')}
          </Text>
        </View>
        <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
      </View>

      <Text style={[styles.arabic, { color: colors.textPrimary }]}>{item.nameArabic || '-'}</Text>
      <Text style={[typography.label, { color: colors.primary, marginTop: 6 }]}>
        {item.transliteration || '-'}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8, lineHeight: 24 }]}>
        {item.translation || item.meaning || 'Meaning not available.'}
      </Text>
    </Card>
  );

  return (
    <ScreenContainer scrollable={false} heroGradient={heroGradient as readonly [string, string]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={[typography.xs, { color: colors.textLabel, letterSpacing: 1.5 }]}>FEATURE</Text>
          <Text style={[typography.title, { color: colors.screenTextPrimary, marginTop: 2 }]}>99 Names of Allah</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(item) => String(item.number)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View>
            <Text style={[typography.label, { color: colors.screenTextSecondary, lineHeight: 22, marginBottom: spacing.lg }]}>
              Get all 99 beautiful names of Allah with Arabic, transliteration, and meanings.
            </Text>

            <Card style={[styles.heroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.md]}>
              <View style={styles.heroRow}>
                <View style={[styles.heroPill, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[typography.xs, { color: colors.primary, letterSpacing: 1 }]}>ASMA UL HUSNA</Text>
                </View>
                <Text style={[typography.xs, { color: colors.textSecondary }]}>
                  {items.length > 0 ? `${items.length} names` : '99 names'}
                </Text>
              </View>

              <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.md }]}>
                A peaceful way to learn, reflect, and recite.
              </Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
                Tap through the list and keep the transliteration and meaning close at hand.
              </Text>
              <View style={[styles.proBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="language-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[typography.label, { color: colors.textPrimary }]}>Using {activeLanguageLabel} where available</Text>
                  <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                    Choose your language once in Settings. If a translation is missing, Sajdah will show English.
                  </Text>
                </View>
                <Button
                  label={plan === 'pro' ? 'Pro Active' : 'Upgrade'}
                  onPress={togglePlan}
                  fullWidth={false}
                  style={styles.proButton}
                  icon={<Ionicons name="star-outline" size={16} color="#fff" />}
                />
              </View>
            </Card>

            {error && (
              <Card style={[styles.errorCard, { backgroundColor: colors.errorSoft, borderColor: colors.border }]}>
                <Text style={[typography.label, { color: colors.error, marginBottom: spacing.md }]}>
                  {error}
                </Text>
                <Button
                  label="Try Again"
                  onPress={async () => {
                    setLoading(true);
                    try {
                      setError(null);
                      const result = await getAsmaUlHusna(true);
                      setItems(result);
                    } catch {
                      setError('We could not load the 99 names right now.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              </Card>
            )}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[typography.label, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                  Loading names...
                </Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={(
          !loading && !error ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                No names were found right now.
              </Text>
            </Card>
          ) : null
        )}
      />
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  heroCard: {
    borderRadius: 28,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroPill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  errorCard: {
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
  },
  proButton: {
    minWidth: 102,
    paddingHorizontal: 16,
  },
  emptyCard: {
    marginTop: 12,
  },
  itemCard: {
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  numberBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  arabic: {
    fontSize: 28,
    lineHeight: 44,
    textAlign: 'right',
  },
});
