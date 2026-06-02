import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { spacing, typography } from '../src/theme';

export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.onBackground }]}>Terms & Conditions</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Ionicons name="document-text-outline" size={48} color={colors.primary} style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
        <Text style={[styles.bodyText, { color: colors.screenTextSecondary }]}>
          <Text style={{ fontWeight: 'bold' }}>Last Updated: {new Date().toLocaleDateString()}</Text>
          {"\n\n"}
          Welcome to Sajdah. By accessing or using our application, you agree to be bound by these Terms and Conditions.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold', color: colors.screenTextPrimary }}>1. Nature of the Service</Text>
          {"\n"}
          Sajdah provides prayer times, Quranic texts, translations, and other Islamic content for spiritual guidance and reference. 
          {"\n\n"}
          <Text style={{ fontWeight: 'bold', color: colors.screenTextPrimary }}>2. Accuracy of Information</Text>
          {"\n"}
          While we strive for absolute accuracy in our calculations and content, mathematical anomalies or differing calculation methodologies may result in slight variations. Please consult with your local scholars or masjid for final rulings if you are in doubt regarding specific Islamic practices or prayer times.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold', color: colors.screenTextPrimary }}>3. Intellectual Property</Text>
          {"\n"}
          The application&apos;s original design, features, and functionality are owned by the developers of Sajdah. The Arabic text of the Quran and its public domain translations remain the property of their respective copyright holders where applicable.
          {"\n\n"}
          <Text style={{ fontWeight: 'bold', color: colors.screenTextPrimary }}>4. Limitation of Liability</Text>
          {"\n"}
          In no event shall Sajdah or its developers be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the application.
          {"\n\n"}
          For support or inquiries, contact us at <Text style={{ color: colors.primary }}>hello.aamirdev@gmail.com</Text>.
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
