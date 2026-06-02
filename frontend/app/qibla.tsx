import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { useSettings } from '../src/store/useSettings';
import { ScreenContainer, Card } from '../src/ui/components';
import { getQiblaLookup } from '../src/services/qiblaApi';

const { width } = Dimensions.get('window');

export default function QiblaScreen() {
  const { colors, typography, spacing, shadows } = useTheme();
  const router = useRouter();
  const { location } = useSettings();
  
  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [qiblaDistanceKm, setQiblaDistanceKm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const compassSpin = useRef(new Animated.Value(0)).current;
  const qiblaSpin = useRef(new Animated.Value(0)).current;
  const lastHeading = useRef(0);
  const prevCompassRot = useRef(0);
  const prevQiblaRot = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const loadQibla = async () => {
      if (location?.latitude == null || location?.longitude == null) {
        setQiblaDirection(0);
        setQiblaDistanceKm(null);
        return;
      }

      try {
        const result = await getQiblaLookup(location.latitude, location.longitude);
        if (cancelled) return;
        setQiblaDirection(Number.isFinite(result.direction) ? result.direction : 0);
        setQiblaDistanceKm(typeof result.distanceKm === 'number' ? result.distanceKm : null);
      } catch {
        if (cancelled) return;
        setQiblaDirection(0);
        setQiblaDistanceKm(null);
      }
    };

    loadQibla();

    return () => {
      cancelled = true;
    };
  }, [location]);

  useEffect(() => {
    let locationSub: Location.LocationSubscription | null = null;
    
    const startCompass = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission is required for the compass.');
          setLoading(false);
          return;
        }

        locationSub = await Location.watchHeadingAsync((headingObj) => {
          // Prefer trueHeading for accuracy, fallback to magnetic heading
          let newHeading = headingObj.trueHeading >= 0 ? headingObj.trueHeading : headingObj.magHeading;
          if (newHeading < 0) newHeading += 360;

          // Smooth out sensor jitter using a Low Pass Filter (alpha 0.15)
          let prev = lastHeading.current;
          let diff = (((newHeading - prev) + 180) % 360 + 360) % 360 - 180;
          let smoothed = (prev + 0.15 * diff + 360) % 360;
          
          lastHeading.current = smoothed;
          setHeading(smoothed);
          setLoading(false);
        });
      } catch {
        setError('This device cannot use the compass right now.');
        setLoading(false);
      }
    };

    startCompass();

    return () => {
      if (locationSub) {
        locationSub.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Ensure animations don't spin wildly backwards when jumping from 359° to 1° 
    let targetCompass = -heading;
    let currentCompass = prevCompassRot.current;
    let diffCompass = (((targetCompass - currentCompass) + 180) % 360 + 360) % 360 - 180;
    let nextCompass = currentCompass + diffCompass;
    prevCompassRot.current = nextCompass;

    let targetQibla = -heading + qiblaDirection;
    let currentQibla = prevQiblaRot.current;
    let diffQibla = (((targetQibla - currentQibla) + 180) % 360 + 360) % 360 - 180;
    let nextQibla = currentQibla + diffQibla;
    prevQiblaRot.current = nextQibla;

    Animated.parallel([
      Animated.spring(compassSpin, {
        toValue: nextCompass,
        friction: 4,
        tension: 20,
        useNativeDriver: true,
      }),
      Animated.spring(qiblaSpin, {
        toValue: nextQibla,
        friction: 4,
        tension: 20,
        useNativeDriver: true,
      })
    ]).start();
  }, [heading, qiblaDirection]);

  const compassTransform = { 
    transform: [{ 
      rotate: compassSpin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) 
    }] 
  };

  const qiblaTransform = { 
    transform: [{ 
      rotate: qiblaSpin.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) 
    }] 
  };

  const getDirectionLabel = (h: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const normalized = (h % 360 + 360) % 360;
    return directions[Math.round(normalized / 45) % 8];
  };

  const getInfoIcon = (kind: 'direction' | 'distance' | 'city') => {
    switch (kind) {
      case 'direction':
        return 'compass-outline';
      case 'distance':
        return 'map-outline';
      case 'city':
        return 'location-outline';
    }
  };

  const renderCompassMarks = () => {
    return Array.from({ length: 24 }).map((_, index) => {
      const angle = index * 15;
      let label = '';
      if (angle === 0) label = 'N';
      else if (angle === 45) label = 'NE';
      else if (angle === 90) label = 'E';
      else if (angle === 135) label = 'SE';
      else if (angle === 180) label = 'S';
      else if (angle === 225) label = 'SW';
      else if (angle === 270) label = 'W';
      else if (angle === 315) label = 'NW';

      const isCardinal = angle % 90 === 0;
      const isNorth = label === 'N';

      return (
        <View key={index} style={[styles.markContainer, { transform: [{ rotate: `${angle}deg` }] }]}>
          {label ? (
            <Text style={[
              styles.markText, 
              isCardinal ? { ...typography.title, fontWeight: '700' } : { ...typography.xs, color: colors.onSurfaceSecondary },
              isNorth && { color: colors.primary, fontWeight: '800' }
            ]}>
              {label}
            </Text>
          ) : (
            <View style={[styles.markOrdinalTick, { backgroundColor: colors.border }]} />
          )}
        </View>
      );
    });
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.screenTextPrimary} />
        </TouchableOpacity>
        <Text style={[typography.title, { color: colors.screenTextPrimary }]}>Qibla Compass</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Getting your location...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Ionicons name="warning-outline" size={48} color={colors.primary} />
            <Text style={[typography.title, { color: colors.textPrimary, marginTop: spacing.md }]}>Permission Denied</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={() => Linking.openSettings()} style={[styles.settingsBtn, { backgroundColor: colors.primary }]}>
              <Text style={[typography.label, { color: colors.onPrimary }]}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[typography.body, styles.instructions, { color: colors.textSecondary }]}>
              Align the arrow with the Kaaba to face Qibla.
            </Text>
            
            <View style={[styles.compassWrapper, { backgroundColor: colors.surfaceAlt, ...shadows.md }]}>
              {/* Phone Forward indicator (fixed at top) */}
              <View style={[styles.forwardMarker, { borderBottomColor: colors.primary }]} />
              
              {/* Compass Ring */}
              <Animated.View style={[styles.compassRing, compassTransform]}>
                 {renderCompassMarks()}
              </Animated.View>

              {/* Center Display */}
              <View style={[styles.centerDisplay, { backgroundColor: colors.surface, ...shadows.sm }]}>
                 <Text style={[typography.displayLg, { color: colors.textPrimary, fontSize: 36, lineHeight: 40 }]}>{Math.round(heading)}°</Text>
                 <Text style={[typography.label, { color: colors.textSecondary }]}>{getDirectionLabel(heading)}</Text>
              </View>

              {/* Qibla Arrow */}
              <Animated.View style={[styles.qiblaArrowContainer, qiblaTransform]}>
                 <View style={styles.qiblaArrowIndicator}>
                    <Text style={styles.kaabaIcon}>🕋</Text>
                    <View style={[styles.triangle, { borderBottomColor: colors.primary }]} />
                    <View style={[styles.arrowLine, { backgroundColor: colors.primary }]} />
                 </View>
              </Animated.View>
            </View>

            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Ionicons name={getInfoIcon('direction')} size={18} color={colors.textSecondary} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Qibla Direction</Text>
                </View>
                <Text style={[typography.title, { color: colors.primary }]}>{Math.round(qiblaDirection)}°</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Ionicons name={getInfoIcon('distance')} size={18} color={colors.textSecondary} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Distance to Kaaba</Text>
                </View>
                <Text style={[typography.title, { color: colors.textPrimary }]}>
                  {qiblaDistanceKm != null ? `${Math.round(qiblaDistanceKm)} km` : '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Ionicons name={getInfoIcon('city')} size={18} color={colors.textSecondary} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Current City</Text>
                </View>
                <Text style={[typography.title, { color: colors.textPrimary }]}>{location.city || 'Unknown'}</Text>
              </View>
            </Card>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  instructions: { textAlign: 'center', marginBottom: 48 },
  settingsBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
  compassWrapper: {
    width: width * 0.85,
    height: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: width * 0.425,
  },
  compassRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  markContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  markText: {
    marginTop: 8,
  },
  markOrdinalTick: {
    width: 2,
    height: 8,
    marginTop: 14,
    borderRadius: 1,
  },
  centerDisplay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 130,
    borderRadius: 65,
    zIndex: 10,
  },
  qiblaArrowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingTop: 45, // clear the compass text
  },
  qiblaArrowIndicator: {
    alignItems: 'center',
  },
  kaabaIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowLine: {
    width: 4,
    height: 45,
    borderRadius: 2,
  },
  forwardMarker: {
    position: 'absolute',
    top: -12,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 20,
  },
  infoCard: {
    width: '100%',
    marginTop: 64,
    padding: 24,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  }
});
