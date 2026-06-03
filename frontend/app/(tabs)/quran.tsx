import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';

import { SURAHS } from '../../src/data/quran';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { ScreenContainer, ScreenHeader } from '../../src/ui/components';
import { getDynamicScreenGradient } from '../../src/ui/colorUtils';
import { spacing, radius, typography } from '../../src/theme';
import { useSettings } from '../../src/store/useSettings';
import { QuranReciter, getQuranReciters, getSurahAudioUrls } from '../../src/services/quranReciters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFloatingTabBarContentPadding } from '../../src/ui/tabBarMetrics';

const FALLBACK_RECITERS: QuranReciter[] = [
  { id: 1, name: 'Mishary Rashid Alafasy', fallbackServer: 'server8', fallbackPath: 'afs' },
  { id: 2, name: 'Abdul Rahman Al-Sudais', fallbackServer: 'server11', fallbackPath: 'sds' },
  { id: 3, name: 'Abdul Basit Abdul Samad', fallbackServer: 'server7', fallbackPath: 'basit' },
  { id: 10, name: 'Saud Al-Shuraim', fallbackServer: 'server7', fallbackPath: 'shur' },
];

export default function QuranScreen() {
  const { colors, typography, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { quranReciterId, quranReciterName, setQuranReciter } = useSettings();
  const screenGradient = getDynamicScreenGradient(colors, isDark);

  const [search, setSearch] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<number | null>(null);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [reciters, setReciters] = useState<QuranReciter[]>(FALLBACK_RECITERS);
  const [recitersLoading, setRecitersLoading] = useState(true);
  const [selectedReciter, setSelectedReciter] = useState<QuranReciter>(FALLBACK_RECITERS[0]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    let active = true;

    const loadReciters = async () => {
      setRecitersLoading(true);
      try {
        const apiReciters = await getQuranReciters();
        if (!active) return;

        const list = apiReciters.length > 0 ? apiReciters : FALLBACK_RECITERS;
        setReciters(list);

        const matched = quranReciterId
          ? list.find((item) => item.id === quranReciterId)
          : undefined;

        const nextSelected = matched || list[0];
        setSelectedReciter(nextSelected);

        if (!quranReciterId || matched?.id !== quranReciterId || quranReciterName !== nextSelected.name) {
          setQuranReciter(nextSelected.id, nextSelected.name);
        }
      } catch (error) {
        console.warn('Failed to load Quran reciters:', error);
        if (!active) return;
        setReciters(FALLBACK_RECITERS);
        const matched = quranReciterId
          ? FALLBACK_RECITERS.find((item) => item.id === quranReciterId)
          : undefined;
        const nextSelected = matched || FALLBACK_RECITERS[0];
        setSelectedReciter(nextSelected);
        setQuranReciter(nextSelected.id, nextSelected.name);
      } finally {
        if (active) {
          setRecitersLoading(false);
        }
      }
    };

    loadReciters();

    return () => {
      active = false;
    };
  }, [quranReciterId, quranReciterName, setQuranReciter]);

  const toggleAudio = async (surahId: number) => {
    try {
      if (playingId === surahId) {
        if (sound) await sound.stopAsync();
        setPlayingId(null);
        return;
      }

      setIsLoadingAudio(surahId);
      if (sound) await sound.unloadAsync();

      const urls = selectedReciter
        ? await getSurahAudioUrls(surahId, selectedReciter)
        : [];
      if (urls.length === 0) {
        throw new Error('No audio URL available for this reciter');
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      let newSound: Audio.Sound | null = null;
      let lastPlaybackError: unknown = null;

      for (const url of urls) {
        try {
          const result = await Audio.Sound.createAsync(
            { uri: url },
            { shouldPlay: true }
          );
          newSound = result.sound;
          break;
        } catch (playbackError) {
          lastPlaybackError = playbackError;
          console.warn('Quran audio URL failed, trying next source:', url, playbackError);
        }
      }

      if (!newSound) {
        throw lastPlaybackError || new Error('No playable audio URL available for this reciter');
      }

      setSound(newSound);
      setPlayingId(surahId);
      setIsLoadingAudio(null);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsLoadingAudio(null);
      setPlayingId(null);
    }
  };

  const filteredSurahs = useMemo(() => {
    if (!search.trim()) return SURAHS;
    const q = search.toLowerCase();
    return SURAHS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.translation.toLowerCase().includes(q) ||
        s.id.toString() === q
    );
  }, [search]);

  const handleReciterSelect = (reciter: QuranReciter) => {
    setSelectedReciter(reciter);
    setQuranReciter(reciter.id, reciter.name);
    setShowReciterModal(false);
    if (sound) sound.stopAsync();
    setPlayingId(null);
  };

  const renderSurah = ({ item }: { item: typeof SURAHS[0] }) => (
    <TouchableOpacity
      testID={`surah-item-${item.id}`}
      style={[
        styles.surahItem,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
        },
      ]}
      onPress={() => router.push(`/quran/${item.id}`)}
      activeOpacity={0.7}
    >
      <View
        style={[styles.surahNumber, { backgroundColor: colors.dateBadgeBg }]}
      >
        <Text style={[styles.surahNumberText, { color: colors.primary }]}>{item.id}</Text>
      </View>

      <View style={styles.surahInfo}>
        <Text style={[styles.surahName, { color: colors.textPrimary }]}>{item.name}</Text>
        <Text style={[styles.surahTranslation, { color: colors.textSecondary }]}>
          {item.translation} • {item.versesCount} verses
        </Text>
      </View>

      <View style={styles.surahArabic}>
        <Text style={[styles.surahArabicText, { color: colors.textPrimary }]}>{item.nameArabic}</Text>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: isDark
                ? colors.primarySoft
                : item.revelationType === 'Meccan' ? '#FEF3C7' : '#DBEAFE',
            },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              {
                color:
                  isDark ? colors.textLabel : item.revelationType === 'Meccan' ? '#92400E' : '#1E40AF',
              },
            ]}
          >
            {item.revelationType}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.playButton, { borderLeftColor: colors.border }]}
        onPress={() => toggleAudio(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isLoadingAudio === item.id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons
            name={playingId === item.id ? 'stop-circle' : 'play-circle'}
            size={32}
            color={
              playingId === item.id ? colors.primary : colors.textSecondary
            }
          />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scrollable={false} heroGradient={screenGradient}>
      <ScreenHeader 
        title="Quran" 
        subtitle="Read & Reflect"
        rightAction={
        <TouchableOpacity onPress={() => setShowReciterModal(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}>
          <Ionicons name="musical-notes-outline" size={14} color={colors.primary} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
            {selectedReciter?.name || 'Reciter'}
          </Text>
        </TouchableOpacity>
      }
      />

      {/* Search */}
      <View
        testID="quran-search"
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surfaceAlt,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search surah..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Surah List */}
      <FlatList
        testID="surah-list"
        data={filteredSurahs}
        renderItem={renderSurah}
        keyExtractor={(item) => item.id.toString()}
        // Match list padding to the floating tab bar so the final Surah row stays tappable.
        contentContainerStyle={[styles.listContent, { paddingBottom: getFloatingTabBarContentPadding(insets.bottom) }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={114}
        maxToRenderPerBatch={114}
        windowSize={21}
        removeClippedSubviews={false}
      />

      <Modal
        visible={showReciterModal}
        animationType="slide"
        onRequestClose={() => setShowReciterModal(false)}
      >
        <ScreenContainer scrollable={false} heroGradient={screenGradient}>
          <View style={[styles.reciterHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              testID="reciter-picker-close-btn"
              onPress={() => setShowReciterModal(false)}
              style={styles.reciterBackBtn}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.reciterHeaderTitle, { color: colors.textPrimary }]}>Choose Reciter</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={[styles.currentReciterSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="musical-notes" size={18} color={colors.primary} />
            <Text style={[styles.currentReciterText, { color: colors.textPrimary }]}>
              Current: {selectedReciter?.name || 'Reciter'}
            </Text>
          </View>

          <Text style={[styles.reciterSectionLabel, { color: colors.textLabel }]}>SELECT A RECITER</Text>

          {recitersLoading ? (
            <View style={styles.reciterLoadingState}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 8 }]}>Loading reciters...</Text>
            </View>
          ) : (
            <FlatList
              testID="reciter-list"
              data={reciters}
              keyExtractor={(item) => String(item.id)}
              // Add runtime bottom inset so the reciter picker remains clear of Android navigation.
              contentContainerStyle={[styles.reciterListContent, { paddingBottom: spacing.huge + insets.bottom }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedReciter?.id === item.id;
                return (
                  <TouchableOpacity
                    testID={`reciter-${item.id}`}
                    style={[
                      styles.reciterItem,
                      {
                        backgroundColor: isSelected ? colors.surfaceAlt : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleReciterSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reciterInfo}>
                      <Text style={[styles.reciterName, { color: colors.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.reciterMeta, { color: colors.textSecondary }]}>
                        {item.style || item.nationality || 'Quran recitation'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.h2 },
  subtitle: { ...typography.small, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, paddingVertical: 0 },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  surahNumber: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumberText: { fontWeight: '700', fontSize: 22 },
  surahInfo: { flex: 1, marginLeft: spacing.md },
  surahName: { ...typography.bodyBold },
  surahTranslation: { ...typography.xs, marginTop: 2 },
  surahArabic: { alignItems: 'flex-end', paddingRight: spacing.sm },
  surahArabicText: { fontSize: 28, lineHeight: 56, fontWeight: '400' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  typeText: { fontSize: 10, fontWeight: '600' },
  playButton: {
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reciterPickerContainer: { flex: 1 },
  reciterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  reciterBackBtn: { padding: spacing.xs },
  reciterHeaderTitle: { ...typography.bodyBold },
  currentReciterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
  },
  currentReciterText: { ...typography.bodyBold, flex: 1 },
  reciterSectionLabel: {
    ...typography.xs,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  reciterListContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  reciterInfo: { flex: 1, paddingRight: spacing.md },
  reciterName: { ...typography.bodyBold },
  reciterMeta: { ...typography.xs, marginTop: 2 },
  reciterLoadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
});
