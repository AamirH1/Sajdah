import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useTasbih } from '../src/store/useTasbih';
import { useTheme } from '../src/ui/hooks/useTheme';
import {
  ScreenContainer,
  ScreenHeader,
  IconButton,
} from '../src/ui/components';

export default function TasbihScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
  const { counters, activeCounterId, increment, reset, setActive, addCounter } = useTasbih();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('33');

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const activeCounter = counters.find((c) => c.id === activeCounterId) || counters[0];

  const handleIncrement = () => {
    if (!activeCounter) return;

    scaleAnim.setValue(0.9);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    increment(activeCounter.id);
  };

  const handleReset = () => {
    if (!activeCounter) return;
    Alert.alert('Reset Counter', `Reset "${activeCounter.name}" to 0?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: () => reset(activeCounter.id),
        style: 'destructive',
      },
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
  const isComplete = activeCounter
    ? activeCounter.count >= activeCounter.target
    : false;

  return (
    <ScreenContainer scrollable={false}>
      <ScreenHeader
        title="Tasbih"
        rightAction={
          <IconButton
            icon="add-circle"
            color={colors.primary}
            size={28}
            onPress={() => setShowAddModal(true)}
          />
        }
      />

      {/* Counter Selection */}
      <View style={{ paddingVertical: spacing.md }}>
        <FlatList
          horizontal
          data={counters}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`tasbih-select-${item.id}`}
              style={{
                backgroundColor:
                  item.id === activeCounter?.id
                    ? colors.primary
                    : colors.surfaceAlt,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor:
                  item.id === activeCounter?.id
                    ? colors.primary
                    : colors.border,
              }}
              onPress={() => setActive(item.id)}
            >
              <Text
                style={[
                  typography.label,
                  {
                    color:
                      item.id === activeCounter?.id
                        ? colors.onPrimary
                        : colors.textPrimary,
                  },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Main Counter Display */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xxl,
        }}
      >
        <Text
          style={[
            typography.headline,
            { color: colors.textPrimary, marginBottom: 4 },
          ]}
        >
          {activeCounter?.name || 'Select a counter'}
        </Text>
        <Text
          style={[
            typography.label,
            { color: colors.textSecondary, marginBottom: spacing.xxl },
          ]}
        >
          Target: {activeCounter?.target || 0}
        </Text>

        {/* Big Tap Area */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            testID="tasbih-counter-button"
            style={{
              ...styles.bigCounterBtn,
              backgroundColor: isComplete ? colors.success : colors.primary,
              shadowColor: isComplete ? colors.success : colors.primary,
            }}
            onPress={handleIncrement}
            activeOpacity={0.9}
          >
            <Text style={styles.bigCounterNumber}>{activeCounter?.count || 0}</Text>
            <Text style={styles.bigCounterLabel}>
              {isComplete ? 'Complete!' : 'Tap to count'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Progress */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={{
              ...styles.progressFill,
              width: `${Math.min(progress * 100, 100)}%`,
              backgroundColor: isComplete ? colors.success : colors.primary,
            }}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {activeCounter?.count || 0} / {activeCounter?.target || 0}
        </Text>

        {/* Reset Button */}
        <TouchableOpacity
          testID="tasbih-reset-btn"
          style={{
            ...styles.resetBtn,
            borderColor: colors.border,
          }}
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
              style={{
                ...styles.modalInput,
                color: colors.textPrimary,
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
              placeholder="Name (e.g. SubhanAllah)"
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              testID="tasbih-new-target-input"
              style={{
                ...styles.modalInput,
                color: colors.textPrimary,
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
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
                <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>
                  Cancel
                </Text>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bigCounterBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    marginBottom: 48,
  },
  bigCounterNumber: { color: '#fff', fontSize: 56, fontWeight: '700' },
  bigCounterLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  progressBar: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 48,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 8,
  },
  resetText: { fontSize: 14, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 16, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 16, borderRadius: 9999, alignItems: 'center' },
  modalBtnText: { fontWeight: '700', fontSize: 14 },
});
