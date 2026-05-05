import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { spacing, radius, typography } from '../../src/theme';
import { SURAHS } from '../../src/data/quran';

export default function QuranScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [search, setSearch] = useState('');

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
      style={[styles.surahItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/quran/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.surahNumber, { backgroundColor: colors.accentLight }]}>
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
        <View style={[styles.typeBadge, { backgroundColor: item.revelationType === 'Meccan' ? '#FEF3C7' : '#DBEAFE' }]}>
          <Text style={[styles.typeText, { color: item.revelationType === 'Meccan' ? '#92400E' : '#1E40AF' }]}>
            {item.revelationType}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Quran</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Read & Reflect</Text>
      </View>

      {/* Search */}
      <View testID="quran-search" style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h2 },
  subtitle: { ...typography.small, marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.xl, borderWidth: 1, gap: spacing.sm },
  searchInput: { flex: 1, ...typography.body, paddingVertical: 0 },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm },
  surahItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.xl, marginBottom: spacing.sm, borderWidth: 1 },
  surahNumber: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  surahNumberText: { fontWeight: '700', fontSize: 14 },
  surahInfo: { flex: 1, marginLeft: spacing.md },
  surahName: { ...typography.bodyBold },
  surahTranslation: { ...typography.xs, marginTop: 2 },
  surahArabic: { alignItems: 'flex-end' },
  surahArabicText: { fontSize: 20, fontWeight: '400' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm, marginTop: 4 },
  typeText: { fontSize: 10, fontWeight: '600' },
});
