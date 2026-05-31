import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';

import { SURAHS } from '../../src/data/quran';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { spacing, radius, typography } from '../../src/theme';

export default function QuranScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<number | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const toggleAudio = async (surahId: number) => {
    try {
      if (playingId === surahId) {
        if (sound) await sound.stopAsync();
        setPlayingId(null);
        return;
      }

      setIsLoadingAudio(surahId);
      if (sound) await sound.unloadAsync();

      // Mishary Rashid Alafasy recitation from open mp3quran.net API
      const paddedId = String(surahId).padStart(3, '0');
      const url = `https://server8.mp3quran.net/afs/${paddedId}.mp3`;

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );

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

  const renderSurah = ({ item }: { item: typeof SURAHS[0] }) => (
    <TouchableOpacity
      testID={`surah-item-${item.id}`}
      style={[
        styles.surahItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => router.push(`/quran/${item.id}`)}
      activeOpacity={0.7}
    >
      <View
        style={[styles.surahNumber, { backgroundColor: colors.surfaceElevated }]}
      >
        <Text style={[styles.surahNumberText, { color: colors.primary }]}>{item.id}</Text>
      </View>

      <View style={styles.surahInfo}>
        <Text style={[styles.surahName, { color: colors.onSurface }]}>{item.name}</Text>
        <Text style={[styles.surahTranslation, { color: colors.onSurfaceSecondary }]}>
          {item.translation} • {item.versesCount} verses
        </Text>
      </View>

      <View style={styles.surahArabic}>
        <Text style={[styles.surahArabicText, { color: colors.onSurface }]}>{item.nameArabic}</Text>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor:
                item.revelationType === 'Meccan' ? '#FEF3C7' : '#DBEAFE',
            },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              {
                color:
                  item.revelationType === 'Meccan' ? '#92400E' : '#1E40AF',
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
              playingId === item.id ? colors.primary : colors.onSurfaceSecondary
            }
          />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{'Quran'}</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceSecondary }]}>
          {'Read & Reflect'}
        </Text>
      </View>

      {/* Search */}
      <View
        testID="quran-search"
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.onSurfaceSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.onSurface }]}
          placeholder="Search surah..."
          placeholderTextColor={colors.onSurfaceSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.onSurfaceSecondary}
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={114}
        maxToRenderPerBatch={114}
        windowSize={21}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
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
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, ...typography.body, paddingVertical: 0 },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumberText: { fontWeight: '700', fontSize: 14 },
  surahInfo: { flex: 1, marginLeft: spacing.md },
  surahName: { ...typography.bodyBold },
  surahTranslation: { ...typography.xs, marginTop: 2 },
  surahArabic: { alignItems: 'flex-end', paddingRight: spacing.sm },
  surahArabicText: { fontSize: 20, fontWeight: '400' },
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
});

