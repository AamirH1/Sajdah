import AsyncStorage from '@react-native-async-storage/async-storage';
import { assertApiSuccess, fetchJson } from './http';

const BASE_URL = 'https://ummahapi.com/api';
const REQUEST_TIMEOUT_MS = 12000;
const ASMA_CACHE_KEY = 'asma_ul_husna_cache_v1';
const DUA_SEARCH_CACHE_KEY = 'dua_search_cache_v1';

export interface AsmaUlHusnaItem {
  number: number;
  nameArabic: string;
  transliteration: string;
  translation?: string;
  meaning: string;
}

export interface DuaSearchItem {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  category: string;
  reference: string;
}

const asRecord = (value: unknown): Record<string, any> => (
  value && typeof value === 'object' ? value as Record<string, any> : {}
);

const pickString = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
};

const extractItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const source = asRecord(payload);
  const candidates = [
    source.data,
    source.results,
    source.items,
    source.duas,
    source.dua,
    source.names,
    source.asma_ul_husna,
    source.asmaUlHusna,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
    if (candidate && typeof candidate === 'object') {
      const nested = extractItems(candidate);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
};

const normalizeAsmaItem = (raw: unknown, index: number): AsmaUlHusnaItem => {
  const item = asRecord(raw);
  return {
    number: Number(item.number ?? item.id ?? index + 1) || index + 1,
    nameArabic: pickString(item, ['arabic', 'arabicName', 'nameArabic', 'name_arabic', 'name']),
    transliteration: pickString(item, ['transliteration', 'latin', 'englishName', 'nameEnglish', 'name_en']),
    translation: pickString(item, ['translation', 'meaning', 'description', 'english', 'text']) || undefined,
    meaning: pickString(item, ['meaning', 'translation', 'description', 'english', 'text']),
  };
};

const normalizeDuaItem = (raw: unknown, index: number): DuaSearchItem => {
  const item = asRecord(raw);
  return {
    id: String(item.id ?? item.dua_id ?? item.duaId ?? item.slug ?? index + 1),
    title: pickString(item, ['title', 'name', 'duaTitle', 'heading', 'subject']) || `Dua ${index + 1}`,
    arabic: pickString(item, ['arabic', 'duaArabic', 'arabicText', 'textArabic', 'content_arabic']),
    transliteration: pickString(item, ['transliteration', 'romanized', 'latin', 'transliterationText', 'content_transliteration']),
    translation: pickString(item, ['translation', 'meaning', 'english', 'text', 'content_english']),
    category: pickString(item, ['category', 'categoryName', 'group', 'tag', 'section']),
    reference: pickString(item, ['reference', 'source', 'book', 'citation', 'duaReference']),
  };
};

const readCachedArray = async <T,>(cacheKey: string): Promise<T[] | null> => {
  const cached = await AsyncStorage.getItem(cacheKey);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed as T[] : null;
  } catch {
    return null;
  }
};

export async function getAsmaUlHusna(forceRefresh = false): Promise<AsmaUlHusnaItem[]> {
  if (!forceRefresh) {
    const cached = await readCachedArray<AsmaUlHusnaItem>(ASMA_CACHE_KEY);
    if (cached?.length) {
      return cached;
    }
  }

  const payload = await fetchJson(`${BASE_URL}/asma-ul-husna`, REQUEST_TIMEOUT_MS);
  assertApiSuccess(payload, 'Unable to load Asma ul Husna');
  const items = extractItems(payload).map(normalizeAsmaItem).filter((item) => item.nameArabic || item.transliteration || item.meaning);
  await AsyncStorage.setItem(ASMA_CACHE_KEY, JSON.stringify(items));
  return items;
}

export async function searchDuas(query: string): Promise<DuaSearchItem[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const cacheKey = `${DUA_SEARCH_CACHE_KEY}_${normalizedQuery.toLowerCase()}`;
  const cached = await readCachedArray<DuaSearchItem>(cacheKey);
  if (cached) {
    return cached;
  }

  const payload = await fetchJson(`${BASE_URL}/duas/search?q=${encodeURIComponent(normalizedQuery)}`, REQUEST_TIMEOUT_MS);
  assertApiSuccess(payload, 'Unable to search duas');
  const items = extractItems(payload).map(normalizeDuaItem).filter((item) => item.title || item.translation || item.arabic);
  await AsyncStorage.setItem(cacheKey, JSON.stringify(items));
  return items;
}
