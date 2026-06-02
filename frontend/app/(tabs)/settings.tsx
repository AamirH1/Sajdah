import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { spacing, typography, radius } from '../../src/ui/theme';
import { ScreenContainer, ScreenHeader } from '../../src/ui/components';

import { useSettings } from '../../src/store/useSettings';
import { useEntitlements } from '../../src/store/useEntitlements';
import { getDeviceId, syncBackup } from '../../src/services/api';
import { requestNotificationPermission, schedulePrayerNotificationsFromSettings } from '../../src/services/notifications';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const settings = useSettings();
  const router = useRouter();
  const plan = useEntitlements((state) => state.plan);
  const togglePlan = useEntitlements((state) => state.togglePlan);
  const canUseHijri = plan === 'pro';
  
  const canUseMultiLang = plan === 'pro';
  const canUseSmartFajr = plan === 'pro';
  
  const [backendStatus, setBackendStatus] = useState<{ message: string, success: boolean } | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<{ message: string, success: boolean } | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isSyncingNotifications, setIsSyncingNotifications] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const methods = ['Karachi', 'MuslimWorldLeague', 'Egyptian', 'UmmAlQura', 'Dubai', 'NorthAmerica'] as const;
  const madhhabOptions = ['Hanafi', 'Shafi'] as const;
  const themeOptions = ['light', 'dark', 'system'] as const;
  const languages = ['english', 'urdu'] as const;
  const proLanguages = ['hindi', 'bangla', 'tamil', 'malayalam', 'telugu', 'kannada'] as const;
  const comingSoonLanguages = new Set(['telugu', 'kannada']);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    let active = true;

    const syncNotifications = async () => {
      setIsSyncingNotifications(true);
      try {
        const granted = await requestNotificationPermission();
        if (!granted) {
          if (active) {
            setNotificationStatus({ message: 'Enable notifications to receive prayer reminders.', success: false });
          }
          return;
        }

        await schedulePrayerNotificationsFromSettings({
          latitude: settings.location.latitude,
          longitude: settings.location.longitude,
          calculationMethod: settings.calculationMethod,
          madhhab: settings.madhhab,
          offsets: settings.offsets,
          notifications: settings.notifications,
        });
      } catch (error) {
        console.warn('Unable to sync prayer notifications:', error);
        if (active) {
          setNotificationStatus({ message: 'Notification sync failed.', success: false });
        }
      } finally {
        if (active) {
          setIsSyncingNotifications(false);
        }
      }
    };

    syncNotifications();

    return () => {
      active = false;
    };
  }, [
    settings.location.latitude,
    settings.location.longitude,
    settings.calculationMethod,
    settings.madhhab,
    settings.offsets,
    settings.notifications,
  ]);

  const handlePingBackend = async () => {
    setIsPinging(true);
    setBackendStatus(null);
    try {
      const res = await syncBackup();
      setBackendStatus({ message: `Synced! Backup ID: ${res.id.substring(0, 8)}`, success: true });
    } catch {
      setBackendStatus({ message: 'Sync failed. Is backend running?', success: false });
    } finally {
      setIsPinging(false);
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
    <ScreenContainer scrollable>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title="Settings" />

        <Text style={styles.sectionSpacer} />


        {/* Prayer Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRAYER</Text>
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

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
                    style={[
                      styles.methodChip,
                      selected
                        ? { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }
                        : { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => settings.setCalculationMethod(m)}
                  >
                    <Text style={[styles.methodChipText, { color: selected ? colors.primary : colors.textPrimary }]}>
                      {m.replace('MuslimWorldLeague', 'MWL').replace('NorthAmerica', 'ISNA')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

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

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
                      ? { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => settings.setMadhhab(m)}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={settings.madhhab === m ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={settings.madhhab === m ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.madhhabBtnText, { color: settings.madhhab === m ? colors.primary : colors.textPrimary }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
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
                    onValueChange={(v) => settings.setNotification(prayer, v)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.surface}
                  />
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
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
                    settings.setNotification('smartFajr', v);
                  }
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
                disabled={!canUseSmartFajr}
              />
            </View>
          </View>
        </View>
        {notificationStatus && (
          <Text style={{ ...typography.xs, color: notificationStatus.success ? '#10B981' : '#EF4444', marginTop: spacing.sm, paddingHorizontal: 4 }}>
            {notificationStatus.message}
          </Text>
        )}

        {/* Quran */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QURAN</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Translation</Text>
            </View>
            <View style={styles.quranChoiceGrid}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  testID={`lang-${lang}`}
                  style={[
                    styles.valueBtn,
                    styles.quranChoiceBtn,
                    settings.translationLang === lang
                      ? { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => settings.setTranslationLang(lang)}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={settings.translationLang === lang ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={settings.translationLang === lang ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.quranChoiceText, { color: settings.translationLang === lang ? colors.primary : colors.textPrimary }]}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
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
                      ? { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                    { opacity: canUseMultiLang ? 1 : 0.5 }
                  ]}
                  onPress={() => {
                    if (canUseMultiLang && comingSoonLanguages.has(lang)) {
                      Alert.alert(
                        'Coming Soon',
                        'Translation is not available yet for Telugu and Kannada. We are working on it.',
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
                      color={settings.translationLang === lang ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.quranChoiceText, { color: settings.translationLang === lang ? colors.primary : colors.textPrimary }]}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </Text>
                    {!canUseMultiLang && <Ionicons name="lock-closed" size={10} color={settings.translationLang === lang ? colors.primary : colors.textSecondary} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Script</Text>
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
                      ? { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => settings.setQuranScript(s)}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={settings.quranScript === s ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={settings.quranScript === s ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.quranChoiceText, { color: settings.quranScript === s ? colors.primary : colors.textPrimary }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
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
                      ? { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }
                      : { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => settings.setTheme(t)}
                >
                  <View style={styles.locationValueContent}>
                    <Ionicons
                      name={t === 'light' ? 'sunny' : t === 'dark' ? 'moon' : 'phone-portrait'}
                      size={14}
                      color={settings.theme === t ? colors.primary : colors.textSecondary}
                    />
                    <Text style={[styles.themeChoiceText, { color: settings.theme === t ? colors.primary : colors.textPrimary }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
          <View style={[styles.proCard, { backgroundColor: plan === 'pro' ? colors.primary : colors.surfaceAlt, borderColor: plan === 'pro' ? colors.primary : colors.border }]}>
            <View style={styles.proCardContent}>
              <Ionicons name={plan === 'pro' ? 'star' : 'star-outline'} size={24} color={plan === 'pro' ? colors.onPrimary : colors.primary} />
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={[styles.planTitle, { color: plan === 'pro' ? colors.onPrimary : colors.textPrimary }]}>
                  {plan === 'pro' ? 'Pro Plan Active' : 'Free Plan'}
                </Text>
                <Text style={[styles.planDesc, { color: plan === 'pro' ? 'rgba(255,255,255,0.78)' : colors.textMuted }]}>
                  {plan === 'pro' ? 'All features unlocked' : 'Upgrade for full access'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              testID="toggle-plan-btn"
              style={[styles.upgradeBtn, { backgroundColor: plan === 'pro' ? 'rgba(255,255,255,0.2)' : colors.primary }]}
              onPress={togglePlan}
            >
              <Text style={[styles.upgradeBtnText, { color: plan === 'pro' ? colors.onPrimary : '#fff' }]}>
                {plan === 'pro' ? 'Switch to Free' : 'Upgrade to Pro'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hybrid Cloud Sync Card */}
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginTop: spacing.md }]}>
             <View style={styles.settingRow}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                 <Ionicons name="cloud-done" size={24} color={colors.primary} />
                 <View>
                   <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Cloud Backup & Sync</Text>
                   <Text style={[styles.settingValue, { color: colors.textSecondary }]}>ID: {deviceId ? `${deviceId.substring(0, 8)}...` : 'Loading...'}</Text>
                 </View>
               </View>
             </View>
             <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity 
              style={{ alignItems: 'center', paddingVertical: spacing.xs }}
              onPress={() => Alert.alert('Coming Soon', 'Email linking for cross-device sync will be available in a future update!')}
            >
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Link Email to Sync Devices</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Privacy & Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIVACY & LEGAL</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Link href="/privacy" asChild>
              <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </Link>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Link href="/terms" asChild>
              <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Terms & Conditions</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </Link>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Link href="/analytics" asChild>
              <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
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
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT & FEEDBACK</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => {}} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Ionicons name="star-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Rate the App</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity onPress={() => Linking.openURL('mailto:hello.aamirdev@gmail.com?subject=Sajdah%20Feedback')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Feedback</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity onPress={() => Linking.openURL('mailto:hello.aamirdev@gmail.com?subject=Sajdah%20Bug%20Report')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Ionicons name="bug-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Report a Bug</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity onPress={() => Linking.openURL('mailto:hello.aamirdev@gmail.com')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Contact Us</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer / Backend */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DEVELOPER</Text>
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Backend Sync</Text>
              <TouchableOpacity
                testID="ping-backend-btn"
                style={[styles.valueBtn, { backgroundColor: isPinging ? colors.border : colors.primary }]}
                onPress={handlePingBackend}
                disabled={isPinging}
              >
                {isPinging ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="cloud-upload-outline" size={14} color="#fff" />}
                <Text style={[styles.valueText, { color: '#fff', marginLeft: 4 }]}>Sync Now</Text>
              </TouchableOpacity>
            </View>
            {backendStatus && (
              <Text style={{ ...typography.xs, color: backendStatus.success ? '#10B981' : '#EF4444', marginTop: spacing.sm }}>
                {backendStatus.message}
              </Text>
            )}
            {isSyncingNotifications && (
              <Text style={{ ...typography.xs, color: colors.textSecondary, marginTop: spacing.xs }}>
                Updating prayer reminders...
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 96 },
  sectionSpacer: { height: 8 },

  title: { fontSize: 28, fontWeight: '700', marginBottom: 24 },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, paddingLeft: 4 },
  card: { borderRadius: 20, padding: 16, borderWidth: 1 },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  settingLabel: { ...typography.body, fontWeight: '500' },
  settingValue: { ...typography.label },
  valueBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, gap: 4 },
  locationValueBtn: { flexShrink: 1, maxWidth: '72%', minHeight: 36, justifyContent: 'center' },
  locationValueContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 0 },
  locationCityText: { flexShrink: 1, includeFontPadding: false, textAlignVertical: 'center' },
  prayerActionBtn: { flexShrink: 1, maxWidth: '72%', minHeight: 36, justifyContent: 'center' },
  prayerActionText: { flexShrink: 1, includeFontPadding: false, textAlignVertical: 'center' },
  valueText: { ...typography.xs, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { height: 1, marginVertical: spacing.sm },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm, marginTop: spacing.xs },
  methodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  methodChipText: { fontSize: 12, fontWeight: '600' },
  madhhabRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  madhhabBtn: { flex: 1, minHeight: 40, justifyContent: 'center', borderWidth: 1 },
  madhhabBtnText: { fontSize: 12, fontWeight: '600' },
  quranChoiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  quranChoiceBtn: { minHeight: 40, justifyContent: 'center', borderWidth: 1, flexShrink: 1 },
  quranChoiceText: { fontSize: 12, fontWeight: '600' },
  themeChoiceGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  themeChoiceBtn: { flex: 1, minHeight: 42, justifyContent: 'center', borderWidth: 1 },
  themeChoiceText: { fontSize: 12, fontWeight: '600' },
  proBadgeInline: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  proText: { fontSize: 10, fontWeight: '700' },
  proCard: { borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1 },
  proCardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  planTitle: { ...typography.body, fontWeight: '700' },
  planDesc: { ...typography.label, marginTop: 2 },
  upgradeBtn: { borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
