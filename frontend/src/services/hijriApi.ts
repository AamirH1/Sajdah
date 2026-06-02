import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://ummahapi.com/api';
const REQUEST_TIMEOUT_MS = 10000;
const TODAY_CACHE_KEY = 'hijri_today_cache_v1';
const CONVERT_CACHE_PREFIX = 'hijri_convert_cache_v1';
const ISLAMIC_MONTH_NAMES = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Sha\'ban',
  'Ramadan',
  'Shawwal',
  'Dhul Qa\'dah',
  'Dhul Hijjah',
];

const ISLAMIC_MONTH_DESCRIPTIONS: Record<number, string> = {
  1: 'Muharram is the first month of the Hijri year and one of the four sacred months, named because pre-Islamic Arabs prohibited fighting during it.',
  2: 'Safar is traditionally linked to people leaving their homes for travel or battle, and some accounts connect it to escaping the summer heat.',
  3: 'Rabi al-Awwal is named because it usually coincided with the spring season.',
  4: 'Rabi al-Thani is the second Rabi month and is named because it usually coincided with the winter season.',
  5: 'Jumada al-Awwal is named because it aligned with winter conditions when water would freeze.',
  6: 'Jumada al-Thani is the second Jumada month and is named because it coincided with winter.',
  7: 'Rajab comes from the idea of sanctifying the month, and it is one of the four sacred months in Islam.',
  8: 'Sha ban is derived from the idea of going in different directions, historically tied to tribes dispersing for conflict or travel.',
  9: 'Ramadan is the holy month of fasting in Islam, a month devoted to prayer, Qur’an recitation, and spiritual reflection.',
  10: 'Shawwal follows Ramadan and begins with Eid al-Fitr; its name is linked to a scarcity of milk in she-camels.',
  11: 'Dhu al-Qa dah is one of the sacred months, historically a time when Arabs refrained from fighting and prepared for pilgrimage.',
  12: 'Dhu al-Hijjah is the month of Hajj, the annual pilgrimage to Makkah, and the season of Eid al-Adha.',
};

export interface HijriDateResult {
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  hijriMonthName?: string;
  gregorianDate?: string;
  source: 'api' | 'cache';
}

export interface IslamicMonth {
  month: number;
  name: string;
  significance?: string;
}

interface ApiEnvelope<T> {
  success?: boolean;
  service?: string;
  data?: T;
  timestamp?: string;
}

const fetchJson = async <T,>(url: string): Promise<ApiEnvelope<T>> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Hijri request failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Hijri request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeHijriDate = (payload: unknown): HijriDateResult | null => {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Record<string, any>;
  const source = data.data && typeof data.data === 'object' ? (data.data as Record<string, any>) : data;

  const hijri =
    source.hijri ||
    source.islamic ||
    source.data?.hijri ||
    source.data?.islamic;

  if (hijri && typeof hijri === 'object') {
    const h = hijri as Record<string, any>;
    return {
      hijriDay: Number(h.day ?? h.hijriDay ?? h.hday ?? 0),
      hijriMonth: Number(h.month ?? h.hijriMonth ?? h.hmonth ?? 0),
      hijriYear: Number(h.year ?? h.hijriYear ?? h.hyear ?? 0),
      hijriMonthName: h.monthName || h.month_name || h.monthNameEn || h.month_en || undefined,
      gregorianDate: h.gregorian || h.gregorianDate || h.date || undefined,
      source: 'api',
    };
  }

  const directDay = Number(source.day ?? source.hijriDay ?? source.hday ?? 0);
  const directMonth = Number(source.month ?? source.hijriMonth ?? source.hmonth ?? 0);
  const directYear = Number(source.year ?? source.hijriYear ?? source.hyear ?? 0);

  if (Number.isFinite(directDay) && Number.isFinite(directMonth) && Number.isFinite(directYear) && directDay > 0 && directMonth > 0 && directYear > 0) {
    return {
      hijriDay: directDay,
      hijriMonth: directMonth,
      hijriYear: directYear,
      hijriMonthName: source.monthName || source.month_name || undefined,
      gregorianDate: source.gregorian || source.gregorianDate || source.date || undefined,
      source: 'api',
    };
  }

  return null;
};

