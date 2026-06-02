import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ayah } from '../data/quran';
import type { TranslationLang } from '../store/useSettings';

const LANGUAGE_CODES: Record<TranslationLang, string> = {
  english: 'en',
  urdu: 'ur',
  hindi: 'hi',
  bangla: 'bn',
  tamil: 'ta',
  malayalam: 'ml',
  telugu: 'te',
  kannada: 'kn',
};

const PREFERRED_EDITIONS: Record<TranslationLang, string[]> = {
  english: ['en.sahih', 'en.asad', 'en.pickthall'],
  urdu: ['ur.jalandhry', 'ur.jawadi', 'ur.kanzuliman', 'ur.qadri', 'ur.junagarhi', 'ur.maududi', 'ur.ahmedali'],
  hindi: ['hi.hindi', 'hi.farooq'],
  bangla: ['bn.bengali'],
  tamil: ['ta.tamil'],
  malayalam: ['ml.abdulhameed'],
  telugu: ['te.jaan'],
  kannada: ['kn.abdussalam'],
};

interface ApiEdition {
  identifier?: string;
  type?: string;
  format?: string;
  language?: string;
}

interface ApiAyah {
  numberInSurah?: number;
  text?: string;
}

interface ApiSurahEdition {
  edition?: { identifier?: string };
  ayahs?: ApiAyah[];
}

const EDITION_CACHE_PREFIX = 'quran_edition_cache_v1';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function resolveEdition(language: TranslationLang): Promise<string> {
  const cacheKey = `${EDITION_CACHE_PREFIX}_${language}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return cached;

  const languageCode = LANGUAGE_CODES[language] || 'en';
  const preferred = PREFERRED_EDITIONS[language] || PREFERRED_EDITIONS.english;

  try {
    const json = await fetchJson<{ data?: ApiEdition[] }>(`https://api.alquran.cloud/v1/edition/language/${languageCode}`);
    const editions = Array.isArray(json.data) ? json.data : [];
    const translationEditions = editions.filter((edition) =>
      typeof edition.identifier === 'string' &&
      (edition.type === 'translation' || !edition.type) &&
      (edition.format === 'text' || !edition.format)
    );

    const preferredMatch = preferred.find((identifier) =>
      translationEditions.some((edition) => edition.identifier === identifier)
    );

    const resolved = preferredMatch || translationEditions[0]?.identifier || preferred[0];
    await AsyncStorage.setItem(cacheKey, resolved);
    return resolved;
  } catch {
    return preferred[0];
  }
}

export async function getSurah(surahId: number, language: TranslationLang): Promise<Ayah[]> {
  const cacheKey = `surah_cache_${surahId}_${language}`;
  
  try {
    // 1. Check local cache first (Offline Support)
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Fetch from Alquran.cloud API (Uthmani Arabic + Target Translation)
    const edition = await resolveEdition(language);
    const json = await fetchJson<{ code?: number; data?: ApiSurahEdition[] }>(
      `https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,${edition}`
    );

    const editions = Array.isArray(json.data) ? json.data : [];
    const arabicEdition = editions.find((entry) => entry.edition?.identifier === 'quran-uthmani') || editions[0];
    const translationEdition = editions.find((entry) => entry.edition?.identifier === edition) || editions[1];

    const arabicAyahs = arabicEdition?.ayahs || [];
    const translationAyahs = translationEdition?.ayahs || [];

    if (arabicAyahs.length > 0 && translationAyahs.length > 0) {
      const ayahs: Ayah[] = arabicAyahs.map((ayah, index) => ({
        number: ayah.numberInSurah || index + 1,
        arabic: ayah.text || '',
        translations: {
          [language]: translationAyahs[index]?.text || translationAyahs[0]?.text || '',
        },
      }));

      // 3. Save to cache for future offline reading
      await AsyncStorage.setItem(cacheKey, JSON.stringify(ayahs));
      return ayahs;
    }
    throw new Error('Invalid API response structure');
  } catch (error) {
    console.error(`Error fetching Surah ${surahId}:`, error);
    // 4. Fallback to hardcoded local data if offline and uncached
    const { SURAH_DATA } = await import('../data/quran');
    return SURAH_DATA[surahId] || [];
  }
}
