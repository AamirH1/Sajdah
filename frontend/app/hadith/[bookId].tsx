import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Pressable,
  Animated,
} from 'react-native';
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

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const MenuOptionCard = memo(function MenuOptionCard({
  testID,
  onPress,
  icon,
  title,
  subtitle,
  colors,
  typography,
  accentColor,
}: {
  testID: string;
  onPress?: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  accentColor: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.spring(scale, {
        toValue,
        speed: 28,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
    },
    [scale]
  );

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={() => animateTo(0.97)}
      onPressOut={() => animateTo(1)}
      style={({ pressed }) => [styles.menuPressable, pressed && styles.menuPressed]}
    >
      <Animated.View
        style={[
          styles.menuOptionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={styles.menuOptionBody}>
          <View style={[styles.menuIconWrap, { backgroundColor: hexToRgba(accentColor, 0.12) }]}>
            <Ionicons name={icon} size={22} color={accentColor} />
          </View>
          <View style={styles.menuOptionText}>
            <Text style={[typography.body, styles.menuTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
            <Text
              style={[typography.body, styles.menuSubtitle, { color: colors.textSecondary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.menuChevron} />
      </Animated.View>
    </Pressable>
  );
});

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

      <View style={[styles.divider, { backgroundColor: colors.divider }]} />

      <Text style={[typography.body, { color: colors.textPrimary, lineHeight: 24 }]}>
        {item.translation || item.text || 'Translation will appear here when available.'}
      </Text>

      {(item.narrator || item.chapter) && (
        <View style={{ marginTop: spacing.lg }}>
          {item.narrator ? (
            <Text style={[typography.xs, { color: colors.textMuted, marginBottom: 4, fontStyle: 'italic', textAlign: 'right' }]}>— Narrator: {item.narrator}</Text>
          ) : null}
          {item.chapter ? (
            <Text style={[typography.xs, { color: colors.textMuted, fontStyle: 'italic', textAlign: 'right' }]}>— Chapter: {item.chapter}</Text>
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
    menu: 'Choose what feels right',
    reader: 'A calm way to begin',
    list: 'See more without rushing',
    search: 'Find a hadith quickly',
  };

  return (
    <ScreenContainer scrollable={false}>
      {mode === MENU_MODE || mode === READER_MODE || mode === SEARCH_MODE ? (
        <View style={styles.menuTopBar}>
          <TouchableOpacity
            testID="hadith-book-home-btn"
            onPress={onClose}
            style={styles.headerAction}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={colors.screenTextPrimary} />
          </TouchableOpacity>
        </View>
      ) : (
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
              <Ionicons name="close" size={24} color={colors.screenTextPrimary} />
            </TouchableOpacity>
          }
        />
      )}

      <View style={styles.shellContent}>
        {mode === MENU_MODE ? (
          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={styles.menuScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.menuIntro}>
              <Text style={[styles.bannerTitle, { color: colors.screenTextPrimary, marginTop: 0 }]}>{meta.name}</Text>
              <Text style={[typography.body, { color: colors.screenTextSecondary, marginTop: 4 }]}>
                {subtitleByMode.menu}
              </Text>
            </View>
            <Card
              style={[
                styles.menuHeroCard,
                {
                  backgroundColor: meta.color,
                  borderColor: meta.color,
                },
              ]}
            >
              <Text style={[typography.label, { color: 'rgba(255,255,255,0.82)' }]}>Start reading</Text>
              <Text style={styles.bannerTitle}>Choose how you want to begin</Text>
              <Text style={[typography.xs, { color: 'rgba(255,255,255,0.82)', marginTop: 8 }]}>{meta.arabic}</Text>
              <Text style={[typography.body, { color: 'rgba(255,255,255,0.82)', marginTop: 14, lineHeight: 22 }]}>
                Read slowly, explore in order, or search for the hadith you have in mind.
              </Text>
            </Card>

            <View style={styles.menuOptions}>
              <MenuOptionCard
                testID="open-reader-mode-btn"
                onPress={onOpenReader}
                icon="book-outline"
                title="Read one hadith at a time"
                subtitle="Best for a calm, simple reading experience."
                colors={colors}
                typography={typography}
                accentColor={meta.color}
              />

              <MenuOptionCard
                testID="open-list-mode-btn"
                onPress={onOpenList}
                icon="list-outline"
                title="See all hadith"
                subtitle="See the full list a few at a time."
                colors={colors}
                typography={typography}
                accentColor={meta.color}
              />

              <MenuOptionCard
                testID="open-search-mode-btn"
                onPress={onOpenSearch}
                icon="search"
                title="Search hadith"
                subtitle="Find a hadith by word, narrator, or chapter."
                colors={colors}
                typography={typography}
                accentColor={meta.color}
              />
            </View>
          </ScrollView>
        ) : mode === READER_MODE ? (
          <>
            <View style={styles.readerIntro}>
              <Text style={[styles.bannerTitle, { color: colors.screenTextPrimary, marginTop: 0 }]}>{meta.name}</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
                {subtitleByMode.reader}
              </Text>
            </View>
            <Card style={[styles.readerTitleCard, { backgroundColor: meta.color, borderColor: meta.color }]}>
              <Text style={[typography.label, { color: 'rgba(255,255,255,0.82)' }]}>Gentle reading</Text>
              <Text style={styles.bannerTitle}>Read one hadith at a time</Text>
              <Text style={[typography.xs, { color: 'rgba(255,255,255,0.82)', marginTop: 8 }]}>{meta.arabic}</Text>
              <Text style={styles.bannerDescription}>
                A quiet flow for reflecting on one narration before moving to the next.
              </Text>
            </Card>
          </>
        ) : mode === SEARCH_MODE ? (
          <>
            <View style={styles.searchIntro}>
              <Text style={[styles.bannerTitle, { color: colors.screenTextPrimary, marginTop: 0 }]}>{meta.name}</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
                {subtitleByMode.search}
              </Text>
            </View>
            <Card style={[styles.readerTitleCard, { backgroundColor: meta.color, borderColor: meta.color }]}>
              <Text style={[typography.label, { color: 'rgba(255,255,255,0.82)' }]}>Quick search</Text>
              <Text style={styles.bannerTitle}>Find a hadith by words you remember</Text>
              <Text style={[typography.xs, { color: 'rgba(255,255,255,0.82)', marginTop: 8 }]}>{meta.arabic}</Text>
              <Text style={styles.bannerDescription}>
                Look up hadith by keyword, narrator, or chapter when you already have something in mind.
              </Text>
            </Card>
          </>
        ) : (
          <>
            <View style={[styles.banner, { backgroundColor: meta.color }]}>
              <Text style={[typography.label, { color: 'rgba(255,255,255,0.8)' }]}>Browse freely</Text>
              <Text style={styles.bannerTitle}>Explore every hadith in order</Text>
              <Text style={styles.bannerSubtitle}>{meta.arabic}</Text>
              <Text style={styles.bannerDescription}>
                Move through {meta.name} in order, with more hadith loading as you scroll.
              </Text>
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
}: {
  collection: HadithCollectionKey;
  onClose: () => void;
}) {
  const { colors, typography, spacing } = useTheme();
  const meta = COLLECTION_META[collection] || COLLECTION_META.bukhari;
  const [currentHadith, setCurrentHadith] = useState<HadithRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingNext, setFetchingNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadOneHadith = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);
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

  return (
    <CollectionShell collection={collection} mode="reader" onClose={onClose}>
      <ScrollView
        style={styles.readerScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.readerScrollContent}
        keyboardShouldPersistTaps="handled"
      >
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
              style={[styles.retryBtn, { backgroundColor: meta.color, marginTop: spacing.lg }]}
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
                style={[styles.primaryActionBtn, { backgroundColor: meta.color }]}
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
  const meta = COLLECTION_META[collection] || COLLECTION_META.bukhari;
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
            style={[styles.retryBtn, { backgroundColor: meta.color, marginTop: spacing.lg }]}
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
  const meta = COLLECTION_META[collection] || COLLECTION_META.bukhari;
  const [currentHadith, setCurrentHadith] = useState<HadithRecord | null>(null);
  const [searchResults, setSearchResults] = useState<HadithRecord[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
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
        setSearchResults([]);
        setSearchIndex(0);
        setSearchResultCount(0);
        setError('No hadith matched that search.');
        return;
      }
      setSearchResults(results.items);
      setSearchIndex(0);
      setCurrentHadith(results.items[0]);
      setSearchResultCount(results.totalFound);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.warn('Hadith search failed:', err);
      setCurrentHadith(null);
      setSearchResults([]);
      setSearchIndex(0);
      setSearchResultCount(null);
      setError('We could not search hadith right now.');
    } finally {
      if (requestId === requestIdRef.current) {
        setSearching(false);
        setLoading(false);
      }
    }
  }, [collection, searchQuery]);

  const handleNextResult = useCallback(() => {
    if (!searchResults.length) return;

    const nextIndex = (searchIndex + 1) % searchResults.length;
    setSearchIndex(nextIndex);
    setCurrentHadith(searchResults[nextIndex] || null);
  }, [searchIndex, searchResults]);

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
                  setSearchResults([]);
                  setSearchIndex(0);
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
                    color: searchResultCount > 0 ? meta.color : colors.error,
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
            style={[styles.searchBtn, { backgroundColor: meta.color, marginTop: spacing.sm }]}
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
          <>
            {searchResultCount !== null ? (
              <View style={[styles.searchPositionChip, { backgroundColor: colors.chipBackground }]}>
                <Text style={[typography.xs, { color: meta.color, fontWeight: '700' }]}>
                  Showing {searchIndex + 1} of {searchResultCount} results
                </Text>
              </View>
            ) : null}
            <HadithItemCard item={currentHadith} colors={colors} typography={typography} spacing={spacing} />

            {searchResults.length > 1 ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  testID="next-search-result-btn"
                  style={[styles.primaryActionBtn, { backgroundColor: meta.color }]}
                  onPress={handleNextResult}
                  activeOpacity={0.8}
                >
                  <Ionicons name="shuffle" size={16} color={colors.onPrimary} />
                  <Text style={[styles.actionBtnText, { color: colors.onPrimary }]}>Next result</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
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
    return <ReaderView collection={collection} onClose={handleClose} />;
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuTopBar: {
    height: 52,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  menuIntro: {
    marginBottom: 12,
  },
  menuHeroCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  menuOptions: {
    marginTop: 20,
    gap: 10,
  },
  menuOptionCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuOptionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
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
    flexShrink: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 4,
  },
  menuChevron: {
    marginLeft: 8,
    alignSelf: 'center',
    flexShrink: 0,
  },
  menuPressable: {
    borderRadius: 20,
  },
  menuPressed: {
    opacity: 0.85,
  },
  readerScrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  readerScroll: {
    flex: 1,
  },
  headerAction: { padding: 4 },
  readerIntro: {
    marginTop: 16,
    marginBottom: 12,
  },
  searchIntro: {
    marginTop: 16,
    marginBottom: 12,
  },
  readerTitleCard: {
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
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
  bannerDescription: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
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
    borderRadius: 20,
    padding: 24,
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
  searchPositionChip: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
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
    fontSize: 30,
    lineHeight: 56,
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
