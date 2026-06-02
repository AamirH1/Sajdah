import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrayerTimes, formatPrayerTime } from './prayer';
import type { CalculationMethod, Madhhab } from '../store/useSettings';

const BASE_URL = 'https://ummahapi.com/api/prayer-times/month';
const CACHE_KEY_PREFIX = 'prayer_times_month_cache_v2';
const REQUEST_TIMEOUT_MS = 12000;

export interface MonthlyPrayerTimesDay {
  gregorianDate: string;
  hijriDate?: string;
  dayLabel?: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  prayerDatetimes?: Record<string, string>;
}

export interface MonthlyPrayerTimesResult {
  monthLabel?: string;
  yearLabel?: string;
  locationLabel?: string;
  days: MonthlyPrayerTimesDay[];
  note?: string;
}

export interface MonthlyPrayerTimesOptions {
  month?: number;
  year?: number;
  method?: string;
  madhab?: string;
  timezone?: string;
}

const requestTimeout = (ms: number) =>
  new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), ms);
  });

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await Promise.race([
    fetch(url),
    requestTimeout(REQUEST_TIMEOUT_MS),
  ]);

  if (!response || !('ok' in response)) {
    throw new Error('Network request failed');
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};

const asRecord = (value: unknown): Record<string, any> => (
  value && typeof value === 'object' ? value as Record<string, any> : {}
);

const pickString = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const pickPrayerTime = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (value && typeof value === 'object') {
      const nested = asRecord(value);
      const nestedValue = pickString(nested, ['time', 'value', 'datetime', 'date', 'label', 'formatted']);
      if (nestedValue) return nestedValue;
    }
  }
  return '';
};

const buildCacheKey = (
  latitude: number,
  longitude: number,
  options?: MonthlyPrayerTimesOptions
) => {
  const month = options?.month ?? new Date().getMonth() + 1;
  const year = options?.year ?? new Date().getFullYear();
  const method = options?.method || 'default';
  const madhab = options?.madhab || 'default';
  const timezone = options?.timezone || 'local';

  return [
    CACHE_KEY_PREFIX,
    latitude.toFixed(4),
    longitude.toFixed(4),
    year,
    String(month).padStart(2, '0'),
    method,
    madhab,
    timezone,
  ].join('_');
};

const normalizeDay = (raw: unknown, index: number): MonthlyPrayerTimesDay => {
  const item = asRecord(raw);
  const dateSource = asRecord(item.gregorian || item.date || item.day || item);
  const prayerSource = asRecord(item.prayer_times || item.prayers || item.times || item.timing || item.data || item);
  const prayerDatetimesSource = asRecord(item.prayer_datetimes || item.prayerDatetimes || item.datetimes || item.timestamps);

  return {
    gregorianDate: pickString(dateSource, ['date', 'gregorian_date', 'gregorianDate']) || pickString(item, ['date']) || `day-${index + 1}`,
    hijriDate: pickString(item, ['hijri_date', 'hijriDate', 'islamic_date', 'hijri']),
    dayLabel: pickString(dateSource, ['formatted', 'label', 'day_label', 'dayLabel', 'day_of_week', 'day_name']),
    fajr: pickPrayerTime(prayerSource, ['fajr', 'fajr_time', 'fajrTime']),
    sunrise: pickPrayerTime(prayerSource, ['sunrise', 'sunrise_time', 'sunriseTime']),
    dhuhr: pickPrayerTime(prayerSource, ['dhuhr', 'dhuhr_time', 'dhuhrTime']),
    asr: pickPrayerTime(prayerSource, ['asr', 'asr_time', 'asrTime']),
    maghrib: pickPrayerTime(prayerSource, ['maghrib', 'maghrib_time', 'maghribTime']),
    isha: pickPrayerTime(prayerSource, ['isha', 'isha_time', 'ishaTime']),
    prayerDatetimes: Object.keys(prayerDatetimesSource).length > 0 ? prayerDatetimesSource : undefined,
  };
};

const normalizeResponse = (payload: unknown): MonthlyPrayerTimesResult => {
  const source = asRecord(payload);
  const data = asRecord(source.data);

  const daysSource = Array.isArray(data.days)
    ? data.days
    : Array.isArray(data.prayer_times)
      ? data.prayer_times
      : Array.isArray(data.month_days)
        ? data.month_days
        : Array.isArray(data.times)
          ? data.times
          : Array.isArray(data)
            ? data
            : [];

  return {
    monthLabel: pickString(data, ['month_label', 'monthName', 'month_name', 'label']),
    yearLabel: pickString(data, ['year_label', 'yearName', 'year_name']) || String(data.year || ''),
    locationLabel: pickString(data, ['location_label', 'city', 'locationName']),
    days: daysSource.map(normalizeDay),
    note: pickString(data, ['note']) || pickString(source, ['note']),
  };
};

const buildLocalMonthlyFallback = (
  latitude: number,
  longitude: number,
  options?: MonthlyPrayerTimesOptions
): MonthlyPrayerTimesResult => {
  const now = new Date();
  const month = options?.month ?? now.getMonth() + 1;
  const year = options?.year ?? now.getFullYear();
  const method = (options?.method || 'MuslimWorldLeague') as CalculationMethod;
  const madhab = (options?.madhab || 'Shafi') as Madhhab;

  const lastDay = new Date(year, month, 0).getDate();
  const days: MonthlyPrayerTimesDay[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, month - 1, day);
    const prayers = getPrayerTimes(date, latitude, longitude, method, madhab);
    const prayerMap = Object.fromEntries(
      prayers.map((prayer) => [prayer.name, formatPrayerTime(prayer.time)])
    ) as Record<string, string>;

    days.push({
      gregorianDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      dayLabel: date.toLocaleDateString(undefined, { weekday: 'long' }),
      fajr: prayerMap.fajr || '',
      sunrise: prayerMap.sunrise || '',
      dhuhr: prayerMap.dhuhr || '',
      asr: prayerMap.asr || '',
      maghrib: prayerMap.maghrib || '',
      isha: prayerMap.isha || '',
      prayerDatetimes: Object.fromEntries(
        prayers.map((prayer) => [prayer.name, prayer.time.toISOString()])
      ),
    });
  }

  return {
    monthLabel: now.toLocaleDateString(undefined, { month: 'long' }),
    yearLabel: String(year),
    locationLabel: `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`,
    days,
    note: 'Using local calculation fallback.',
  };
};

export async function getMonthlyPrayerTimes(
  latitude: number,
  longitude: number,
  options?: MonthlyPrayerTimesOptions,
  forceRefresh = false
): Promise<MonthlyPrayerTimesResult> {
  const cacheKey = buildCacheKey(latitude, longitude, options);

  if (!forceRefresh) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as MonthlyPrayerTimesResult;
      } catch {
        // Ignore malformed cache and continue to network.
      }
    }
  }

  const now = new Date();
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    month: String(options?.month ?? now.getMonth() + 1),
    year: String(options?.year ?? now.getFullYear()),
  });

  if (options?.method) params.set('method', options.method);
  if (options?.madhab) params.set('madhab', options.madhab);
  if (options?.timezone) params.set('timezone', options.timezone);

  const url = `${BASE_URL}?${params.toString()}`;
  try {
    const payload = await fetchJson(url);
    const normalized = normalizeResponse(payload);

    if (normalized.days.length === 0) {
      throw new Error('Monthly prayer response did not contain days.');
    }

    await AsyncStorage.setItem(cacheKey, JSON.stringify(normalized));
    return normalized;
  } catch {
    const fallback = buildLocalMonthlyFallback(latitude, longitude, options);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(fallback));
    return fallback;
  }
}
