import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { spacing, typography } from '../src/theme';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Privacy Policy</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
        <Text style={[styles.bodyText, { color: colors.onSurfaceSecondary }]}>
          <Text style={{ fontWeight: 'bold' }}>Last Updated: {new Date().toLocaleDateString()}</Text>
          {"\n\n"}
          Your privacy is critically important to us. Sajdah ("the App") is designed to respect your device data and operates primarily offline to ensure your personal information remains secure.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold', color: colors.onSurface }}>1. Information Collection</Text>
          {"\n"}
          We do not require you to create an account or provide personally identifiable information (such as your name, email, or phone number) to use the core features of the App. 
          {"\n\n"}
          <Text style={{ fontWeight: 'bold', color: colors.onSurface }}>2. Location Data</Text>
          {"\n"}
          To provide accurate prayer times and Qibla direction, the App requires access to your device's location. This location data is processed locally on your device and is not transmitted to or stored on our servers.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold', color: colors.onSurface }}>3. Cloud Backup & Sync</Text>
          {"\n"}
          If you utilize the Cloud Backup & Sync feature to back up your preferences and Tasbih counts, we generate a random, anonymous Device ID. The data synced using this ID is kept strictly confidential, is not linked to your identity, and is not shared with third parties.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold', color: colors.onSurface }}>4. Changes to This Policy</Text>
          {"\n"}
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          {"\n\n"}
          If you have any questions or concerns about our privacy practices, please contact us at <Text style={{ color: colors.primary }}>hello.aamirdev@gmail.com</Text>.
        </Text>
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
  bodyText: { ...typography.body, lineHeight: 24 }
});