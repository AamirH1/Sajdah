import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/ui/hooks/useTheme';
import { useSettings } from '../src/store/useSettings';
import { ScreenContainer, Card } from '../src/ui/components';
import { getQiblaLookup } from '../src/services/qiblaApi';
import { getDynamicScreenGradient } from '../src/ui/colorUtils';

const { width, height } = Dimensions.get('window');
const compassSize = Math.min(width * 0.85, height < 760 ? 292 : 340);

export default function QiblaScreen() {
  const { colors, typography, spacing, shadows, isDark } = useTheme();
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
  }, [compassSpin, heading, qiblaDirection, qiblaSpin]);

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
  const screenGradient = getDynamicScreenGradient(colors, isDark);

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
    <ScreenContainer scrollable={false} heroGradient={screenGradient}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.screenTextPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.screenTextPrimary }]}>Qibla Compass</Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="compass-outline" size={22} color={colors.primary} />
        </View>
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
            <View style={styles.compassSection}>
              <Text style={[typography.body, styles.instructions, { color: colors.textSecondary }]}>
                Align the arrow with the Kaaba to face Qibla.
              </Text>
              
              <View style={[styles.compassWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, ...shadows.md }]}>
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
            </View>

            <Card style={[styles.infoCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, shadows.sm]}>
              <View style={styles.infoHeader}>
                <View style={[styles.infoIconBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="navigate" size={22} color={colors.primary} />
                </View>
                <View style={styles.infoTitleBlock}>
                  <Text numberOfLines={1} style={[styles.infoEyebrow, { color: colors.textLabel }]}>QIBLA DIRECTION</Text>
                  <Text style={[typography.xs, styles.infoSubtitle, { color: colors.textSecondary }]}>
                    Face this bearing{'\n'}from your current location.
                  </Text>
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={[styles.directionValue, { color: colors.primary }]}>
                  {Math.round(qiblaDirection)}°
                </Text>
              </View>

              <View style={styles.infoTileRow}>
                <View style={[styles.infoTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.infoLabelGroup}>
                    <Ionicons name={getInfoIcon('distance')} size={16} color={colors.primary} />
                    <Text style={[styles.infoTileLabel, { color: colors.textSecondary }]}>Distance</Text>
                  </View>
                  <Text style={[styles.infoTileValue, { color: colors.textPrimary }]}>
                    {qiblaDistanceKm != null ? `${Math.round(qiblaDistanceKm)} km` : '—'}
                  </Text>
                </View>

                <View style={[styles.infoTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.infoLabelGroup}>
                    <Ionicons name={getInfoIcon('city')} size={16} color={colors.primary} />
                    <Text style={[styles.infoTileLabel, { color: colors.textSecondary }]}>Location</Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.infoTileValue, { color: colors.textPrimary }]}>
                    {location.city || 'Unknown'}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoHint, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="phone-portrait-outline" size={16} color={colors.primary} />
                <Text style={[typography.xs, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>
                  Hold your phone flat and rotate until the Kaaba marker points forward.
                </Text>
              </View>
            </Card>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 },
  centerContent: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  compassSection: {
    width: '100%',
    alignItems: 'center',
    flexShrink: 1,
  },
  instructions: {
    width: '100%',
    maxWidth: 320,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 48,
  },
  settingsBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
  compassWrapper: {
    width: compassSize,
    height: compassSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: compassSize / 2,
    borderWidth: 1,
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
    marginTop: 26,
    padding: 16,
    gap: 12,
  },
  infoHeader: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  infoIconBadge: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 58,
  },
  infoEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  infoSubtitle: {
    marginTop: 2,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  directionValue: {
    position: 'absolute',
    right: 0,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  infoTileRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  infoTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoTileValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  infoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
