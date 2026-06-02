import React, { useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { spacing, radius, typography } from '../../src/ui/theme';
import { ScreenContainer } from '../../src/ui/components';
import { AZKAR_CATEGORIES, AZKAR_ITEMS } from '../../src/data/azkar';

export default function AzkarDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { colors } = useTheme();
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

  const renderItem = ({ item, index }: { item: typeof items[number]; index: number }) => {
    const completed = completedCounts[item.id] || 0;
    const isDone = completed >= item.repeat;

    return (
      <View
        testID={`dhikr-item-${item.id}`}
        style={[styles.dhikrCard, { backgroundColor: colors.surfaceAlt, borderColor: isDone ? colors.success : colors.border }]}
      >
        <View style={styles.counterRow}>
          <View style={[styles.indexBadge, { backgroundColor: colors.chipBackground }]}>
            <Text style={[styles.indexText, { color: colors.primary }]}>{index + 1}</Text>
          </View>
          <View style={[styles.repeatBadge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.repeatText, { color: colors.primary }]}>
              {completed}/{item.repeat}
            </Text>
          </View>
        </View>

        <Text style={[styles.arabicText, { color: colors.textPrimary }]}>{item.arabic}</Text>
        <Text style={[styles.transliteration, { color: colors.textSecondary }]}>{item.transliteration}</Text>
        <Text style={[styles.translation, { color: colors.textPrimary }]}>{item.translation}</Text>
        <Text style={[styles.reference, { color: colors.textMuted }]}>— {item.reference}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            testID={`dhikr-tap-${item.id}`}
            style={[styles.tapBtn, { backgroundColor: isDone ? colors.success : colors.primary }]}
            onPress={() => handleTap(item.id, item.repeat)}
            disabled={isDone}
            activeOpacity={0.7}
          >
            <Ionicons name={isDone ? 'checkmark-circle' : 'add'} size={20} color={colors.onPrimary} />
            <Text style={[styles.tapBtnText, { color: colors.onPrimary }]}>{isDone ? 'Done' : 'Tap'}</Text>
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
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="azkar-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.screenTextPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.screenTextPrimary }]}>{category?.name || 'Azkar'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.screenTextSecondary }]}>{category?.nameArabic}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={4}
        windowSize={5}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { padding: spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.bodyBold },
  headerSubtitle: { ...typography.xs },
  listContent: { padding: spacing.lg },
  dhikrCard: { borderRadius: 20, padding: 24, marginBottom: spacing.md, borderWidth: 1 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  indexBadge: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  indexText: { fontSize: 22, fontWeight: '700' },
  repeatBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  repeatText: { fontSize: 12, fontWeight: '700' },
  arabicText: { fontSize: 30, lineHeight: 56, textAlign: 'right', marginBottom: spacing.md },
  transliteration: { fontSize: 15, fontStyle: 'italic', marginBottom: spacing.sm },
  translation: { fontSize: 16, lineHeight: 24, marginBottom: spacing.sm },
  reference: { fontSize: 13, fontStyle: 'italic', textAlign: 'right', marginBottom: spacing.md },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tapBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, gap: spacing.xs },
  tapBtnText: { fontWeight: '700', fontSize: 14 },
  resetBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
