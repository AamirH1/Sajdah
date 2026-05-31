import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { ScreenContainer, ScreenHeader, Card } from '../../src/ui/components';

const HADITH_BOOKS = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري', count: 7563, color: '#F59E0B' },
  { id: 'muslim', name: 'Sahih Muslim', arabic: 'صحيح مسلم', count: 3033, color: '#10B981' },
  { id: 'abudawud', name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود', count: 5274, color: '#3B82F6' },
  { id: 'tirmidhi', name: 'Jami at-Tirmidhi', arabic: 'جامع الترمذي', count: 3956, color: '#8B5CF6' },
  { id: 'nasai', name: 'Sunan an-Nasai', arabic: 'سنن النسائي', count: 5758, color: '#EC4899' },
  { id: 'ibnmajah', name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه', count: 4341, color: '#14B8A6' },
];

export default function HadithScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const renderBook = ({ item }: { item: typeof HADITH_BOOKS[0] }) => (
    <TouchableOpacity
      testID={`hadith-book-${item.id}`}
      style={{ width: '48%', marginBottom: spacing.md }}
      onPress={() => router.push(`/hadith/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={{ alignItems: 'center', padding: spacing.lg, paddingVertical: spacing.xl }}>
        <View style={{ width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, backgroundColor: item.color + '20' }}>
          <Ionicons name="book" size={28} color={item.color} />
        </View>
        <Text style={[typography.title, { color: colors.onSurface, textAlign: 'center', marginBottom: 2, fontSize: 16 }]}>{item.name}</Text>
        <Text style={[typography.xs, { color: colors.onSurfaceSecondary, textAlign: 'center', marginBottom: spacing.sm }]}>{item.arabic}</Text>
        <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.surfaceElevated }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>{item.count} Ahadith</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scrollable={false}>
      <ScreenHeader 
        title="Hadith Library" 
        subtitle="Authentic Sayings of the Prophet ﷺ"
      />

      <FlatList
        testID="hadith-books-list"
        data={HADITH_BOOKS}
        renderItem={renderBook}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 16, paddingBottom: 48 },
  gridRow: { justifyContent: 'space-between' },
});