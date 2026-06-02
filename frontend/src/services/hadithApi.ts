import AsyncStorage from '@react-native-async-storage/async-storage';

export type HadithCollectionKey = 'bukhari' | 'muslim' | 'abudawud' | 'tirmidhi' | 'ibnmajah' | 'nasai' | 'malik';

export interface HadithCollection {
  key: HadithCollectionKey;
  name: string;
  count?: number;
  hadithCount?: number;
  description?: string;
}

export interface HadithPageResult {
  items: HadithRecord[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface HadithSearchResult {
  items: HadithRecord[];
  totalFound: number;
}

export interface HadithRecord {
  collection: HadithCollectionKey;
  number: string;
  arabic: string;
  translation: string;
  chapter?: string;
  narrator?: string;
  grade?: string;
  source?: string;
  text?: string;
}

interface ApiEnvelope<T> {
  success?: boolean;
  service?: string;
  data?: T;
  timestamp?: string;
}

const BASE_URL = 'https://ummahapi.com/api/hadith';
const COLLECTION_CACHE_KEY = 'hadith_collections_cache_v1';
const SEARCH_CACHE_KEY = 'hadith_search_cache_v2';
const REQUEST_TIMEOUT_MS = 10000;

const cacheKeyForCollection = (collection: HadithCollectionKey, page: number, limit: number) =>
  `hadith_cache_v2_${collection}_${page}_${limit}`;

const cacheKeyForHadith = (collection: HadithCollectionKey, number: string) =>
  `hadith_item_${collection}_${number}`;

const normalizeCollectionKey = (collection: string): HadithCollectionKey => collection as HadithCollectionKey;
const requestTimeout = (ms: number) =>
  new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Hadith request timed out')), ms);
  });

const getTextFromAny = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const candidate = value as Record<string, unknown>;
  return (
    (typeof candidate.arabic === 'string' && candidate.arabic) ||
    (typeof candidate.text === 'string' && candidate.text) ||
    (typeof candidate.hadithArabic === 'string' && candidate.hadithArabic) ||
    (typeof candidate.translation === 'string' && candidate.translation) ||
    (typeof candidate.english === 'string' && candidate.english) ||
    (typeof candidate.hadithEnglish === 'string' && candidate.hadithEnglish) ||
    ''
  );
};

const normalizeHadith = (raw: unknown, fallbackCollection: HadithCollectionKey): HadithRecord => {
  const item = (raw && typeof raw === 'object') ? (raw as Record<string, any>) : {};
  const collection = normalizeCollectionKey(
    item.collection || item.book || item.bookKey || fallbackCollection
  );

  return {
    collection,
    number: String(item.number ?? item.hadithNumber ?? item.hadithnumber ?? item.id ?? item.hadith_id ?? ''),
    arabic: getTextFromAny(item.arabic || item.arabicText || item.textArabic || item.hadithArabic || item),
    translation: getTextFromAny(item.translation || item.english || item.hadithEnglish || item.translations?.en || item),
    chapter: item.chapter || item.chapterName || item.section || item.part || undefined,
    narrator: item.narrator || item.rawi || item.author || undefined,
    grade: item.grade || item.status || item.classification || undefined,
    source: item.source || item.reference || item.bookName || item.collectionName || item.collection_name || undefined,
    text: typeof item.text === 'string' ? item.text : undefined,
  };
};

const normalizeCollection = (raw: unknown): HadithCollection => {
  const item = (raw && typeof raw === 'object') ? (raw as Record<string, any>) : {};
  const key = normalizeCollectionKey(item.key || item.slug || item.collection || item.id || 'bukhari');
  return {
    key,
    name: item.name || item.title || item.collectionName || key,
    count: Number(item.count ?? item.hadithCount ?? item.total ?? item.totalHadiths ?? 0),
    hadithCount: Number(item.hadithCount ?? item.count ?? item.total ?? item.totalHadiths ?? 0),
    description: item.description || item.summary || undefined,
  };
};

