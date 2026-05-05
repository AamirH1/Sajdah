import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { spacing, radius, typography } from '../../src/theme';
import { AZKAR_CATEGORIES } from '../../src/data/azkar';

export default function AzkarScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  const renderCategory = ({ item, index }: { item: typeof AZKAR_CATEGORIES[0]; index: number }) => (
    <TouchableOpacity
      testID={`azkar-category-${item.id}`}
      style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/azkar/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={28} color={item.color} />
      </View>
      <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{item.name}</Text>
      <Text style={[styles.categoryArabic, { color: colors.textSecondary }]}>{item.nameArabic}</Text>
      <View style={[styles.countBadge, { backgroundColor: colors.accentLight }]}>
        <Text style={[styles.countText, { color: colors.primary }]}>{item.count} duas</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Azkar & Duas</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Daily Remembrance</Text>
        </View>
        <TouchableOpacity
          testID="open-tasbih-btn"
          style={[styles.tasbihBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/tasbih')}
          activeOpacity={0.7}
        >
          <Ionicons name="radio-button-on" size={18} color="#fff" />
          <Text style={styles.tasbihBtnText}>Tasbih</Text>
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
  categoryCard: { width: '48%', borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, alignItems: 'center' },
  categoryIcon: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  categoryName: { ...typography.small, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  categoryArabic: { ...typography.xs, textAlign: 'center', marginBottom: spacing.sm },
  countBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  countText: { fontSize: 11, fontWeight: '600' },
});
