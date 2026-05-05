import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { spacing, radius, typography } from '../src/theme';
import { useSettings } from '../src/store/useSettings';
import { useRouter } from 'expo-router';

interface City {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

const CITIES: City[] = [
  { name: 'New Delhi', latitude: 28.6139, longitude: 77.209, country: 'India' },
  { name: 'Mumbai', latitude: 19.076, longitude: 72.8777, country: 'India' },
  { name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, country: 'India' },
  { name: 'Chennai', latitude: 13.0827, longitude: 80.2707, country: 'India' },
  { name: 'Hyderabad', latitude: 17.385, longitude: 78.4867, country: 'India' },
  { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, country: 'India' },
  { name: 'Lucknow', latitude: 26.8467, longitude: 80.9462, country: 'India' },
  { name: 'Jaipur', latitude: 26.9124, longitude: 75.7873, country: 'India' },
  { name: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, country: 'India' },
  { name: 'Srinagar', latitude: 34.0837, longitude: 74.7973, country: 'India' },
  { name: 'Bhopal', latitude: 23.2599, longitude: 77.4126, country: 'India' },
  { name: 'Patna', latitude: 25.6093, longitude: 85.1376, country: 'India' },
  { name: 'Karachi', latitude: 24.8607, longitude: 67.0011, country: 'Pakistan' },
  { name: 'Lahore', latitude: 31.5204, longitude: 74.3587, country: 'Pakistan' },
  { name: 'Islamabad', latitude: 33.6844, longitude: 73.0479, country: 'Pakistan' },
  { name: 'Dhaka', latitude: 23.8103, longitude: 90.4125, country: 'Bangladesh' },
  { name: 'Chittagong', latitude: 22.3569, longitude: 91.7832, country: 'Bangladesh' },
  { name: 'Colombo', latitude: 6.9271, longitude: 79.8612, country: 'Sri Lanka' },
  { name: 'Kathmandu', latitude: 27.7172, longitude: 85.324, country: 'Nepal' },
  { name: 'Mecca', latitude: 21.3891, longitude: 39.8579, country: 'Saudi Arabia' },
  { name: 'Medina', latitude: 24.5247, longitude: 39.5692, country: 'Saudi Arabia' },
  { name: 'Dubai', latitude: 25.2048, longitude: 55.2708, country: 'UAE' },
];

export default function LocationPickerScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { setLocation, location } = useSettings();
  const [loading, setLoading] = useState(false);

  const handleGPS = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for accurate prayer times.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const cityName = reverseGeocode[0]?.city || reverseGeocode[0]?.subregion || 'My Location';
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        city: cityName,
      });
      Alert.alert('Location Updated', `Prayer times set for ${cityName}`);
    } catch (error) {
      Alert.alert('Error', 'Unable to get your location. Please select a city manually.');
    }
    setLoading(false);
  };

  const handleCitySelect = (city: City) => {
    setLocation({
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="location-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Select Location</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* GPS Button */}
      <TouchableOpacity
        testID="gps-location-btn"
        style={[styles.gpsBtn, { backgroundColor: colors.primary }]}
        onPress={handleGPS}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Ionicons name="navigate" size={20} color="#fff" />
        )}
        <Text style={styles.gpsBtnText}>
          {loading ? 'Getting location...' : 'Use GPS Location'}
        </Text>
      </TouchableOpacity>

      {/* Current Location */}
      <View style={[styles.currentSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="location" size={18} color={colors.primary} />
        <Text style={[styles.currentText, { color: colors.textPrimary }]}>
          Current: {location.city}
        </Text>
      </View>

      {/* City List */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SELECT A CITY</Text>
      <FlatList
        testID="city-list"
        data={CITIES}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`city-${item.name.toLowerCase().replace(/\s/g, '-')}`}
            style={[
              styles.cityItem,
              {
                backgroundColor: location.city === item.name ? colors.accentLight : colors.surface,
                borderColor: location.city === item.name ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleCitySelect(item)}
          >
            <View style={styles.cityInfo}>
              <Text style={[styles.cityName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.cityCountry, { color: colors.textSecondary }]}>{item.country}</Text>
            </View>
            {location.city === item.name && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.bodyBold },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: spacing.lg, padding: spacing.lg, borderRadius: radius.xl, gap: spacing.sm },
  gpsBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  currentSection: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.lg },
  currentText: { ...typography.bodyBold },
  sectionLabel: { ...typography.xs, fontWeight: '700', letterSpacing: 1, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.huge },
  cityItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.sm },
  cityInfo: {},
  cityName: { ...typography.bodyBold },
  cityCountry: { ...typography.xs, marginTop: 2 },
});
