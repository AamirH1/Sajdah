import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing, radius, typography, colors } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: 'time-outline',
    title: 'Accurate Prayer Times',
    description: 'Get precise prayer times for your location with support for multiple calculation methods used across the Indian subcontinent.',
    color: '#059669',
  },
  {
    icon: 'book-outline',
    title: 'Read the Quran',
    description: 'Beautiful Arabic text with translations in English, Urdu, and more. Bookmark your progress and continue where you left off.',
    color: '#6366F1',
  },
  {
    icon: 'heart-outline',
    title: 'Daily Azkar & Tasbih',
    description: 'Comprehensive collection of morning, evening, and after-salah adhkar with a digital tasbih counter to track your dhikr.',
    color: '#F59E0B',
  },
  {
    icon: 'notifications-outline',
    title: 'Never Miss a Prayer',
    description: 'Get timely notifications before each prayer. Enable Smart Fajr alarm for a gentle wake-up reminder.',
    color: '#EF4444',
  },
];

const ONBOARDING_KEY = 'onboarding_complete';

export async function checkOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const themeColors = colors.light;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    await markOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Skip button */}
      <View style={styles.topBar}>
        <View />
        {currentStep < STEPS.length - 1 && (
          <TouchableOpacity testID="onboarding-skip-btn" onPress={handleSkip}>
            <Text style={[styles.skipText, { color: themeColors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content} key={currentStep}>
        <View style={[styles.iconCircle, { backgroundColor: STEPS[currentStep].color + '15' }]}>
          <Ionicons name={STEPS[currentStep].icon} size={64} color={STEPS[currentStep].color} />
        </View>
        <Text testID="onboarding-title" style={[styles.title, { color: themeColors.textPrimary }]}>
          {STEPS[currentStep].title}
        </Text>
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>
          {STEPS[currentStep].description}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentStep ? STEPS[currentStep].color : themeColors.border,
                width: i === currentStep ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          testID="onboarding-next-btn"
          style={[styles.nextBtn, { backgroundColor: STEPS[currentStep].color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name={currentStep === STEPS.length - 1 ? 'checkmark' : 'arrow-forward'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  skipText: { fontSize: 16, fontWeight: '500' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl },
  iconCircle: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxxl },
  title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.lg },
  description: { ...typography.body, textAlign: 'center', lineHeight: 26, paddingHorizontal: spacing.lg },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xxxl },
  dot: { height: 8, borderRadius: 4 },
  bottomSection: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxxl },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, borderRadius: radius.full, gap: spacing.sm },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
