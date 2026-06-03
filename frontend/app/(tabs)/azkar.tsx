import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { ScreenContainer } from '../../src/ui/components';
import { getDynamicScreenGradient, hexToRgba } from '../../src/ui/colorUtils';
import { spacing, radius, typography } from '../../src/theme';
import { AZKAR_CATEGORIES } from '../../src/data/azkar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFloatingTabBarContentPadding } from '../../src/ui/tabBarMetrics';

export default function AzkarScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenTitleColor = isDark ? colors.screenTextPrimary : colors.textPrimary;
  const screenSubtitleColor = isDark ? colors.screenTextSecondary : colors.textSecondary;
  const screenGradient = getDynamicScreenGradient(colors, isDark);
  const dynamicAccentTint = isDark ? colors.dateBadgeBg : hexToRgba(colors.primary, 0.16);

  const renderCategory = ({ item, index }: { item: typeof AZKAR_CATEGORIES[0]; index: number }) => (
    <TouchableOpacity
      testID={`azkar-category-${item.id}`}
      style={[styles.categoryCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      onPress={() => router.push(`/azkar/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIcon, { backgroundColor: dynamicAccentTint }]}>
        <Ionicons name={item.icon as any} size={28} color={colors.primary} />
      </View>
      <Text style={[styles.categoryName, { color: colors.onSurface }]}>{item.name}</Text>
      <Text style={[styles.categoryArabic, { color: colors.onSurfaceSecondary }]}>{item.nameArabic}</Text>
      <View style={[styles.countBadge, { backgroundColor: dynamicAccentTint }]}>
        <Text style={[styles.countText, { color: colors.primary }]}>{item.count} duas</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scrollable={false} heroGradient={screenGradient}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: screenTitleColor }]}>Azkar & Duas</Text>
          <Text style={[styles.subtitle, { color: screenSubtitleColor }]}>Daily Remembrance</Text>
        </View>
        <TouchableOpacity
          testID="open-tasbih-btn"
          style={[styles.tasbihBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/tasbih')}
          activeOpacity={0.7}
        >
        <Ionicons name="radio-button-on" size={18} color={colors.onPrimary} />
        <Text style={[styles.tasbihBtnText, { color: colors.onPrimary }]}>Tasbih</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Grid */}
      <FlatList
        testID="azkar-categories-list"
        data={AZKAR_CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        // Match list padding to the floating tab bar so the last Azkar card stays tappable.
        contentContainerStyle={[styles.listContent, { paddingBottom: getFloatingTabBarContentPadding(insets.bottom) }]}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h2 },
  subtitle: { ...typography.small, marginTop: 2 },
  tasbihBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, gap: spacing.xs },
  tasbihBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  listContent: { padding: spacing.lg, paddingTop: spacing.sm },
  gridRow: { justifyContent: 'space-between', marginBottom: spacing.md },
  categoryCard: { width: '48%', borderRadius: 20, padding: 24, borderWidth: 1, alignItems: 'center' },
  categoryIcon: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  categoryName: { ...typography.small, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  categoryArabic: { ...typography.xs, textAlign: 'center', marginBottom: spacing.sm },
  countBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  countText: { fontSize: 11, fontWeight: '600' },
});
