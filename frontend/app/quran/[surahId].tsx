import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { SURAHS, Ayah } from '../../src/data/quran';
import { useSettings } from '../../src/store/useSettings';
import { useEntitlements } from '../../src/store/useEntitlements';
import { ScreenContainer, Card } from '../../src/ui/components';
import { getSurah, isQuranTranslationLanguageSupported } from '../../src/services/quranApi';

export default function QuranReaderScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { translationLang } = useSettings();
  const plan = useEntitlements((state) => state.plan);

  const surahIdNum = parseInt(surahId || '1', 10);
  const surah = SURAHS.find((s) => s.id === surahIdNum);

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);

  const canUseMultiLang = plan === 'pro';
  const isProLang = ['hindi', 'bangla', 'tamil', 'malayalam', 'telugu', 'kannada', 'gujarati'].includes(translationLang);
  const isComingSoonLang = ['telugu', 'kannada'].includes(translationLang);
  const isQuranSupportedLang = isQuranTranslationLanguageSupported(translationLang);
  const showTranslation = !isProLang || (canUseMultiLang && !isComingSoonLang && isQuranSupportedLang);
  const effectiveLang = showTranslation ? translationLang : 'english';

  useEffect(() => {
    if (!canUseMultiLang || (!isComingSoonLang && translationLang !== 'gujarati')) return;

    Alert.alert(
      translationLang === 'gujarati' ? 'Gujarati not ready for Quran' : 'Coming Soon',
      translationLang === 'gujarati'
        ? 'Gujarati is available for 99 Names, but Quran translations are not available yet. English is shown for now.'
        : 'Telugu and Kannada are coming soon. Please choose another language for now.',
      [{ text: 'OK' }]
    );
  }, [canUseMultiLang, isComingSoonLang, translationLang]);

  useEffect(() => {
    const loadSurahData = async () => {
      setLoading(true);
      const data = await getSurah(surahIdNum, effectiveLang);
      setAyahs(data);
      setLoading(false);
    };

    loadSurahData();
  }, [surahIdNum, effectiveLang]);

  return (
    <ScreenContainer scrollable={false}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="quran-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>{surah?.name || 'Surah'}</Text>
          <Text style={[typography.xs, { color: colors.textSecondary }]}>{surah?.translation}</Text>
        </View>
        <TouchableOpacity testID="quran-bookmark-btn" style={styles.bookmarkBtn}>
          <Ionicons name="bookmark-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
        {/* Surah Info Banner */}
        <View style={[styles.surahBanner, { backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg }]}>
          <Text style={styles.bannerArabic}>{surah?.nameArabic}</Text>
          <Text style={styles.bannerInfo}>
            {surah?.revelationType} • {surah?.versesCount} Verses
          </Text>
        </View>

        {/* Pro language warning */}
        {isComingSoonLang && canUseMultiLang ? (
          <View style={[styles.proWarning, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg }]}>
            <Ionicons name="time-outline" size={16} color="#D97706" />
            <Text style={styles.proWarningText}>
              Telugu and Kannada are coming soon. English is shown for now.
            </Text>
          </View>
        ) : translationLang === 'gujarati' && canUseMultiLang ? (
          <View style={[styles.proWarning, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg }]}>
            <Ionicons name="language-outline" size={16} color="#D97706" />
            <Text style={styles.proWarningText}>
              Gujarati is available for 99 Names, but Quran translations are not available yet. English is shown for now.
            </Text>
          </View>
        ) : isProLang && !canUseMultiLang && (
          <View style={[styles.proWarning, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg }]}>
            <Ionicons name="lock-closed" size={16} color="#D97706" />
            <Text style={styles.proWarningText}>
              {translationLang.charAt(0).toUpperCase() + translationLang.slice(1)} is included with Pro. English is shown for now.
            </Text>
          </View>
        )}

        {/* Ayahs */}
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>Loading Surah...</Text>
          </View>
        ) : ayahs.length > 0 ? (
          ayahs.map((ayah) => (
            <Card key={ayah.number} testID={`ayah-${ayah.number}`} style={{ marginBottom: spacing.md }}>
              <View style={[styles.ayahNumberBadge, { backgroundColor: colors.chipBackground, borderRadius: 14 }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{ayah.number}</Text>
              </View>
              <Text style={[styles.arabicText, { color: colors.textPrimary }]}>{ayah.arabic}</Text>
              <View style={[styles.translationDivider, { backgroundColor: colors.border }]} />
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                {ayah.translations[effectiveLang as keyof typeof ayah.translations] || ayah.translations.english}
              </Text>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg }]}>
              We could not open this Surah right now. Please check your connection and try again.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  bookmarkBtn: { padding: 4 },
  surahBanner: { alignItems: 'center' },
  bannerArabic: { color: '#fff', fontSize: 28, fontWeight: '400', marginBottom: 4 },
  bannerInfo: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  ayahNumberBadge: { alignSelf: 'flex-start', width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  arabicText: { fontSize: 24, lineHeight: 44, textAlign: 'right', fontWeight: '400', marginBottom: 16 },
  translationDivider: { height: 1, marginBottom: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  proWarning: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, gap: 8 },
  proWarningText: { fontSize: 12, color: '#92400E', flex: 1 },
});