const fetchJson = async <T,>(url: string): Promise<ApiEnvelope<T>> => {
  try {
    const response = await Promise.race([
      fetch(url),
      requestTimeout(REQUEST_TIMEOUT_MS),
    ]);

    if (!response || !('ok' in response)) {
      throw new Error('Hadith request failed');
    }

    if (!response.ok) {
      throw new Error(`Hadith request failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    throw error;
  }
};

export async function getHadithCollections(): Promise<HadithCollection[]> {
  const cached = await AsyncStorage.getItem(COLLECTION_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as HadithCollection[];
    } catch {
      // Ignore malformed cache and fall back to network.
    }
  }

  const json = await fetchJson<unknown>(`${BASE_URL}/collections`);
  const rawData = Array.isArray(json.data)
    ? json.data
    : Array.isArray((json.data as any)?.collections)
      ? (json.data as any).collections
      : [];

  const collections = rawData.map(normalizeCollection);
  await AsyncStorage.setItem(COLLECTION_CACHE_KEY, JSON.stringify(collections));
  return collections;
}

export async function getHadithCollection(
  collection: HadithCollectionKey,
  page = 1,
  limit = 25
): Promise<HadithRecord[]> {
  const result = await getHadithCollectionPage(collection, page, limit);
  return result.items;
}

export async function getHadithCollectionPage(
  collection: HadithCollectionKey,
  page = 1,
  limit = 25
): Promise<HadithPageResult> {
  const cacheKey = cacheKeyForCollection(collection, page, limit);
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        const cachedResult = {
          items: parsed as HadithRecord[],
          page,
          limit,
          hasMore: (parsed as HadithRecord[]).length === limit,
        };
        if (page !== 1 || cachedResult.items.length > 0) {
          return cachedResult;
        }
      } else if (Array.isArray(parsed.items) && (page !== 1 || parsed.items.length > 0)) {
        return parsed as HadithPageResult;
      }
    } catch {
      // Ignore malformed cache.
    }
  }

  const json = await fetchJson<unknown>(`${BASE_URL}/${collection}?page=${page}&limit=${limit}`);
  const rawData = Array.isArray(json.data)
    ? json.data
    : Array.isArray((json.data as any)?.hadiths)
      ? (json.data as any).hadiths
      : Array.isArray((json.data as any)?.data)
        ? (json.data as any).data
        : [];

  const hadiths = rawData.map((item: unknown) => normalizeHadith(item, collection));
  const hasMoreFromMeta = (() => {
    const meta = (json.data && typeof json.data === 'object' ? json.data as Record<string, any> : null) || null;
    if (!meta) return undefined;
    if (typeof meta.hasMore === 'boolean') return meta.hasMore;
    if (typeof meta.has_more === 'boolean') return meta.has_more;
    if (typeof meta.nextPage === 'number') return true;
    if (typeof meta.next_page === 'number') return true;
    if (meta.pagination && typeof meta.pagination === 'object') {
      if (typeof meta.pagination.hasMore === 'boolean') return meta.pagination.hasMore;
      if (typeof meta.pagination.has_more === 'boolean') return meta.pagination.has_more;
      if (typeof meta.pagination.currentPage === 'number' && typeof meta.pagination.totalPages === 'number') {
        return meta.pagination.currentPage < meta.pagination.totalPages;
      }
    }
    if (typeof meta.totalPages === 'number' && typeof meta.page === 'number') {
      return meta.page < meta.totalPages;
    }
    return undefined;
  })();

  const totalPages = (json.data && typeof json.data === 'object' ? (json.data as Record<string, any>).total_pages : undefined);
  const hasMore = typeof hasMoreFromMeta === 'boolean'
    ? hasMoreFromMeta
    : typeof totalPages === 'number'
      ? page < totalPages
      : hadiths.length === limit;
  const result: HadithPageResult = { items: hadiths, page, limit, hasMore };
  await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}

export async function getHadith(
  collection: HadithCollectionKey,
  number: string
): Promise<HadithRecord | null> {
  const cacheKey = cacheKeyForHadith(collection, number);
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as HadithRecord;
    } catch {
      // Ignore malformed cache.
    }
  }

  const json = await fetchJson<unknown>(`${BASE_URL}/${collection}/${number}`);
  const payload = Array.isArray(json.data) ? json.data[0] : json.data;
  if (!payload) {
    return null;
  }

  const hadith = normalizeHadith(payload, collection);
  await AsyncStorage.setItem(cacheKey, JSON.stringify(hadith));
  return hadith;
}

export async function getRandomHadith(collection?: HadithCollectionKey): Promise<HadithRecord | null> {
  const collectionParam = collection ? `?collection=${encodeURIComponent(collection)}` : '';

  try {
    const json = await fetchJson<unknown>(`${BASE_URL}/random${collectionParam}`);
    const payload = Array.isArray(json.data) ? json.data[0] : json.data;
    if (!payload) return null;
    return normalizeHadith(payload, collection || 'bukhari');
  } catch (error) {
    console.warn('Random hadith request failed, falling back to collection page:', error);

    if (!collection) {
      return null;
    }

    try {
      const fallback = await getHadithCollectionPage(collection, 1, 1);
      return fallback.items[0] || null;
    } catch (fallbackError) {
      console.warn('Random hadith fallback failed:', fallbackError);
      return null;
    }
  }
}

export async function searchHadiths(query: string, collection?: HadithCollectionKey, limit = 25): Promise<HadithSearchResult> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return { items: [], totalFound: 0 };

  const cacheKey = `${SEARCH_CACHE_KEY}_${collection || 'all'}_${limit}_${normalizedQuery}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return { items: parsed as HadithRecord[], totalFound: parsed.length };
      }
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, any>).items)) {
        const cachedResult = parsed as Record<string, any>;
        return {
          items: cachedResult.items as HadithRecord[],
          totalFound: Number(cachedResult.totalFound ?? cachedResult.total_found ?? cachedResult.items.length ?? 0),
        };
      }
    } catch {
      // Ignore malformed cache and fall back to the network.
    }
  }

  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (collection) {
    params.set('collection', collection);
  }

  const json = await fetchJson<unknown>(`${BASE_URL}/search?${params.toString()}`);
  const searchData = json.data && typeof json.data === 'object' ? (json.data as Record<string, any>) : null;
  const rawData = Array.isArray(json.data)
    ? json.data
    : Array.isArray(searchData?.hadiths)
      ? searchData.hadiths
    : Array.isArray(searchData?.results)
      ? searchData.results
      : Array.isArray(searchData?.items)
        ? searchData.items
        : Array.isArray(searchData?.data)
          ? searchData.data
        : [];

  const results = rawData.map((item: unknown) => normalizeHadith(item, collection || 'bukhari'));
  const totalFound = Number(
    searchData?.total_found ??
      searchData?.totalFound ??
      searchData?.total ??
      searchData?.count ??
      results.length
  );
  const result = { items: results, totalFound };
  await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}