const getMonthNameFromResponse = (payload: unknown): IslamicMonth[] => {
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as Record<string, any>;
  const raw = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.data?.months)
      ? data.data.months
      : Array.isArray(data.months)
        ? data.months
        : [];

  return raw.map((item: unknown, index: number) => {
    const month = (item && typeof item === 'object') ? (item as Record<string, any>) : {};
    const monthNumber = Number(month.month ?? month.number ?? index + 1);
    const fallbackName = ISLAMIC_MONTH_NAMES[Math.max(0, Math.min(ISLAMIC_MONTH_NAMES.length - 1, monthNumber - 1))];
    const rawName = String(month.name ?? month.monthName ?? month.arabicName ?? month.title ?? '').trim();
    const isPlaceholderName = /^month\s*\d+$/i.test(rawName);
    return {
      month: monthNumber,
      name: rawName && !isPlaceholderName ? rawName : fallbackName,
      significance: month.significance || month.description || month.meaning || ISLAMIC_MONTH_DESCRIPTIONS[monthNumber] || undefined,
    } as IslamicMonth;
  });
};

const normalizeIslamicMonth = (month: unknown, index: number): IslamicMonth => {
  const raw = (month && typeof month === 'object') ? (month as Record<string, any>) : {};
  const monthNumber = Number(raw.month ?? raw.number ?? index + 1);
  const fallbackName = ISLAMIC_MONTH_NAMES[Math.max(0, Math.min(ISLAMIC_MONTH_NAMES.length - 1, monthNumber - 1))];
  const rawName = String(raw.name ?? raw.monthName ?? raw.arabicName ?? raw.title ?? '').trim();
  const isPlaceholderName = /^month\s*\d+$/i.test(rawName);
  const fallbackDescription = ISLAMIC_MONTH_DESCRIPTIONS[monthNumber];
  const rawDescription = String(raw.significance ?? raw.description ?? raw.meaning ?? '').trim();
  const isPlaceholderDescription =
    !rawDescription ||
    /^no description available\.?$/i.test(rawDescription) ||
    /^month\s*\d+$/i.test(rawDescription) ||
    /^\w+\s+month of the islamic calendar\.?$/i.test(rawDescription) ||
    /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+month of the islamic calendar\.?$/i.test(rawDescription);

  return {
    month: monthNumber,
    name: rawName && !isPlaceholderName ? rawName : fallbackName,
    significance: !isPlaceholderDescription ? rawDescription : fallbackDescription,
  };
};

export async function getTodayHijri(forceRefresh = false): Promise<HijriDateResult> {
  if (!forceRefresh) {
    const cached = await AsyncStorage.getItem(TODAY_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as HijriDateResult;
      } catch {
        // Ignore malformed cache.
      }
    }
  }

  const json = await fetchJson<unknown>(`${BASE_URL}/today-hijri`);
  const normalized = normalizeHijriDate(json.data ?? json);
  if (!normalized) {
    throw new Error('Unable to parse Hijri date response');
  }

  await AsyncStorage.setItem(TODAY_CACHE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function convertGregorianToHijri(date: Date, forceRefresh = false): Promise<HijriDateResult> {
  const dateKey = date.toISOString().slice(0, 10);
  const cacheKey = `${CONVERT_CACHE_PREFIX}_${dateKey}`;

  if (!forceRefresh) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as HijriDateResult;
      } catch {
        // Ignore malformed cache.
      }
    }
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const json = await fetchJson<unknown>(`${BASE_URL}/hijri-date?date=${encodeURIComponent(`${yyyy}-${mm}-${dd}`)}`);
  const normalized = normalizeHijriDate(json.data ?? json);
  if (!normalized) {
    throw new Error('Unable to parse Hijri conversion response');
  }

  await AsyncStorage.setItem(cacheKey, JSON.stringify(normalized));
  return normalized;
}

export async function getIslamicMonths(forceRefresh = false): Promise<IslamicMonth[]> {
  const cacheKey = 'hijri_months_cache_v2';

  if (!forceRefresh) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as unknown[];
        return Array.isArray(parsed) ? parsed.map((month, index) => normalizeIslamicMonth(month, index)) : [];
      } catch {
        // Ignore malformed cache.
      }
    }
  }

  const json = await fetchJson<unknown>(`${BASE_URL}/islamic-months`);
  const months = getMonthNameFromResponse(json.data ?? json).map((month, index) => normalizeIslamicMonth(month, index));
  if (months.length > 0) {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(months));
  }
  return months;
}
