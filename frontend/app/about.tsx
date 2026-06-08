import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { Button, Card, IconButton, ScreenContainer } from '../src/ui/components';
import { getDynamicScreenGradient } from '../src/ui/colorUtils';

const FEATURE_GROUPS = [
  {
    icon: 'book-outline',
    title: 'Read the Quran',
    description: 'Open any Surah and follow the Arabic text with translations in a clean reader view.',
  },
  {
    icon: 'volume-high-outline',
    title: 'Listen to reciters',
    description: 'Play Quran audio using reciters and fallback sources when needed.',
  },
  {
    icon: 'library-outline',
    title: 'Browse hadith',
    description: 'Read collections, open individual hadith, and search by topic or wording.',
  },
  {
    icon: 'search-outline',
    title: 'Search duas',
    description: 'Find duas quickly without scrolling through long lists.',
  },
  {
    icon: 'compass-outline',
    title: 'Find the Qibla',
    description: 'Use your location to point toward the Kaaba.',
  },
  {
    icon: 'time-outline',
    title: 'See prayer times',
    description: 'View daily prayer times and monthly prayer schedules for your area.',
  },
  {
    icon: 'calendar-outline',
    title: 'Check Hijri dates',
    description: 'See today’s Hijri date and convert Gregorian dates into the Islamic calendar.',
  },
  {
    icon: 'cash-outline',
    title: 'Check Zakat',
    description: 'View live Nisab values and estimate whether your wealth is above the threshold.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Learn the 99 Names',
    description: 'Read Allah’s Names with Arabic, transliteration, and simple meanings.',
  },
  {
    icon: 'sunny-outline',
    title: 'Open Azkar',
    description: 'Use morning and evening remembrance cards for daily dhikr.',
  },
  {
    icon: 'radio-button-on-outline',
    title: 'Count Tasbih',
    description: 'Keep track of your dhikr with a simple tasbih counter.',
  },
  {
    icon: 'calendar-number-outline',
    title: 'See Islamic events',
    description: 'Stay aware of important Islamic dates and reminders.',
  },
  {
    icon: 'settings-outline',
    title: 'Personalize the app',
    description: 'Choose language, theme, location, script style, and notification preferences.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Use privacy and legal pages',
    description: 'Review the app’s privacy policy, terms, and analytics options from Settings.',
  },
];

export default function AboutScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
  const router = useRouter();

  return (
    <ScreenContainer scrollable={false} heroGradient={getDynamicScreenGradient(colors, isDark)}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={[typography.xs, { color: colors.textLabel, letterSpacing: 1.5 }]}>ABOUT</Text>
          <Text style={[typography.title, { color: colors.screenTextPrimary, marginTop: 2 }]}>Sajdah</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={[styles.heroCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.md]}>
          <View style={styles.heroIcon}>
            <Ionicons name="information-circle-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[typography.headline, { color: colors.textPrimary, marginTop: spacing.md }]}>
            A simple Islamic app for everyday use.
          </Text>
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
            Sajdah helps you read, learn, and track everyday Islamic needs in one place.
          </Text>
        </Card>

        <Card style={[styles.infoCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>What you can do</Text>
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: 4, lineHeight: 20 }]}>
            Everything in the app is meant to help with daily worship, learning, and planning.
          </Text>

          <View style={styles.featureList}>
            {FEATURE_GROUPS.map((item) => (
              <View key={item.title} style={[styles.featureRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.label, { color: colors.textPrimary, fontWeight: '700' }]}>{item.title}</Text>
                  <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card style={[styles.infoCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>Made to be easy</Text>
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
            The app uses a clean layout, large readable text, and simple screens so anyone can find what they need quickly.
          </Text>
        </Card>

        <Button
          label="Back to Home"
          onPress={() => router.back()}
          icon={<Ionicons name="home-outline" size={18} color={colors.onPrimary} />}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCenter: {
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  heroCard: {
    borderRadius: 28,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },
  infoCard: {
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    padding: 16,
  },
  featureList: {
    marginTop: 16,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
