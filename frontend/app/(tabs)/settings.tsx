import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { spacing, radius, typography } from '../../src/theme';
import { useSettings } from '../../src/store/useSettings';
import { useEntitlements, useCanUse } from '../../src/store/useEntitlements';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const settings = useSettings();
  const { plan, togglePlan } = useEntitlements();
  const canUseMultiLang = useCanUse('quran.multipleLanguages');
  const canUseSmartFajr = useCanUse('prayer.smartFajrAlarm');

  const methods = ['Karachi', 'MuslimWorldLeague', 'Egyptian', 'UmmAlQura', 'Dubai', 'NorthAmerica'] as const;
  const madhhabOptions = ['Hanafi', 'Shafi'] as const;
  const themeOptions = ['light', 'dark', 'system'] as const;
  const languages = ['english', 'urdu'] as const;
  const proLanguages = ['hindi', 'bangla', 'tamil'] as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        {/* Prayer Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRAYER</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Location</Text>
              <TouchableOpacity testID="location-selector" style={[styles.valueBtn, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[styles.valueText, { color: colors.primary }]}>{settings.location.city}</Text>
              </TouchableOpacity>
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
                    <Ionicons name="lock-closed" size={10} color="#D97706" />
                    <Text style={styles.proText}>PRO</Text>
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
                  {!canUseMultiLang && <Ionicons name="lock-closed" size={10} color="#D97706" style={{ marginLeft: 4 }} />}
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
          <View style={[styles.proCard, { backgroundColor: plan === 'pro' ? '#059669' : colors.surface, borderColor: plan === 'pro' ? '#059669' : colors.border }]}>
            <View style={styles.proCardContent}>
              <Ionicons name={plan === 'pro' ? 'star' : 'star-outline'} size={24} color={plan === 'pro' ? '#fff' : '#D97706'} />
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
              style={[styles.upgradeBtn, { backgroundColor: plan === 'pro' ? 'rgba(255,255,255,0.2)' : '#D97706' }]}
              onPress={togglePlan}
            >
              <Text style={styles.upgradeBtnText}>
                {plan === 'pro' ? 'Switch to Free' : 'Upgrade to Pro'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.huge },
  title: { ...typography.h2, marginBottom: spacing.xl },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { ...typography.xs, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm, paddingLeft: spacing.xs },
  card: { borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  settingLabel: { ...typography.body, fontWeight: '500' },
  settingValue: { ...typography.small },
  valueBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, gap: 4 },
  valueText: { ...typography.xs, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  divider: { height: 1, marginVertical: spacing.sm },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full },
  chipText: { fontSize: 12, fontWeight: '600' },
  proBadgeInline: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  proText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  proCard: { borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1 },
  proCardContent: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  planTitle: { ...typography.bodyBold },
  planDesc: { ...typography.small, marginTop: 2 },
  upgradeBtn: { borderRadius: radius.full, paddingVertical: spacing.md, alignItems: 'center' },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
