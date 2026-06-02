import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { Button, Card, IconButton, ScreenContainer } from '../src/ui/components';
import { DuaSearchItem, searchDuas } from '../src/services/duaApi';

const SUGGESTIONS = ['morning', 'sleep', 'travel', 'forgiveness'];

export default function DuaSearchScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('morning');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<DuaSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const heroGradient = isDark
    ? [colors.background, colors.surfaceAlt]
    : [colors.primarySoft, colors.background];

  const runSearch = async (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      setError('Enter a search term to find duas.');
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSubmittedQuery(trimmed);
    setSearched(true);
    Keyboard.dismiss();

    try {
      const items = await searchDuas(trimmed);
      setResults(items);
      if (items.length === 0) {
        setError('No duas matched that search.');
      }
    } catch {
      setResults([]);
      setError('We could not search duas right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={false} heroGradient={heroGradient as readonly [string, string]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1 }]}>FEATURE</Text>
          <Text style={[typography.title, { color: colors.textPrimary, marginTop: 2 }]}>Search Dua</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={(
          <View>
            <Text style={[typography.label, { color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.lg }]}>
              Search duas by title, translation, transliteration, or category.
            </Text>

            <Card style={[styles.heroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.md]}>
              <View style={styles.heroRow}>
                <View style={[styles.heroPill, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[typography.xs, { color: colors.primary, letterSpacing: 1 }]}>DUA SEARCH</Text>
                </View>
                <Ionicons name="search-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.md }]}>
                Find the right dua fast.
              </Text>
              <Text style={[typography.label, { color: colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
                Try a simple word like &quot;morning&quot; or search by category to narrow the list.
              </Text>
            </Card>

            <Card style={[styles.searchCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[typography.label, { color: colors.textSecondary, marginBottom: 8 }]}>Search term</Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="search" size={18} color={colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="morning"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.textPrimary }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => runSearch(query)}
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setQuery('')}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.buttonRow}>
                <Button
                  label={loading ? 'Searching...' : 'Search'}
                  onPress={() => runSearch(query)}
                  loading={loading}
                  icon={<Ionicons name="search" size={18} color="#fff" />}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Clear"
                  onPress={() => {
                    setQuery('');
                    setResults([]);
                    setError(null);
                    setSubmittedQuery('');
                    setSearched(false);
                  }}
                  variant="secondary"
                  fullWidth={false}
                  style={{ minWidth: 96 }}
                />
              </View>
            </Card>

            <View style={styles.suggestionRow}>
              {SUGGESTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.suggestionChip, { backgroundColor: colors.chipBackground }]}
                  activeOpacity={0.75}
                  onPress={() => {
                    setQuery(item);
                    runSearch(item);
                  }}
                >
                  <Text style={[typography.xs, { color: colors.textPrimary, fontWeight: '600' }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {error && (
              <Card style={[styles.errorCard, { backgroundColor: colors.errorSoft, borderColor: colors.border }]}>
                <Text style={[typography.label, { color: colors.error }]}>{error}</Text>
              </Card>
            )}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[typography.label, { color: colors.textSecondary, marginLeft: spacing.sm }]}>
                  Searching duas...
                </Text>
              </View>
            )}

            {searched && !loading && submittedQuery ? (
              <Text style={[typography.xs, { color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.md }]}>
                RESULTS FOR &quot;{submittedQuery.toUpperCase()}&quot;
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={(
          searched && !loading && !error ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[typography.label, { color: colors.textSecondary }]}>
                No duas were returned by the API.
              </Text>
            </Card>
          ) : null
        )}
        renderItem={({ item, index }) => (
          <Card style={[styles.resultCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.sm]}>
            <View style={styles.resultTopRow}>
              <View style={[styles.indexBadge, { backgroundColor: colors.chipBackground }]}>
                <Text style={[typography.xs, { color: colors.textSecondary }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>
              {item.category ? (
                <View style={[styles.categoryBadge, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[typography.xs, { color: colors.primary }]}>{item.category}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[typography.title, { color: colors.textPrimary, marginTop: 6 }]}>
              {item.title}
            </Text>
            <Text style={[styles.arabic, { color: colors.textPrimary, marginTop: 12 }]}>
              {item.arabic || '-'}
            </Text>
            <Text style={[typography.label, { color: colors.primary, marginTop: 8 }]}>
              {item.transliteration || '-'}
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 8, lineHeight: 24 }]}>
              {item.translation || 'Translation not available.'}
            </Text>
            {item.reference ? (
              <Text style={[typography.xs, { color: colors.textMuted, marginTop: 10 }]}>
                {item.reference}
              </Text>
            ) : null}
          </Card>
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
  searchCard: {
    borderRadius: 24,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    paddingVertical: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  errorCard: {
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyCard: {
    marginTop: 12,
  },
  resultCard: {
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indexBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  arabic: {
    fontSize: 26,
    lineHeight: 40,
    textAlign: 'right',
  },
});
