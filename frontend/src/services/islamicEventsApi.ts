import AsyncStorage from '@react-native-async-storage/async-storage';
import { assertApiSuccess, fetchJson } from './http';

const BASE_URL = 'https://ummahapi.com/api/islamic-events';
const CACHE_KEY = 'islamic_events_cache_v1';
const REQUEST_TIMEOUT_MS = 12000;

export interface IslamicEventEntry {
  month: number;
  day: number;
  name: string;
  description: string;
}

export interface IslamicEventsResponse {
  currentHijriDate: {
    gregorian: {
      date: string;
      formatted: string;
      dayOfWeek: string;
      day: number;
      month: number;
      monthName: string;
      year: number;
    };
    hijri: {
      date: string;
      formatted: string;
      day: number;
      month: number;
      monthName: string;
      monthNameArabic: string;
      year: number;
      era: string;
    };
    islamicInfo?: {
      hijriEraStart?: string;
      calendarType?: string;
      note?: string;
    };
  };
  nextEvent?: {
    name: string;
    hijriDate: string;
    month: number;
    day: number;
  };
  events: IslamicEventEntry[];
  note?: string;
}

const asRecord = (value: unknown): Record<string, any> => (
  value && typeof value === 'object' ? value as Record<string, any> : {}
);

const normalizeEvent = (raw: unknown): IslamicEventEntry => {
  const item = asRecord(raw);
  return {
    month: Number(item.month ?? 0),
    day: Number(item.day ?? 0),
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
  };
};

const normalizeResponse = (payload: unknown): IslamicEventsResponse => {
  const source = asRecord(payload);
  const data = asRecord(source.data);
  const currentHijriDate = asRecord(data.current_hijri_date);
  const gregorian = asRecord(currentHijriDate.gregorian);
  const hijri = asRecord(currentHijriDate.hijri);
  const islamicInfo = asRecord(currentHijriDate.islamic_info);
  const nextEvent = asRecord(data.next_event);
  const events = Array.isArray(data.events) ? data.events.map(normalizeEvent) : [];

  return {
    currentHijriDate: {
      gregorian: {
        date: String(gregorian.date ?? ''),
        formatted: String(gregorian.formatted ?? ''),
        dayOfWeek: String(gregorian.day_of_week ?? ''),
        day: Number(gregorian.day ?? 0),
        month: Number(gregorian.month ?? 0),
        monthName: String(gregorian.month_name ?? ''),
        year: Number(gregorian.year ?? 0),
      },
      hijri: {
        date: String(hijri.date ?? ''),
        formatted: String(hijri.formatted ?? ''),
        day: Number(hijri.day ?? 0),
        month: Number(hijri.month ?? 0),
        monthName: String(hijri.month_name ?? ''),
        monthNameArabic: String(hijri.month_name_arabic ?? ''),
        year: Number(hijri.year ?? 0),
        era: String(hijri.era ?? ''),
      },
      islamicInfo: {
        hijriEraStart: String(islamicInfo.hijri_era_start ?? ''),
        calendarType: String(islamicInfo.calendar_type ?? ''),
        note: String(islamicInfo.note ?? ''),
      },
    },
    nextEvent: nextEvent && Object.keys(nextEvent).length > 0 ? {
      name: String(nextEvent.name ?? ''),
      hijriDate: String(nextEvent.hijri_date ?? ''),
      month: Number(nextEvent.month ?? 0),
      day: Number(nextEvent.day ?? 0),
    } : undefined,
    events,
    note: String(data.note ?? source.note ?? ''),
  };
};

export async function getIslamicEvents(forceRefresh = false): Promise<IslamicEventsResponse> {
  if (!forceRefresh) {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as IslamicEventsResponse;
      } catch {
        // Ignore malformed cache.
      }
    }
  }

  const payload = await fetchJson(BASE_URL, REQUEST_TIMEOUT_MS);
  assertApiSuccess(payload, 'Unable to load Islamic events');
  const normalized = normalizeResponse(payload);
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(normalized));
  return normalized;
}
