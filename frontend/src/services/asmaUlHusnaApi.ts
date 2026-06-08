import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranslationLang } from '../store/useSettings';
import { assertApiSuccess, fetchJson } from './http';

const BASE_URL = 'https://islamicapi.com/api/v1/asma-ul-husna';
const REQUEST_TIMEOUT_MS = 12000;
const CACHE_PREFIX = 'asma_ul_husna_lang_cache_v1';

export interface AsmaUlHusnaLocalizedItem {
  number: number;
  nameArabic: string;
  transliteration: string;
  translation: string;
  meaning: string;
  audio?: string;
}

const LANGUAGE_CODES: Record<Exclude<TranslationLang, 'english'>, string> = {
  urdu: 'ur',
  hindi: 'hi',
  bangla: 'bn',
  tamil: 'ta',
  malayalam: 'ml',
  telugu: 'te',
  kannada: 'kn',
  gujarati: 'gu',
};

const LANGUAGE_LABELS: Record<TranslationLang, string> = {
  english: 'English',
  urdu: 'Urdu',
  hindi: 'Hindi',
  bangla: 'Bengali',
  tamil: 'Tamil',
  malayalam: 'Malayalam',
  telugu: 'Telugu',
  kannada: 'Kannada',
  gujarati: 'Gujarati',
};

const API_KEY = process.env.EXPO_PUBLIC_ISLAMIC_API_KEY?.trim() || '';

const asRecord = (value: unknown): Record<string, any> => (
  value && typeof value === 'object' ? value as Record<string, any> : {}
);

const extractItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const source = asRecord(payload);
  const candidates = [source.data, source.results, source.items, source.data?.names, source.names];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === 'object') {
      const nested = extractItems(candidate);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

const pickString = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const normalizeItem = (raw: unknown, index: number): AsmaUlHusnaLocalizedItem => {
  const item = asRecord(raw);
  return {
    number: Number(item.number ?? item.id ?? index + 1) || index + 1,
    nameArabic: pickString(item, ['name', 'arabic', 'nameArabic']),
    transliteration: pickString(item, ['transliteration']),
    translation: pickString(item, ['translation']),
    meaning: pickString(item, ['meaning']),
    audio: pickString(item, ['audio']) || undefined,
  };
};

const cacheKeyFor = (language: TranslationLang) => `${CACHE_PREFIX}_${language}`;

export function getAsmaUlHusnaLanguageLabel(language: TranslationLang): string {
  return LANGUAGE_LABELS[language];
}

export function isAsmaUlHusnaLanguageSupported(language: TranslationLang): boolean {
  return language !== 'english';
}

export function hasIslamicApiKey(): boolean {
  return Boolean(API_KEY);
}

export async function getAsmaUlHusnaByLanguage(language: TranslationLang, forceRefresh = false): Promise<AsmaUlHusnaLocalizedItem[]> {
  if (language === 'english') {
    throw new Error('Use the default UmmahAPI source for English');
  }

  const cacheKey = cacheKeyFor(language);
  if (!forceRefresh) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed as AsmaUlHusnaLocalizedItem[];
        }
      } catch {
        // Ignore malformed cache and fall back to network.
      }
    }
  }

  if (!API_KEY) {
    throw new Error('Missing IslamicAPI key');
  }

  const languageCode = LANGUAGE_CODES[language];
  const payload = await fetchJson(`${BASE_URL}/?language=${encodeURIComponent(languageCode)}&api_key=${encodeURIComponent(API_KEY)}`, REQUEST_TIMEOUT_MS);
  assertApiSuccess(payload, 'Unable to load Asma ul Husna translations');
  const items = extractItems(payload).map(normalizeItem).filter((item) => item.number > 0);
  await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
  return items;
}
