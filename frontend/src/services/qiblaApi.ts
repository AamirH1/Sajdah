import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, Qibla } from 'adhan';
import { assertApiSuccess, fetchJson } from './http';

const BASE_URL = 'https://ummahapi.com/api/qibla';
const REQUEST_TIMEOUT_MS = 10000;
const CACHE_PREFIX = 'qibla_lookup_v1';
const KAABA_LATITUDE = 21.4225;
const KAABA_LONGITUDE = 39.8262;
const EARTH_RADIUS_KM = 6371;

export interface QiblaLookupResult {
  direction: number;
  distanceKm?: number;
  source: 'api' | 'local';
}

interface ApiEnvelope<T> {
  success?: boolean;
  service?: string;
  data?: T;
  timestamp?: string;
}

const roundCoord = (value: number) => Math.round(value * 1000) / 1000;

const cacheKeyForLocation = (latitude: number, longitude: number) =>
  `${CACHE_PREFIX}_${roundCoord(latitude)}_${roundCoord(longitude)}`;

const normalizeDirection = (direction: number) => ((direction % 360) + 360) % 360;

const toRadians = (degrees: number) => degrees * Math.PI / 180;

const distanceToKaabaKm = (latitude: number, longitude: number) => {
  const deltaLat = toRadians(KAABA_LATITUDE - latitude);
  const deltaLng = toRadians(KAABA_LONGITUDE - longitude);
  const lat1 = toRadians(latitude);
  const lat2 = toRadians(KAABA_LATITUDE);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const localQibla = (latitude: number, longitude: number): QiblaLookupResult => {
  const direction = Qibla(new Coordinates(latitude, longitude));
  return {
    direction: Number.isFinite(direction) ? normalizeDirection(direction) : 0,
    distanceKm: distanceToKaabaKm(latitude, longitude),
    source: 'local',
  };
};

const normalizeQiblaResponse = (payload: unknown): Partial<QiblaLookupResult> | null => {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Record<string, any>;
  const source = data.data && typeof data.data === 'object' ? (data.data as Record<string, any>) : data;

  const directionCandidate =
    source.direction ??
    source.bearing ??
    source.qiblaDirection ??
    source.qibla_direction ??
    source.angle ??
    source.azimuth;

  const distanceCandidate =
    source.distanceKm ??
    source.distance_km ??
    source.distance ??
    source.distanceToKaaba ??
    source.distance_to_kaaba;

  const direction = Number(directionCandidate);
  const distanceKm = Number(distanceCandidate);

  return {
    direction: Number.isFinite(direction) ? direction : undefined,
    distanceKm: Number.isFinite(distanceKm) ? distanceKm : undefined,
  };
};

export async function getQiblaLookup(latitude: number, longitude: number, forceRefresh = false): Promise<QiblaLookupResult> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Valid coordinates are required for Qibla lookup');
  }

  const cacheKey = cacheKeyForLocation(latitude, longitude);

  if (!forceRefresh) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as QiblaLookupResult;
        if (typeof parsed?.direction === 'number') {
          return parsed;
        }
      } catch {
        // Ignore malformed cache and continue.
      }
    }
  }

  try {
    const json = await fetchJson<ApiEnvelope<any>>(`${BASE_URL}?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`, REQUEST_TIMEOUT_MS, {
      cacheKey,
      cacheTtlMs: 30 * 24 * 60 * 60 * 1000,
    });
    assertApiSuccess(json, 'Unable to load Qibla direction');
    const normalized = normalizeQiblaResponse(json.data ?? json);
    if (normalized && typeof normalized.direction === 'number') {
      const result: QiblaLookupResult = {
        direction: normalizeDirection(normalized.direction),
        distanceKm: normalized.distanceKm ?? distanceToKaabaKm(latitude, longitude),
        source: 'api',
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    }
  } catch (error) {
    console.warn('UmmahAPI qibla lookup failed, using local calculation:', error);
  }

  const fallback = localQibla(latitude, longitude);
  await AsyncStorage.setItem(cacheKey, JSON.stringify(fallback));
  return fallback;
}
