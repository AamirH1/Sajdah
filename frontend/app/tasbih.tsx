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
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTasbih } from '../src/store/useTasbih';
import { useTheme } from '../src/ui/hooks/useTheme';
import {
  ScreenContainer,
  ScreenHeader,
  IconButton,
  Card,
} from '../src/ui/components';

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function TasbihScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
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
  const progressPercent = Math.min(progress * 100, 100);
  const isComplete = activeCounter
    ? activeCounter.count >= activeCounter.target
    : false;
  const heroGradient = isDark
    ? ['#111C14', '#2A3420'] as const
    : [colors.primary, hexToRgba(colors.primary, 0.76)] as const;
  const screenGradient = isDark
    ? [colors.background, colors.surfaceAlt] as const
    : [colors.primarySoft, colors.background] as const;

  return (
    <ScreenContainer scrollable={false} heroGradient={screenGradient}>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[typography.label, { color: colors.screenTextSecondary, lineHeight: 22, marginBottom: spacing.lg }]}>
          Choose a dhikr, tap gently, and keep your count without distraction.
        </Text>

        <FlatList
          horizontal
          data={counters}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.counterList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const selected = item.id === activeCounter?.id;
            return (
              <TouchableOpacity
                testID={`tasbih-select-${item.id}`}
                style={[
                  styles.counterChip,
                  {
                    backgroundColor: selected ? colors.primarySoft : colors.surfaceAlt,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActive(item.id)}
              >
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={selected ? colors.primary : colors.textSecondary}
                />
                <Text style={[typography.label, { color: selected ? colors.primary : colors.textPrimary, fontWeight: '700' }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{isComplete ? 'Completed' : 'Counting'}</Text>
            </View>
            <Text style={styles.heroTarget}>Target {activeCounter?.target || 0}</Text>
          </View>

          <Text style={styles.heroTitle}>{activeCounter?.name || 'Select a counter'}</Text>
          <Text style={styles.heroSubtitle}>
            {isComplete ? 'Beautiful. You reached your target.' : 'Tap the circle each time you complete one count.'}
          </Text>

          <Animated.View style={[styles.counterWrap, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity
              testID="tasbih-counter-button"
              style={styles.bigCounterBtn}
              onPress={handleIncrement}
              activeOpacity={0.9}
            >
              <Text style={styles.bigCounterNumber}>{activeCounter?.count || 0}</Text>
              <Text style={styles.bigCounterLabel}>{isComplete ? 'Complete' : 'Tap'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        <Card style={[styles.progressCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.sm]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[typography.title, { color: colors.textPrimary }]}>Today’s progress</Text>
              <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 3 }]}>
                {activeCounter?.count || 0} of {activeCounter?.target || 0} counts
              </Text>
            </View>
            <View style={[styles.percentBadge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[typography.xs, { color: colors.primary, fontWeight: '800' }]}>
                {Math.round(progressPercent)}%
              </Text>
            </View>
          </View>

          <View style={[styles.progressBar, { backgroundColor: colors.chipBackground }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: isComplete ? colors.success : colors.primary,
                },
              ]}
            />
          </View>

          <TouchableOpacity
            testID="tasbih-reset-btn"
            style={[styles.resetBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
            <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset count</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Add Counter Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Counter</Text>
            <TextInput
              testID="tasbih-new-name-input"
              style={{
                ...styles.modalInput,
                color: colors.textPrimary,
                borderColor: colors.border,
                backgroundColor: colors.surface,
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
                backgroundColor: colors.surface,
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
                <Text style={[styles.modalBtnText, { color: colors.onPrimary }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  counterList: {
    gap: 8,
    paddingBottom: 16,
  },
  counterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    minHeight: 430,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroPillText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTarget: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 34,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  counterWrap: {
    alignItems: 'center',
    marginTop: 38,
  },
  bigCounterBtn: {
    width: 214,
    height: 214,
    borderRadius: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  bigCounterNumber: { color: '#FFFFFF', fontSize: 68, fontWeight: '900', letterSpacing: -1 },
  bigCounterLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 13, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.2 },
  progressCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  percentBadge: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  progressBar: {
    height: 9,
    borderRadius: 9999,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: { height: '100%', borderRadius: 9999 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 11,
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
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
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
