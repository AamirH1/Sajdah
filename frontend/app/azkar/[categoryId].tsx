import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { spacing, radius, typography } from '../../src/theme';
import { AZKAR_CATEGORIES, AZKAR_ITEMS } from '../../src/data/azkar';

export default function AzkarDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});

  const category = AZKAR_CATEGORIES.find((c) => c.id === categoryId);
  const items = AZKAR_ITEMS.filter((item) => item.categoryId === categoryId);

  const handleTap = (itemId: string, maxRepeat: number) => {
    setCompletedCounts((prev) => {
      const current = prev[itemId] || 0;
      if (current >= maxRepeat) return prev;
      return { ...prev, [itemId]: current + 1 };
    });
  };

  const handleReset = (itemId: string) => {
    setCompletedCounts((prev) => ({ ...prev, [itemId]: 0 }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="azkar-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{category?.name || 'Azkar'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{category?.nameArabic}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Items */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {items.map((item, index) => {
          const completed = completedCounts[item.id] || 0;
          const isDone = completed >= item.repeat;

          return (
            <View
              key={item.id}
              testID={`dhikr-item-${item.id}`}
              style={[styles.dhikrCard, { backgroundColor: colors.surface, borderColor: isDone ? colors.success : colors.border }]}
            >
              {/* Counter Badge */}
              <View style={styles.counterRow}>
                <View style={[styles.indexBadge, { backgroundColor: category?.color + '20' }]}>
                  <Text style={[styles.indexText, { color: category?.color }]}>{index + 1}</Text>
                </View>
                <View style={[styles.repeatBadge, { backgroundColor: isDone ? '#D1FAE5' : colors.accentLight }]}>
                  <Text style={[styles.repeatText, { color: isDone ? '#059669' : colors.primary }]}>
                    {completed}/{item.repeat}
                  </Text>
                </View>
              </View>

              {/* Arabic */}
              <Text style={[styles.arabicText, { color: colors.textPrimary }]}>{item.arabic}</Text>

              {/* Transliteration */}
              <Text style={[styles.transliteration, { color: colors.primary }]}>{item.transliteration}</Text>

              {/* Translation */}
              <Text style={[styles.translation, { color: colors.textSecondary }]}>{item.translation}</Text>

              {/* Reference */}
              <Text style={[styles.reference, { color: colors.textSecondary }]}>[{item.reference}]</Text>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  testID={`dhikr-tap-${item.id}`}
                  style={[styles.tapBtn, { backgroundColor: isDone ? colors.success : colors.primary }]}
                  onPress={() => handleTap(item.id, item.repeat)}
                  disabled={isDone}
                  activeOpacity={0.7}
                >
                  <Ionicons name={isDone ? 'checkmark-circle' : 'add'} size={20} color="#fff" />
                  <Text style={styles.tapBtnText}>{isDone ? 'Done' : 'Tap'}</Text>
                </TouchableOpacity>
                {completed > 0 && (
                  <TouchableOpacity
                    testID={`dhikr-reset-${item.id}`}
                    style={[styles.resetBtn, { borderColor: colors.border }]}
                    onPress={() => handleReset(item.id)}
                  >
                    <Ionicons name="refresh" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  listContent: { padding: spacing.lg },
  dhikrCard: { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  indexBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: 12, fontWeight: '700' },
  repeatBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  repeatText: { fontSize: 12, fontWeight: '700' },
  arabicText: { fontSize: 22, lineHeight: 40, textAlign: 'right', marginBottom: spacing.md },
  transliteration: { fontSize: 14, fontStyle: 'italic', marginBottom: spacing.sm },
  translation: { fontSize: 14, lineHeight: 22, marginBottom: spacing.sm },
  reference: { fontSize: 11, marginBottom: spacing.md },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tapBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, gap: spacing.xs },
  tapBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resetBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
