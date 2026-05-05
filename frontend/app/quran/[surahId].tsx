import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { spacing, radius, typography } from '../../src/theme';
import { SURAHS, SURAH_DATA } from '../../src/data/quran';
import { useSettings } from '../../src/store/useSettings';
import { useEntitlements, useCanUse } from '../../src/store/useEntitlements';

export default function QuranReaderScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const { translationLang } = useSettings();
  const canUseMultiLang = useCanUse('quran.multipleLanguages');

  const surahIdNum = parseInt(surahId || '1', 10);
  const surah = SURAHS.find((s) => s.id === surahIdNum);
  const ayahs = SURAH_DATA[surahIdNum] || [];

  const isProLang = ['hindi', 'bangla', 'tamil'].includes(translationLang);
  const showTranslation = !isProLang || canUse('quran.multipleLanguages');
  const effectiveLang = showTranslation ? translationLang : 'english';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="quran-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{surah?.name || 'Surah'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{surah?.translation}</Text>
        </View>
        <TouchableOpacity testID="quran-bookmark-btn" style={styles.bookmarkBtn}>
          <Ionicons name="bookmark-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Surah Info Banner */}
      <View style={[styles.surahBanner, { backgroundColor: colors.primary }]}>
        <Text style={styles.bannerArabic}>{surah?.nameArabic}</Text>
        <Text style={styles.bannerInfo}>
          {surah?.revelationType} • {surah?.versesCount} Verses
        </Text>
      </View>

      {/* Ayahs */}
      {ayahs.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ayahList}>
          {ayahs.map((ayah) => (
            <View key={ayah.number} testID={`ayah-${ayah.number}`} style={[styles.ayahCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.ayahNumberBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.ayahNumberText, { color: colors.primary }]}>{ayah.number}</Text>
              </View>
              <Text style={[styles.arabicText, { color: colors.textPrimary }]}>{ayah.arabic}</Text>
              <View style={[styles.translationDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                {ayah.translations[effectiveLang as keyof typeof ayah.translations] || ayah.translations.english}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Full text coming soon. Currently available for selected surahs.
          </Text>
        </View>
      )}

      {/* Pro language warning */}
      {isProLang && !canUseMultiLang && (
        <View style={[styles.proWarning, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <Ionicons name="lock-closed" size={16} color="#D97706" />
          <Text style={styles.proWarningText}>
            {translationLang.charAt(0).toUpperCase() + translationLang.slice(1)} translation requires Pro. Showing English.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { padding: spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.bodyBold },
  headerSubtitle: { ...typography.xs },
  bookmarkBtn: { padding: spacing.xs },
  surahBanner: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
  bannerArabic: { color: '#fff', fontSize: 28, fontWeight: '400', marginBottom: 4 },
  bannerInfo: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  ayahList: { padding: spacing.lg },
  ayahCard: { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  ayahNumberBadge: { alignSelf: 'flex-start', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  ayahNumberText: { fontSize: 12, fontWeight: '700' },
  arabicText: { fontSize: 24, lineHeight: 44, textAlign: 'right', fontWeight: '400', marginBottom: spacing.md },
  translationDivider: { height: 1, marginBottom: spacing.md },
  translationText: { fontSize: 15, lineHeight: 24 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.huge },
  emptyText: { ...typography.body, textAlign: 'center', marginTop: spacing.lg },
  proWarning: { flexDirection: 'row', alignItems: 'center', margin: spacing.lg, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm },
  proWarningText: { fontSize: 12, color: '#92400E', flex: 1 },
});
