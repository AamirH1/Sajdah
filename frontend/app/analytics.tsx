import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { spacing, typography, radius } from '../src/theme';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [optIn, setOptIn] = useState(true);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Analytics Data (EU)</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Ionicons name="stats-chart-outline" size={48} color={colors.primary} style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
        <Text style={[styles.bodyText, { color: colors.screenTextSecondary, marginBottom: spacing.xl }]}>
          To comply with European region regulations (GDPR), we provide full transparency regarding analytics data.
          {"\n\n"}
          We collect minimal, anonymized telemetry (such as crash reports and basic feature usage) to improve application stability and user experience. 
          {"\n\n"}
          No personally identifiable information is collected. However, you have the right to opt-out of all non-essential data collection at any time using the toggle below.
        </Text>

        <View style={[styles.toggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={[styles.toggleTitle, { color: colors.onSurface }]}>Share Anonymous Analytics</Text>
            <Text style={[styles.toggleDesc, { color: colors.onSurfaceSecondary }]}>Help us improve Sajdah by sharing anonymous crash reports and usage statistics.</Text>
          </View>
          <Switch
            value={optIn}
            onValueChange={setOptIn}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
        
        <TouchableOpacity style={[styles.deleteBtn, { borderColor: colors.error }]} onPress={() => {}}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[styles.deleteBtnText, { color: colors.error }]}>Request Data Deletion</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.bodyBold },
  content: { padding: spacing.xl },
  bodyText: { ...typography.body, lineHeight: 24 },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 20, borderWidth: 1, marginBottom: spacing.xl },
  toggleTitle: { ...typography.bodyBold, marginBottom: 4 },
  toggleDesc: { ...typography.xs, lineHeight: 18 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.full, borderWidth: 1, gap: spacing.sm },
  deleteBtnText: { ...typography.bodyBold }
});
