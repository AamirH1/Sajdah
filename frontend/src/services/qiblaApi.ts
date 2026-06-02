import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, Qibla } from 'adhan';

const BASE_URL = 'https://ummahapi.com/api/qibla';
const REQUEST_TIMEOUT_MS = 10000;
const CACHE_PREFIX = 'qibla_lookup_v1';

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

const fetchJson = async <T,>(url: string): Promise<ApiEnvelope<T>> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Qibla request failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Qibla request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const localQibla = (latitude: number, longitude: number): QiblaLookupResult => {
  const qibla = new Qibla(new Coordinates(latitude, longitude));
  return {
    direction: Number.isFinite(qibla.direction) ? qibla.direction : 0,
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
    const json = await fetchJson<unknown>(`${BASE_URL}?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`);
    const normalized = normalizeQiblaResponse(json.data ?? json);
    if (normalized && typeof normalized.direction === 'number') {
      const result: QiblaLookupResult = {
        direction: normalized.direction,
        distanceKm: normalized.distanceKm,
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
