import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/ui/hooks/useTheme';

interface OnboardingStep {
  eyebrow: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accent: string;
  gradient: readonly [string, string];
  highlights: string[];
}

const STEPS: OnboardingStep[] = [
  {
    eyebrow: 'Prayer Companion',
    icon: 'time-outline',
    title: 'Prayer times that feel personal',
    description:
      'See today’s salah times, monthly prayer schedules, location-aware calculations, and a calm countdown to the next prayer.',
    accent: '#D97706',
    gradient: ['#F59E0B', '#EA580C'],
    highlights: ['Daily timings', 'Monthly view', 'Smart reminders'],
  },
  {
    eyebrow: 'Quran & Hadith',
    icon: 'book-outline',
    title: 'Read, search, and return with ease',
    description:
      'Move between Quran, Hadith books, one-by-one reading, full browsing, and fast search when you remember a word or narrator.',
    accent: '#0F766E',
    gradient: ['#14B8A6', '#047857'],
    highlights: ['Quran reader', 'Hadith search', 'Book browsing'],
  },
  {
    eyebrow: 'Dua & Dhikr',
    icon: 'sparkles-outline',
    title: 'Daily remembrance in one place',
    description:
      'Keep morning and evening azkar, tasbih counters, dua search, and the 99 beautiful names of Allah close throughout your day.',
    accent: '#B45309',
    gradient: ['#D4A017', '#92400E'],
    highlights: ['Azkar', 'Tasbih', '99 Names', 'Search duas'],
  },
  {
    eyebrow: 'Islamic Calendar',
    icon: 'calendar-number-outline',
    title: 'Stay connected to Hijri dates',
    description:
      'Check today’s Hijri date, convert Gregorian dates, and see important Islamic events with clear notes about moon sighting differences.',
    accent: '#2563EB',
    gradient: ['#38BDF8', '#2563EB'],
    highlights: ['Hijri date', 'Date converter', 'Islamic events'],
  },
  {
    eyebrow: 'Direction & Privacy',
    icon: 'compass-outline',
    title: 'Helpful tools without noise',
    description:
      'Find the Qibla direction, choose your calculation method and madhhab, and keep your data private with settings that stay on your device.',
    accent: '#7C3AED',
    gradient: ['#8B5CF6', '#4F46E5'],
    highlights: ['Qibla', 'Private by design', 'Custom settings'],
  },
];

const ONBOARDING_KEY = 'onboarding_complete_v2' //'onboarding_complete';

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

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const supportingSteps = useMemo(
    () => STEPS.filter((_, index) => index !== currentStep).slice(0, 3),
    [currentStep]
  );

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    handleFinish();
  };

  const handleFinish = async () => {
    await markOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground || colors.background }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.brandLabel, { color: colors.screenTextSecondary }]}>SAJDAH</Text>
          <Text style={[styles.brandTitle, { color: colors.screenTextPrimary }]}>A quieter way to stay connected</Text>
        </View>

        {!isLastStep ? (
          <TouchableOpacity
            testID="onboarding-skip-btn"
            onPress={handleFinish}
            style={[styles.skipBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={step.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderRadius: 32 }]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{step.eyebrow}</Text>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{currentStep + 1}/{STEPS.length}</Text>
            </View>
          </View>

          <View style={styles.heroIconRing}>
            <View style={styles.heroIconCore}>
              <Ionicons name={step.icon} size={42} color="#FFFFFF" />
            </View>
          </View>

          <Text testID="onboarding-title" style={styles.heroTitle}>
            {step.title}
          </Text>
          <Text style={styles.heroDescription}>{step.description}</Text>
        </LinearGradient>

        <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textLabel }]}>What you can do</Text>
          <View style={styles.highlightGrid}>
            {step.highlights.map((item) => (
              <View
                key={item}
                style={[
                  styles.highlightChip,
                  {
                    backgroundColor: hexToRgba(step.accent, isDark ? 0.18 : 0.12),
                    borderColor: hexToRgba(step.accent, 0.24),
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={15} color={step.accent} />
                <Text style={[styles.highlightText, { color: colors.textPrimary }]}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.previewPanel, { backgroundColor: colors.chipBackground }]}>
            <View style={[styles.previewIcon, { backgroundColor: hexToRgba(step.accent, 0.16) }]}>
              <Ionicons name={step.icon} size={20} color={step.accent} />
            </View>
            <View style={styles.previewCopy}>
              <Text style={[typography.body, styles.previewTitle, { color: colors.textPrimary }]}>Built for daily rhythm</Text>
              <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>
                Open Sajdah for quick guidance, then return to your day without friction.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.miniCardsRow}>
          {supportingSteps.map((item) => (
            <View
              key={item.title}
              style={[
                styles.miniCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.miniIcon, { backgroundColor: hexToRgba(item.accent, isDark ? 0.18 : 0.12) }]}>
                <Ionicons name={item.icon} size={16} color={item.accent} />
              </View>
              <Text numberOfLines={2} style={[styles.miniTitle, { color: colors.textPrimary }]}>
                {item.eyebrow}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.screenBackground || colors.background }]}>
        <View style={styles.progressRow}>
          {STEPS.map((item, index) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => setCurrentStep(index)}
              activeOpacity={0.8}
              style={[
                styles.progressDot,
                {
                  width: index === currentStep ? 34 : 9,
                  backgroundColor: index === currentStep ? step.accent : colors.border,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          testID="onboarding-next-btn"
          style={[styles.nextBtn, { backgroundColor: step.accent, borderRadius: radius.full }]}
          onPress={handleNext}
          activeOpacity={0.86}
        >
          <Text style={styles.nextBtnText}>{isLastStep ? 'Start using Sajdah' : 'Continue'}</Text>
          <Ionicons name={isLastStep ? 'checkmark' : 'arrow-forward'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 16,
  },
  brandLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 4,
    maxWidth: 240,
  },
  skipBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroCard: {
    minHeight: 360,
    padding: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroPillText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  stepBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  heroIconRing: {
    width: 118,
    height: 118,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 44,
  },
  heroIconCore: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
    letterSpacing: -0.8,
    marginTop: 28,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  detailsCard: {
    marginTop: 18,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  highlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 14,
    marginTop: 18,
    gap: 12,
  },
  previewIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: {
    flex: 1,
  },
  previewTitle: {
    fontWeight: '800',
  },
  previewSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  miniCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  miniIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTitle: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 10,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 18,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  progressDot: {
    height: 9,
    borderRadius: 999,
  },
  nextBtn: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
