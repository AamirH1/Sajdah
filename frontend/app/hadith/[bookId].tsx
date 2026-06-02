import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { Card, ScreenContainer, ScreenHeader } from '../../src/ui/components';
import {
  HadithCollectionKey,
  HadithSearchResult,
  HadithRecord,
  getRandomHadith,
  searchHadiths,
} from '../../src/services/hadithApi';
import { useHadithCollection } from '../../src/hooks/useHadithCollection';

const COLLECTION_META: Record<HadithCollectionKey, { name: string; arabic: string; color: string }> = {
  bukhari: { name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري', color: '#F59E0B' },
  muslim: { name: 'Sahih Muslim', arabic: 'صحيح مسلم', color: '#10B981' },
  abudawud: { name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود', color: '#3B82F6' },
  tirmidhi: { name: 'Jami at-Tirmidhi', arabic: 'جامع الترمذي', color: '#8B5CF6' },
  nasai: { name: 'Sunan an-Nasai', arabic: 'سنن النسائي', color: '#EC4899' },
  ibnmajah: { name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه', color: '#14B8A6' },
  malik: { name: 'Al-Muwatta Malik', arabic: 'الموطأ', color: '#F97316' },
};

const PAGE_SIZE = 20;
const MENU_MODE = 'menu';
const READER_MODE = 'reader';
const LIST_MODE = 'list';
const SEARCH_MODE = 'search';

const resolveParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const HadithItemCard = memo(function HadithItemCard({
  item,
  colors,
  typography,
  spacing,
}: {
  item: HadithRecord;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
}) {
  return (
    <Card style={styles.hadithCard}>
      <View style={[styles.metaRow, { marginBottom: spacing.md }]}>
        <View style={[styles.badge, { backgroundColor: colors.chipBackground }]}>
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>#{item.number || '1'}</Text>
        </View>
        {item.grade ? (
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{item.grade}</Text>
          </View>
        ) : null}
        {item.chapter ? (
          <View style={[styles.badge, { backgroundColor: colors.chipBackground }]}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>
              {item.chapter}
            </Text>
          </View>
        ) : null}
      </View>

      {item.source ? (
        <Text style={[typography.xs, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          Source: {item.source}
        </Text>
      ) : null}

      <Text style={[styles.arabicText, { color: colors.textPrimary }]}>
        {item.arabic || 'Hadith text will appear here when available.'}
      </Text>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 26 }]}>
        {item.translation || item.text || 'Translation will appear here when available.'}
      </Text>

      {(item.narrator || item.chapter) && (
        <View style={{ marginTop: spacing.lg }}>
          {item.narrator ? (
            <Text style={[typography.xs, { color: colors.textSecondary, marginBottom: 4 }]}>Narrator: {item.narrator}</Text>
          ) : null}
          {item.chapter ? (
            <Text style={[typography.xs, { color: colors.textSecondary }]}>Chapter: {item.chapter}</Text>
          ) : null}
        </View>
      )}
    </Card>
  );
});

function CollectionShell({
  collection,
  mode,
  children,
  onClose,
  onOpenReader,
  onOpenList,
  onOpenSearch,
}: {
  collection: HadithCollectionKey;
  mode: 'menu' | 'reader' | 'list' | 'search';
  children: React.ReactNode;
  onClose: () => void;
  onOpenReader?: () => void;
  onOpenList?: () => void;
  onOpenSearch?: () => void;
}) {
  const { colors, typography } = useTheme();
  const meta = COLLECTION_META[collection] || COLLECTION_META.bukhari;
  const subtitleByMode: Record<typeof mode, string> = {
    menu: 'Choose how you want to read',
    reader: 'Read one hadith at a time',
    list: 'Browse the full collection',
    search: 'Search hadith',
  };

  return (
    <ScreenContainer scrollable={false}>
      <ScreenHeader
        title={meta.name}
        subtitle={subtitleByMode[mode]}
        rightAction={
          <TouchableOpacity
            testID="hadith-book-home-btn"
            onPress={onClose}
            style={styles.headerAction}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.shellContent}>
        {mode === MENU_MODE ? (
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Card
              elevated
              style={[styles.menuHeroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[typography.label, { color: colors.textSecondary }]}>Choose your reading style</Text>
              <Text style={[typography.title, { color: colors.textPrimary, marginTop: 6 }]}>{meta.name}</Text>
              <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 8 }]}>{meta.arabic}</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: 14, lineHeight: 22 }]}>
                Tap the option below that feels right for you.
              </Text>
            </Card>

            <View style={styles.menuOptions}>
              <TouchableOpacity
                testID="open-reader-mode-btn"
                onPress={onOpenReader}
                activeOpacity={0.85}
                style={[styles.menuOptionCard, styles.menuCardShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.menuOptionBody}>
                  <View style={[styles.menuIconWrap, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="book-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.menuOptionText}>
                    <Text style={[typography.label, { color: colors.textPrimary }]}>Read one hadith at a time</Text>
                    <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 4 }]}>
                      Best for a calm, simple reading experience.
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                testID="open-list-mode-btn"
                onPress={onOpenList}
                activeOpacity={0.85}
                style={[styles.menuOptionCard, styles.menuCardShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.menuOptionBody}>
                  <View style={[styles.menuIconWrap, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="list-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.menuOptionText}>
                    <Text style={[typography.label, { color: colors.textPrimary }]}>See all hadith</Text>
                    <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 4 }]}>
                      Browse the collection in pages with smooth scrolling.
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                testID="open-search-mode-btn"
                onPress={onOpenSearch}
                activeOpacity={0.85}
                style={[styles.menuOptionCard, styles.menuCardShadow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.menuOptionBody}>
                  <View style={[styles.menuIconWrap, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name="search" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.menuOptionText}>
                    <Text style={[typography.label, { color: colors.textPrimary }]}>Search hadith</Text>
                    <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 4 }]}>
                      Find a hadith by word, narrator, or chapter.
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : mode === READER_MODE ? (
          <Card style={[styles.readerTitleCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.readerTitleTopRow}>
              <View>
                <Text style={[typography.label, { color: colors.textSecondary }]}>Reader mode</Text>
                <Text style={[typography.title, { color: colors.textPrimary, marginTop: 4 }]}>{meta.name}</Text>
              </View>
              <View style={[styles.modePill, { backgroundColor: colors.primarySoft }]}>
                <Text style={[typography.xs, { color: colors.primary, fontWeight: '700' }]}>One by one</Text>
              </View>
            </View>
            <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 8 }]}>{meta.arabic}</Text>
          </Card>
        ) : mode === SEARCH_MODE ? (
          <Card style={[styles.readerTitleCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.readerTitleTopRow}>
              <View>
                <Text style={[typography.label, { color: colors.textSecondary }]}>Search mode</Text>
                <Text style={[typography.title, { color: colors.textPrimary, marginTop: 4 }]}>{meta.name}</Text>
              </View>
              <View style={[styles.modePill, { backgroundColor: colors.primarySoft }]}>
                <Text style={[typography.xs, { color: colors.primary, fontWeight: '700' }]}>Find fast</Text>
              </View>
            </View>
            <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 8 }]}>{meta.arabic}</Text>
          </Card>
        ) : (
          <>
            <View style={[styles.banner, { backgroundColor: meta.color }]}>
              <Text style={[typography.label, { color: 'rgba(255,255,255,0.8)' }]}>Browse mode</Text>
              <Text style={styles.bannerTitle}>{meta.name}</Text>
              <Text style={styles.bannerSubtitle}>{meta.arabic}</Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <View style={styles.infoRow}>
                <View style={styles.infoBlock}>
                  <Text style={[typography.xs, { color: colors.textSecondary }]}>VIEW</Text>
                  <Text style={[typography.label, { color: colors.textPrimary, marginTop: 2 }]}>See all hadith</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {children}
      </View>
    </ScreenContainer>
  );
}

