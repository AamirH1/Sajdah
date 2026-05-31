import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { spacing, typography, radius } from '../../src/ui/theme';
import { ScreenContainer, ScreenHeader } from '../../src/ui/components';

import { useSettings } from '../../src/store/useSettings';
import { useEntitlements, useCanUse } from '../../src/store/useEntitlements';
import { pingBackend, getDeviceId } from '../../src/services/api';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const settings = useSettings();
  const plan = useEntitlements((state) => state.plan);
  const togglePlan = useEntitlements((state) => state.togglePlan);
  const canUseMultiLang = useCanUse('quran.multipleLanguages');
  const canUseSmartFajr = useCanUse('prayer.smartFajrAlarm');
  
  const [backendStatus, setBackendStatus] = useState<{ message: string, success: boolean } | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const methods = ['Karachi', 'MuslimWorldLeague', 'Egyptian', 'UmmAlQura', 'Dubai', 'NorthAmerica'] as const;
  const madhhabOptions = ['Hanafi', 'Shafi'] as const;
  const themeOptions = ['light', 'dark', 'system'] as const;
  const languages = ['english', 'urdu'] as const;
  const proLanguages = ['hindi', 'bangla', 'tamil'] as const;

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const handlePingBackend = async () => {
    setIsPinging(true);
    setBackendStatus(null);
    try {
      const res = await pingBackend();
      setBackendStatus({ message: `Connected! Ping ID: ${res.id.substring(0, 8)}`, success: true });
    } catch (e) {
      setBackendStatus({ message: 'Connection Failed. Is backend running?', success: false });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScreenHeader title="Settings" />

        <Text style={styles.sectionSpacer} />


        {/* Prayer Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRAYER</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Location</Text>
              <Link href="/location" asChild>
                <TouchableOpacity testID="location-selector" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, maxWidth: '70%' }}>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.settingValue, { color: colors.textSecondary, flexShrink: 1 }]}>{settings.location.city}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </Link>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Calculation Method</Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{settings.calculationMethod}</Text>
            </View>
            <View style={styles.optionsRow}>
              {methods.map((m) => (
                <TouchableOpacity
                  key={m}
                  testID={`method-${m}`}
                  style={[styles.chip, settings.calculationMethod === m ? { backgroundColor: colors.primary } : { backgroundColor: colors.accentLight }]}
                  onPress={() => settings.setCalculationMethod(m)}
                >
                  <Text style={[styles.chipText, { color: settings.calculationMethod === m ? '#fff' : colors.primary }]}>
                    {m.replace('MuslimWorldLeague', 'MWL').replace('NorthAmerica', 'ISNA')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Madhhab (Asr)</Text>
            </View>
            <View style={styles.optionsRow}>
              {madhhabOptions.map((m) => (
                <TouchableOpacity
                  key={m}
                  testID={`madhhab-${m}`}
                  style={[styles.chip, settings.madhhab === m ? { backgroundColor: colors.primary } : { backgroundColor: colors.accentLight }]}
                  onPress={() => settings.setMadhhab(m)}
                >
                  <Text style={[styles.chipText, { color: settings.madhhab === m ? '#fff' : colors.primary }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                    thumbColor="#fff"
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
                thumbColor="#fff"
                disabled={!canUseSmartFajr}
              />
            </View>
          </View>
        </View>

        {/* Quran */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QURAN</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Translation</Text>
            </View>
            <View style={styles.optionsRow}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  testID={`lang-${lang}`}
                  style={[styles.chip, settings.translationLang === lang ? { backgroundColor: colors.primary } : { backgroundColor: colors.accentLight }]}
                  onPress={() => settings.setTranslationLang(lang)}
                >
                  <Text style={[styles.chipText, { color: settings.translationLang === lang ? '#fff' : colors.primary }]}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              {proLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  testID={`lang-${lang}`}
                  style={[styles.chip, { backgroundColor: colors.accentLight, opacity: canUseMultiLang ? 1 : 0.5 }]}
                  onPress={() => {
                    if (canUseMultiLang) {
                      settings.setTranslationLang(lang);
                    }
                  }}
                >
                  <Text style={[styles.chipText, { color: colors.primary }]}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </Text>
                  {!canUseMultiLang && <Ionicons name="lock-closed" size={10} color={colors.primary} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Script</Text>
            </View>
            <View style={styles.optionsRow}>
              {(['IndoPak', 'Madani'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  testID={`script-${s}`}
                  style={[styles.chip, settings.quranScript === s ? { backgroundColor: colors.primary } : { backgroundColor: colors.accentLight }]}
                  onPress={() => settings.setQuranScript(s)}
                >
                  <Text style={[styles.chipText, { color: settings.quranScript === s ? '#fff' : colors.primary }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Theme</Text>
            </View>
            <View style={styles.optionsRow}>
              {themeOptions.map((t) => (
                <TouchableOpacity
                  key={t}
                  testID={`theme-${t}`}
                  style={[styles.chip, settings.theme === t ? { backgroundColor: colors.primary } : { backgroundColor: colors.accentLight }]}
                  onPress={() => settings.setTheme(t)}
                >
                  <Ionicons
                    name={t === 'light' ? 'sunny' : t === 'dark' ? 'moon' : 'phone-portrait'}
                    size={14}
                    color={settings.theme === t ? '#fff' : colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.chipText, { color: settings.theme === t ? '#fff' : colors.primary }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Account / Pro */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
          <View style={[styles.proCard, { backgroundColor: plan === 'pro' ? colors.primary : colors.surface, borderColor: plan === 'pro' ? colors.primary : colors.border }]}>
            <View style={styles.proCardContent}>
              <Ionicons name={plan === 'pro' ? 'star' : 'star-outline'} size={24} color={plan === 'pro' ? '#fff' : colors.primary} />
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text style={[styles.planTitle, { color: plan === 'pro' ? '#fff' : colors.textPrimary }]}>
                  {plan === 'pro' ? 'Pro Plan Active' : 'Free Plan'}
                </Text>
                <Text style={[styles.planDesc, { color: plan === 'pro' ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                  {plan === 'pro' ? 'All features unlocked' : 'Upgrade for full access'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              testID="toggle-plan-btn"
              style={[styles.upgradeBtn, { backgroundColor: plan === 'pro' ? 'rgba(255,255,255,0.2)' : colors.primary }]}
              onPress={togglePlan}
            >
              <Text style={styles.upgradeBtnText}>
                {plan === 'pro' ? 'Switch to Free' : 'Upgrade to Pro'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hybrid Cloud Sync Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
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
             <TouchableOpacity style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Link Email to Sync Devices</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Privacy & Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIVACY & LEGAL</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Backend Sync</Text>
              <TouchableOpacity
                testID="ping-backend-btn"
                style={[styles.valueBtn, { backgroundColor: isPinging ? colors.border : colors.primary }]}
                onPress={handlePingBackend}
                disabled={isPinging}
              >
                {isPinging ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="cloud-upload-outline" size={14} color="#fff" />}
                <Text style={[styles.valueText, { color: '#fff', marginLeft: 4 }]}>Ping Server</Text>
              </TouchableOpacity>
            </View>
            {backendStatus && (
              <Text style={{ ...typography.xs, color: backendStatus.success ? '#10B981' : '#EF4444', marginTop: spacing.sm }}>
                {backendStatus.message}
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
  valueText: { ...typography.xs, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { height: 1, marginVertical: spacing.sm },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  chipText: { fontSize: 12, fontWeight: '600' },
  proBadgeInline: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  proText: { fontSize: 10, fontWeight: '700' },
  proCard: { borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1 },
  proCardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  planTitle: { ...typography.body, fontWeight: '700' },
  planDesc: { ...typography.label, marginTop: 2 },
  upgradeBtn: { borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
