import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { spacing, typography, radius } from '../../src/ui/theme';
import { ScreenContainer, ScreenHeader } from '../../src/ui/components';
import { getDynamicScreenGradient, hexToRgba } from '../../src/ui/colorUtils';

import { useSettings } from '../../src/store/useSettings';
import { useEntitlements } from '../../src/store/useEntitlements';
import { getAsmaUlHusnaLanguageLabel } from '../../src/services/asmaUlHusnaApi';
import {
  requestNotificationPermission,
  schedulePrayerNotificationsFromSettings,
} from '../../src/services/notifications';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const settings = useSettings();
  const router = useRouter();
  const plan = useEntitlements((state) => state.plan);
  const togglePlan = useEntitlements((state) => state.togglePlan);
  const canUseHijri = plan === 'pro';
  
  const canUseMultiLang = plan === 'pro';
  const canUseSmartFajr = plan === 'pro';
  
  const [notificationStatus, setNotificationStatus] = useState<{ message: string, success: boolean } | null>(null);
  const [, setIsSyncingNotifications] = useState(false);

  const methods = ['Karachi', 'MuslimWorldLeague', 'Egyptian', 'UmmAlQura', 'Dubai', 'NorthAmerica'] as const;
  const madhhabOptions = ['Hanafi', 'Shafi'] as const;
  const themeOptions = ['light', 'dark', 'system'] as const;
  const standardLanguages = ['english', 'urdu'] as const;
  const proLanguages = ['hindi', 'bangla', 'tamil', 'malayalam', 'telugu', 'kannada'] as const;
  const comingSoonLanguages = new Set(['telugu', 'kannada']);
  const screenGradient = getDynamicScreenGradient(colors, isDark);
  const selectedChipColor = isDark ? colors.dateBadgeBg : colors.chipBackground;
  const selectedChipTextColor = isDark ? colors.primary : colors.textPrimary;
  const selectedChipIconColor = isDark ? colors.primary : colors.textSecondary;
  const selectedChipStyle = { backgroundColor: selectedChipColor, borderColor: colors.border };
  const dynamicIconTileStyle = {
    backgroundColor: isDark ? colors.dateBadgeBg : hexToRgba(colors.primary, 0.16),
    borderColor: isDark ? colors.cardBorder : colors.border,
  };

  const handleNotificationToggle = async (
    prayer: keyof typeof settings.notifications,
    enabled: boolean
  ) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setNotificationStatus({ message: 'Notification permission was not granted.', success: false });
        return;
      }
    }

    settings.setNotification(prayer, enabled);

    if (enabled) {
      setIsSyncingNotifications(true);
      try {
        await schedulePrayerNotificationsFromSettings(
          {
            latitude: settings.location.latitude,
            longitude: settings.location.longitude,
            calculationMethod: settings.calculationMethod,
            madhhab: settings.madhhab,
            offsets: settings.offsets,
            notifications: { ...settings.notifications, [prayer]: enabled },
          },
          { requestPermission: false }
        );
        setNotificationStatus({ message: 'Prayer reminders scheduled.', success: true });
      } catch (error) {
        console.warn('Unable to sync prayer notifications:', error);
        setNotificationStatus({ message: 'We could not set up reminders right now. Please try again later.', success: false });
      } finally {
        setIsSyncingNotifications(false);
      }
    }
  };

  const handleOpenHijri = () => {
    if (canUseHijri) {
      router.push('/hijri');
      return;
    }

    Alert.alert(
      'Hijri Calendar is Pro',
      'Upgrade to Pro to unlock the Hijri calendar and date conversion tools.',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Upgrade to Pro',
          onPress: () => {
            togglePlan();
            router.push('/hijri');
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable heroGradient={screenGradient}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title="Settings" />

        <View style={[styles.settingsHero, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, dynamicIconTileStyle]}>
            <Ionicons name="options-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Make Sajdah feel right for you</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Prayer, language, reminders, and privacy controls in one place.
            </Text>
          </View>
        </View>


        {/* Prayer Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>PRAYER</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Location</Text>
              <Link href="/location" asChild>
                <TouchableOpacity
                  testID="location-selector"
                  style={[styles.valueBtn, styles.locationValueBtn, { backgroundColor: colors.chipBackground }]}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons name="location" size={14} color={colors.textSecondary} />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[styles.settingValue, styles.locationCityText, { color: colors.textSecondary }]}
                    >
                      {settings.location.city}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Calculation Method</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{settings.calculationMethod}</Text>
            </View>

            <View style={styles.methodGrid}>
              {methods.map((m) => {
                const selected = settings.calculationMethod === m;
                return (
                  <TouchableOpacity
                    key={m}
                    testID={`method-${m}`}
                  style={[styles.choiceBtn, selected ? selectedChipStyle : { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => settings.setCalculationMethod(m)}
                >
                    <Text style={[styles.choiceText, { color: selected ? selectedChipTextColor : colors.textPrimary }]}>
                      {m.replace('MuslimWorldLeague', 'MWL').replace('NorthAmerica', 'ISNA')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Hijri Calendar</Text>
              <TouchableOpacity
                testID="hijri-calendar-button"
                style={[
                  styles.valueBtn,
                  styles.prayerActionBtn,
                  { backgroundColor: colors.chipBackground, opacity: canUseHijri ? 1 : 0.7 },
                ]}
                onPress={handleOpenHijri}
              >
                <View style={styles.locationValueContent}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.settingValue, styles.prayerActionText, { color: colors.textSecondary }]}>
                    {canUseHijri ? 'Open Calendar' : 'Pro Feature'}
                  </Text>
                  {!canUseHijri && (
                    <View style={styles.proBadgeInline}>
                      <Ionicons name="lock-closed" size={10} color={colors.primary} />
                      <Text style={[styles.proText, { color: colors.primary }]}>PRO</Text>
                    </View>
                  )}
                  <Ionicons name={canUseHijri ? 'chevron-forward' : 'star'} size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Madhhab (Asr)</Text>
            </View>
            <View style={styles.madhhabRow}>
              {madhhabOptions.map((m) => (
                <TouchableOpacity
                  key={m}
                  testID={`madhhab-${m}`}
                  style={[
                    styles.valueBtn,
                    styles.madhhabBtn,
                    settings.madhhab === m
                      ? selectedChipStyle
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => settings.setMadhhab(m)}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={settings.madhhab === m ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={settings.madhhab === m ? selectedChipIconColor : colors.textSecondary}
                    />
                    <Text style={[styles.choiceText, { color: settings.madhhab === m ? selectedChipTextColor : colors.textPrimary }]}>
                      {m}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>NOTIFICATIONS</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((prayer) => (
              <View key={prayer}>
                <View style={styles.switchRow}>
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                    {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                  </Text>
                  <Switch
                    testID={`notification-${prayer}`}
                    value={settings.notifications[prayer]}
                    onValueChange={(v) => handleNotificationToggle(prayer, v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              </View>
            ))}
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Smart Fajr Alarm</Text>
                {!canUseSmartFajr && (
                  <View style={styles.proBadgeInline}>
                    <Ionicons name="lock-closed" size={10} color={colors.primary} />
                    <Text style={[styles.proText, { color: colors.primary }]}>PRO</Text>
                  </View>
                )}
              </View>
              <Switch
                testID="notification-smart-fajr"
                value={settings.notifications.smartFajr}
                onValueChange={(v) => {
                  if (canUseSmartFajr) {
                    handleNotificationToggle('smartFajr', v);
                  }
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
                disabled={!canUseSmartFajr}
              />
            </View>
            {notificationStatus && (
              <Text style={{ ...typography.xs, color: notificationStatus.success ? '#10B981' : '#EF4444', marginTop: spacing.md, paddingHorizontal: 4 }}>
                {notificationStatus.message}
              </Text>
            )}
          </View>
        </View>

        {/* Translation Language */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>TRANSLATION LANGUAGE</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Preferred Language</Text>
                <Text style={[typography.xs, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                  Applies to Quran and 99 Names when that language is available. If not, Sajdah shows English.
                </Text>
              </View>
              <View style={[styles.activeLanguageBadge, { backgroundColor: selectedChipColor }]}>
                <Text style={[typography.xs, { color: selectedChipTextColor, fontWeight: '700' }]}>
                  {getAsmaUlHusnaLanguageLabel(settings.translationLang)}
                </Text>
              </View>
            </View>
            <View style={styles.quranChoiceGrid}>
              {standardLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  testID={`lang-${lang}`}
                  style={[
                    styles.valueBtn,
                    styles.quranChoiceBtn,
                    settings.translationLang === lang
                      ? selectedChipStyle
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => settings.setTranslationLang(lang)}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={settings.translationLang === lang ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={settings.translationLang === lang ? selectedChipIconColor : colors.textSecondary}
                    />
                    <Text style={[styles.choiceText, { color: settings.translationLang === lang ? selectedChipTextColor : colors.textPrimary }]}>
                      {getAsmaUlHusnaLanguageLabel(lang)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {proLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  testID={`lang-${lang}`}
                  style={[
                    styles.valueBtn,
                    styles.quranChoiceBtn,
                    settings.translationLang === lang
                      ? selectedChipStyle
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                    { opacity: canUseMultiLang ? 1 : 0.5 }
                  ]}
                  onPress={() => {
                    if (canUseMultiLang && comingSoonLanguages.has(lang)) {
                      Alert.alert(
                        'Coming Soon',
                        'Telugu and Kannada are coming soon. Please choose another language for now.',
                        [{ text: 'OK' }]
                      );
                      return;
                    }

                    if (canUseMultiLang) {
                      settings.setTranslationLang(lang);
                    }
                  }}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={settings.translationLang === lang ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={settings.translationLang === lang ? selectedChipIconColor : colors.textSecondary}
                    />
                    <Text style={[styles.choiceText, { color: settings.translationLang === lang ? selectedChipTextColor : colors.textPrimary }]}>
                      {getAsmaUlHusnaLanguageLabel(lang)}
                    </Text>
                    {!canUseMultiLang && <Ionicons name="lock-closed" size={10} color={settings.translationLang === lang ? selectedChipIconColor : colors.textSecondary} />}
                    {canUseMultiLang && comingSoonLanguages.has(lang) && (
                      <Text style={[styles.comingSoonText, { color: colors.textMuted }]}>Soon</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.translationNote, { backgroundColor: colors.chipBackground }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[typography.xs, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>
                Some 99 Names languages are still being prepared, so you may see English in those places.
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Quran Script</Text>
            </View>
            <View style={styles.quranChoiceGrid}>
              {(['IndoPak', 'Madani'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  testID={`script-${s}`}
                  style={[
                    styles.valueBtn,
                    styles.quranChoiceBtn,
                    settings.quranScript === s
                      ? selectedChipStyle
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => settings.setQuranScript(s)}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={settings.quranScript === s ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={settings.quranScript === s ? selectedChipIconColor : colors.textSecondary}
                    />
                    <Text style={[styles.choiceText, { color: settings.quranScript === s ? selectedChipTextColor : colors.textPrimary }]}>
                      {s}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Theme</Text>
            </View>
            <View style={styles.themeChoiceGrid}>
              {themeOptions.map((t) => (
                <TouchableOpacity
                  key={t}
                  testID={`theme-${t}`}
                  style={[
                    styles.valueBtn,
                    styles.themeChoiceBtn,
                    settings.theme === t
                      ? selectedChipStyle
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => settings.setTheme(t)}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={t === 'light' ? 'sunny' : t === 'dark' ? 'moon' : 'phone-portrait'}
                      size={14}
                      color={settings.theme === t ? selectedChipIconColor : colors.textSecondary}
                    />
                    <Text style={[styles.choiceText, { color: settings.theme === t ? selectedChipTextColor : colors.textPrimary }]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Account / Pro */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>ACCOUNT</Text>
          <View style={[styles.proCard, { backgroundColor: plan === 'pro' && !isDark ? colors.primary : colors.surfaceAlt, borderColor: plan === 'pro' ? colors.primary : colors.border }]}>
            <View style={styles.proCardContent}>
              <Ionicons name={plan === 'pro' ? 'star' : 'star-outline'} size={24} color={plan === 'pro' && !isDark ? colors.onPrimary : colors.primary} />
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={[styles.planTitle, { color: plan === 'pro' && !isDark ? colors.onPrimary : colors.textPrimary }]}>
                  {plan === 'pro' ? 'Pro Plan Active' : 'Free Plan'}
                </Text>
                <Text style={[styles.planDesc, { color: plan === 'pro' && !isDark ? 'rgba(255,255,255,0.78)' : colors.textMuted }]}>
                  {plan === 'pro' ? 'All features unlocked' : 'Upgrade for full access'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              testID="toggle-plan-btn"
              style={[styles.upgradeBtn, { backgroundColor: plan === 'pro' && !isDark ? 'rgba(255,255,255,0.2)' : colors.primary }]}
              onPress={togglePlan}
            >
              <Text style={[styles.upgradeBtnText, { color: colors.onPrimary }]}>
                {plan === 'pro' ? 'Switch to Free' : 'Upgrade to Pro'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Privacy & Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>PRIVACY & LEGAL</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Link href="/privacy" asChild>
              <TouchableOpacity style={styles.linkRow}>
                <View style={styles.settingLabelWithIcon}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </Link>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <Link href="/terms" asChild>
              <TouchableOpacity style={styles.linkRow}>
                <View style={styles.settingLabelWithIcon}>
                  <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Terms & Conditions</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </Link>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <Link href="/analytics" asChild>
              <TouchableOpacity style={styles.linkRow}>
                <View style={styles.settingLabelWithIcon}>
                  <Ionicons name="stats-chart-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Analytics Data (EU)</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Support & Feedback */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>SUPPORT & FEEDBACK</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => {}} style={styles.linkRow}>
              <View style={styles.settingLabelWithIcon}>
                <Ionicons name="star-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Rate the App</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity onPress={() => Linking.openURL('mailto:hello.aamirdev@gmail.com?subject=Sajdah%20Feedback')} style={styles.linkRow}>
              <View style={styles.settingLabelWithIcon}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Feedback</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity onPress={() => Linking.openURL('mailto:hello.aamirdev@gmail.com?subject=Sajdah%20Bug%20Report')} style={styles.linkRow}>
              <View style={styles.settingLabelWithIcon}>
                <Ionicons name="bug-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Report a Bug</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity onPress={() => Linking.openURL('mailto:hello.aamirdev@gmail.com')} style={styles.linkRow}>
              <View style={styles.settingLabelWithIcon}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Contact Us</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textLabel }]}>APP INFO</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelWithIcon}>
                <Ionicons name="sparkles-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>App Name</Text>
              </View>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Sajdah</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabelWithIcon}>
                <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Built By</Text>
              </View>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>Aamir Hussain</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              onPress={() => Linking.openURL('https://www.aamirdev.co.uk/about')}
              style={styles.linkRow}
            >
              <View style={styles.settingLabelWithIcon}>
                <Ionicons name="globe-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Website</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 96 },
  settingsHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 19, fontWeight: '800', lineHeight: 25 },
  heroSubtitle: { ...typography.xs, lineHeight: 18, marginTop: 4 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 },
  card: { borderRadius: 24, padding: 18, borderWidth: 1 },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  settingLabelWithIcon: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  settingLabel: { ...typography.body, fontWeight: '500' },
  settingValue: { ...typography.label },
  valueBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 16, gap: 4 },
  locationValueBtn: { flexShrink: 1, maxWidth: '72%', minHeight: 36, justifyContent: 'center' },
  locationValueContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 0 },
  locationCityText: { flexShrink: 1, includeFontPadding: false, textAlignVertical: 'center' },
  prayerActionBtn: { flexShrink: 1, maxWidth: '72%', minHeight: 36, justifyContent: 'center' },
  prayerActionText: { flexShrink: 1, includeFontPadding: false, textAlignVertical: 'center' },
  valueText: { ...typography.xs, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  divider: { height: 1, marginVertical: 10 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm, marginTop: spacing.sm },
  choiceBtn: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  choiceText: { fontSize: 12, fontWeight: '700' },
  madhhabRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  madhhabBtn: { flex: 1, minHeight: 42, justifyContent: 'center', borderWidth: 1 },
  quranChoiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  quranChoiceBtn: { minHeight: 42, justifyContent: 'center', borderWidth: 1, flexShrink: 1 },
  activeLanguageBadge: { borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  comingSoonText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  translationNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  themeChoiceGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  themeChoiceBtn: { flex: 1, minHeight: 42, justifyContent: 'center', borderWidth: 1 },
  proBadgeInline: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  proText: { fontSize: 10, fontWeight: '700' },
  proCard: { borderRadius: 24, padding: 18, borderWidth: 1 },
  proCardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  planTitle: { ...typography.body, fontWeight: '700' },
  planDesc: { ...typography.label, marginTop: 2 },
  upgradeBtn: { borderRadius: 18, paddingVertical: spacing.md, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  iconTile: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