function ReaderView({
  collection,
  onClose,
  onOpenList,
  onOpenSearch,
}: {
  collection: HadithCollectionKey;
  onClose: () => void;
  onOpenList: () => void;
  onOpenSearch: () => void;
}) {
  const { colors, typography, spacing } = useTheme();
  const [currentHadith, setCurrentHadith] = useState<HadithRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingNext, setFetchingNext] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResultCount, setSearchResultCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadOneHadith = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);
    setSearchResultCount(null);
    setLoading(true);

    try {
      const hadith = await getRandomHadith(collection);
      if (requestId !== requestIdRef.current) return;
      if (!hadith) {
        throw new Error('No hadith returned');
      }
      setCurrentHadith(hadith);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.warn('Failed to load hadith:', err);
      setCurrentHadith(null);
      setError('We could not load a hadith right now.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [collection]);

  useEffect(() => {
    loadOneHadith();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadOneHadith]);

  const handleNext = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setFetchingNext(true);
    setError(null);
    setSearchResultCount(null);

    try {
      const hadith = await getRandomHadith(collection);
      if (requestId !== requestIdRef.current) return;
      if (!hadith) throw new Error('No hadith returned');
      setCurrentHadith(hadith);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.warn('Next hadith failed:', err);
      setError('We could not load the next hadith.');
    } finally {
      if (requestId === requestIdRef.current) {
        setFetchingNext(false);
      }
    }
  }, [collection]);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setError('Enter at least 2 characters to search.');
      return;
    }

    const requestId = ++requestIdRef.current;
    setSearching(true);
    setError(null);

    try {
      const results: HadithSearchResult = await searchHadiths(query, collection, 25);
      if (requestId !== requestIdRef.current) return;
      if (!results.items.length) {
        setError('No hadith matched that search.');
        setSearchResultCount(0);
        return;
      }
      setCurrentHadith(results.items[0]);
      setSearchResultCount(results.totalFound);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.warn('Hadith search failed:', err);
      setSearchResultCount(null);
      setError('We could not search hadith right now.');
    } finally {
      if (requestId === requestIdRef.current) {
        setSearching(false);
      }
    }
  }, [collection, searchQuery]);

  return (
    <CollectionShell collection={collection} mode="reader" onClose={onClose} onOpenList={onOpenList} onOpenSearch={onOpenSearch}>
      <ScrollView
        style={styles.readerScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.readerScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.searchCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[typography.label, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Search hadith</Text>
          <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              testID="hadith-search-input"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Enter words, narrator, or chapter"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                testID="clear-hadith-search"
                onPress={() => {
                  setSearchQuery('');
                  setSearchResultCount(null);
                  setError(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {searchResultCount !== null ? (
            <View
              style={[
                styles.searchCountChip,
                {
                  backgroundColor: searchResultCount > 0 ? colors.chipBackground : colors.errorSoft,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.xs,
                  {
                    color: searchResultCount > 0 ? colors.primary : colors.error,
                    fontWeight: '700',
                  },
                ]}
              >
                {searchResultCount === 0
                  ? 'No results found'
                  : `${searchResultCount} result${searchResultCount === 1 ? '' : 's'} found`}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            testID="search-hadith-btn"
            style={[styles.searchBtn, { backgroundColor: colors.primary, marginTop: spacing.sm }]}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="search" size={16} color={colors.onPrimary} />
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Search</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>Loading hadith...</Text>
          </View>
        ) : error ? (
          <Card style={[styles.errorCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.textSecondary} />
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
              {error}
            </Text>
            <TouchableOpacity
              testID="hadith-retry-btn"
              style={[styles.retryBtn, { backgroundColor: colors.primary, marginTop: spacing.lg }]}
              onPress={loadOneHadith}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : currentHadith ? (
          <>
            <HadithItemCard item={currentHadith} colors={colors} typography={typography} spacing={spacing} />

            <View style={styles.actionRow}>
              <TouchableOpacity
                testID="next-hadith-btn"
                style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                onPress={handleNext}
                activeOpacity={0.8}
                disabled={fetchingNext}
              >
                {fetchingNext ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <>
                    <Ionicons name="shuffle" size={16} color={colors.onPrimary} />
                    <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Next hadith</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                testID="open-list-view-inline-btn"
                style={[styles.secondaryActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={onOpenList}
                activeOpacity={0.8}
              >
                <Ionicons name="list" size={16} color={colors.textPrimary} />
                <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>See all hadith</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="open-search-view-inline-btn"
                style={[styles.secondaryActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={onOpenSearch}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={16} color={colors.textPrimary} />
                <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Search hadith</Text>
              </TouchableOpacity>

            </View>
          </>
        ) : null}
      </ScrollView>
    </CollectionShell>
  );
}

function ListView({
  collection,
  onClose,
  onOpenReader,
  onOpenSearch,
}: {
  collection: HadithCollectionKey;
  onClose: () => void;
  onOpenReader: () => void;
  onOpenSearch: () => void;
}) {
  const { colors, typography, spacing } = useTheme();
  const { hadiths, loading, loadingMore, hasMore, error, refresh, loadMore } = useHadithCollection(collection, PAGE_SIZE);

  const handleEndReached = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      loadMore();
    }
  }, [hasMore, loadMore, loading, loadingMore]);

  const renderItem = useCallback(
    ({ item }: { item: HadithRecord }) => (
      <HadithItemCard item={item} colors={colors} typography={typography} spacing={spacing} />
    ),
    [colors, typography, spacing]
  );

  const keyExtractor = useCallback(
    (item: HadithRecord, index: number) => `${item.collection}-${item.number || 'row'}-${index}`,
    []
  );

  return (
    <CollectionShell
      collection={collection}
      mode="list"
      onClose={onClose}
      onOpenReader={onOpenReader}
      onOpenList={onOpenReader}
      onOpenSearch={onOpenSearch}
    >
      {error && hadiths.length === 0 ? (
        <Card style={[styles.errorCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="alert-circle-outline" size={34} color={colors.textSecondary} />
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
            {error}
          </Text>
          <TouchableOpacity
            testID="hadith-retry-btn"
            style={[styles.retryBtn, { backgroundColor: colors.primary, marginTop: spacing.lg }]}
            onPress={refresh}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <FlatList
          testID="hadith-collection-list"
          data={hadiths}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          refreshing={loading && hadiths.length > 0}
          onRefresh={refresh}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>Loading collection...</Text>
              </View>
            ) : (
              <View style={styles.centerState}>
                <Ionicons name="book-outline" size={42} color={colors.textSecondary} />
                <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
                  No hadith loaded yet.
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerState}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 8 }]}>Loading more</Text>
              </View>
            ) : hasMore ? (
              <View style={styles.footerState}>
                <Text style={[typography.xs, { color: colors.textMuted }]}>Scroll to load more</Text>
              </View>
            ) : (
              <View style={styles.footerState}>
                <Text style={[typography.xs, { color: colors.textMuted }]}>End of collection</Text>
              </View>
            )
          }
        />
      )}
    </CollectionShell>
  );
}

function SearchView({
  collection,
  onClose,
  onOpenReader,
  onOpenList,
}: {
  collection: HadithCollectionKey;
  onClose: () => void;
  onOpenReader: () => void;
  onOpenList: () => void;
}) {
  const { colors, typography, spacing } = useTheme();
  const [currentHadith, setCurrentHadith] = useState<HadithRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResultCount, setSearchResultCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setError('Enter at least 2 characters to search.');
      return;
    }

    const requestId = ++requestIdRef.current;
    setSearching(true);
    setLoading(true);
    setError(null);

    try {
      const results: HadithSearchResult = await searchHadiths(query, collection, 25);
      if (requestId !== requestIdRef.current) return;
      if (!results.items.length) {
        setCurrentHadith(null);
        setSearchResultCount(0);
        setError('No hadith matched that search.');
        return;
      }
      setCurrentHadith(results.items[0]);
      setSearchResultCount(results.totalFound);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.warn('Hadith search failed:', err);
      setCurrentHadith(null);
      setSearchResultCount(null);
      setError('We could not search hadith right now.');
    } finally {
      if (requestId === requestIdRef.current) {
        setSearching(false);
        setLoading(false);
      }
    }
  }, [collection, searchQuery]);

  return (
    <CollectionShell
      collection={collection}
      mode="search"
      onClose={onClose}
      onOpenReader={onOpenReader}
      onOpenList={onOpenList}
    >
      <ScrollView
        style={styles.readerScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.readerScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.searchCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[typography.label, { color: colors.textPrimary, marginBottom: spacing.sm }]}>Search hadith</Text>
          <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              testID="hadith-search-input"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Enter words, narrator, or chapter"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                testID="clear-hadith-search"
                onPress={() => {
                  setSearchQuery('');
                  setSearchResultCount(null);
                  setError(null);
                  setCurrentHadith(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {searchResultCount !== null ? (
            <View
              style={[
                styles.searchCountChip,
                {
                  backgroundColor: searchResultCount > 0 ? colors.chipBackground : colors.errorSoft,
                  marginTop: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  typography.xs,
                  {
                    color: searchResultCount > 0 ? colors.primary : colors.error,
                    fontWeight: '700',
                  },
                ]}
              >
                {searchResultCount === 0
                  ? 'No results found'
                  : `${searchResultCount} result${searchResultCount === 1 ? '' : 's'} found`}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            testID="search-hadith-btn"
            style={[styles.searchBtn, { backgroundColor: colors.primary, marginTop: spacing.sm }]}
            onPress={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="search" size={16} color={colors.onPrimary} />
                <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Search</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>Loading hadith...</Text>
          </View>
        ) : error ? (
          <Card style={[styles.errorCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={34} color={colors.textSecondary} />
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
              {error}
            </Text>
          </Card>
        ) : currentHadith ? (
          <HadithItemCard item={currentHadith} colors={colors} typography={typography} spacing={spacing} />
        ) : null}
      </ScrollView>
    </CollectionShell>
  );
}

export default function HadithCollectionScreen() {
  const { bookId, view } = useLocalSearchParams<{ bookId: string; view?: string | string[] }>();
  const router = useRouter();

  const collection = useMemo(() => {
    const value = resolveParam(bookId);
    const allowed = value && value in COLLECTION_META ? (value as HadithCollectionKey) : 'bukhari';
    return allowed;
  }, [bookId]);

  const mode = (() => {
    const value = resolveParam(view);
    if (value === LIST_MODE) return LIST_MODE;
    if (value === SEARCH_MODE) return SEARCH_MODE;
    if (value === READER_MODE) return READER_MODE;
    return MENU_MODE;
  })();

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/hadith');
  }, [router]);

  const openReader = useCallback(() => {
    router.push(`/hadith/${collection}?view=reader`);
  }, [collection, router]);

  const openList = useCallback(() => {
    router.push(`/hadith/${collection}?view=list`);
  }, [collection, router]);

  const openSearch = useCallback(() => {
    router.push(`/hadith/${collection}?view=search`);
  }, [collection, router]);

  if (mode === LIST_MODE) {
    return <ListView collection={collection} onClose={handleClose} onOpenReader={openReader} onOpenSearch={openSearch} />;
  }

  if (mode === SEARCH_MODE) {
    return <SearchView collection={collection} onClose={handleClose} onOpenReader={openReader} onOpenList={openList} />;
  }

  if (mode === READER_MODE) {
    return <ReaderView collection={collection} onClose={handleClose} onOpenList={openList} onOpenSearch={openSearch} />;
  }

  return (
    <CollectionShell
      collection={collection}
      mode={MENU_MODE}
      onClose={handleClose}
      onOpenReader={openReader}
      onOpenList={openList}
      onOpenSearch={openSearch}
    >
      <View />
    </CollectionShell>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  menuContent: {
    gap: 14,
  },
  menuHeroCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  menuOptions: {
    gap: 12,
  },
  menuOptionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuCardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuOptionBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  readerScrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  readerScroll: {
    flex: 1,
  },
  headerAction: { padding: 4 },
  readerTitleCard: {
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  readerTitleTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modePill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  banner: {
    borderRadius: 24,
    padding: 20,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 6,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
  },
  infoCard: {
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBlock: {
    flex: 1,
    paddingRight: 12,
  },
  modeBtn: {
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  footerState: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  errorCard: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  searchCard: {
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  searchBtn: {
    minHeight: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchCountChip: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryBtn: {
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hadithCard: {
    marginTop: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 44,
    textAlign: 'right',
    fontWeight: '400',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryActionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 28,
  },
});
