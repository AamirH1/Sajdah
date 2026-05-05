import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { spacing, radius, typography } from '../src/theme';
import { useTasbih } from '../src/store/useTasbih';

export default function TasbihScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { counters, activeCounterId, increment, reset, setActive, addCounter, deleteCounter } = useTasbih();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('33');

  const activeCounter = counters.find((c) => c.id === activeCounterId) || counters[0];

  const handleIncrement = () => {
    if (!activeCounter) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    increment(activeCounter.id);
  };

  const handleReset = () => {
    if (!activeCounter) return;
    Alert.alert('Reset Counter', `Reset "${activeCounter.name}" to 0?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => reset(activeCounter.id), style: 'destructive' },
    ]);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCounter(newName.trim(), parseInt(newTarget, 10) || 33);
    setNewName('');
    setNewTarget('33');
    setShowAddModal(false);
  };

  const progress = activeCounter ? activeCounter.count / activeCounter.target : 0;
  const isComplete = activeCounter ? activeCounter.count >= activeCounter.target : false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="tasbih-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tasbih Counter</Text>
        <TouchableOpacity testID="tasbih-add-btn" onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Counter Selection */}
      <View style={styles.counterSelector}>
        <FlatList
          horizontal
          data={counters}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.counterList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`tasbih-select-${item.id}`}
              style={[
                styles.counterChip,
                {
                  backgroundColor: item.id === (activeCounter?.id) ? colors.primary : colors.surface,
                  borderColor: item.id === (activeCounter?.id) ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActive(item.id)}
            >
              <Text
                style={[styles.counterChipText, { color: item.id === (activeCounter?.id) ? '#fff' : colors.textPrimary }]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Main Counter Display */}
      <View style={styles.mainCounter}>
        <Text style={[styles.counterName, { color: colors.textSecondary }]}>{activeCounter?.name || 'Select a counter'}</Text>
        <Text style={[styles.targetText, { color: colors.textSecondary }]}>
          Target: {activeCounter?.target || 0}
        </Text>

        {/* Big Tap Area */}
        <TouchableOpacity
          testID="tasbih-counter-button"
          style={[
            styles.bigCounterBtn,
            {
              backgroundColor: isComplete ? colors.success : colors.primary,
              shadowColor: isComplete ? colors.success : colors.primary,
            },
          ]}
          onPress={handleIncrement}
          activeOpacity={0.8}
        >
          <Text style={styles.bigCounterNumber}>{activeCounter?.count || 0}</Text>
          <Text style={styles.bigCounterLabel}>{isComplete ? 'Complete!' : 'Tap to count'}</Text>
        </TouchableOpacity>

        {/* Progress */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: isComplete ? colors.success : colors.primary }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {activeCounter?.count || 0} / {activeCounter?.target || 0}
        </Text>

        {/* Reset Button */}
        <TouchableOpacity
          testID="tasbih-reset-btn"
          style={[styles.resetBtn, { borderColor: colors.border }]}
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Add Counter Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Counter</Text>
            <TextInput
              testID="tasbih-new-name-input"
              style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Name (e.g. SubhanAllah)"
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              testID="tasbih-new-target-input"
              style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="Target count"
              placeholderTextColor={colors.textSecondary}
              value={newTarget}
              onChangeText={setNewTarget}
              keyboardType="number-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                testID="tasbih-cancel-add"
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="tasbih-confirm-add"
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleAdd}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.bodyBold },
  addBtn: { padding: spacing.xs },
  counterSelector: { paddingVertical: spacing.md },
  counterList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  counterChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1 },
  counterChipText: { fontSize: 13, fontWeight: '600' },
  mainCounter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  counterName: { ...typography.h3, marginBottom: 4 },
  targetText: { ...typography.small, marginBottom: spacing.xxl },
  bigCounterBtn: { width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, marginBottom: spacing.xxl },
  bigCounterNumber: { color: '#fff', fontSize: 56, fontWeight: '700' },
  bigCounterLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  progressBar: { width: '80%', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { ...typography.small, marginBottom: spacing.xxl },
  resetBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full, borderWidth: 1, gap: spacing.sm },
  resetText: { ...typography.small, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  modalContent: { width: '100%', borderRadius: radius.xxl, padding: spacing.xxl },
  modalTitle: { ...typography.h3, marginBottom: spacing.lg, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.md, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.full, alignItems: 'center' },
  modalBtnText: { fontWeight: '700', fontSize: 14 },
});
