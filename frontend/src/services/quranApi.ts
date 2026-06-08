import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ayah } from '../data/quran';
import type { TranslationLang } from '../store/useSettings';
import { assertApiSuccess, fetchJson } from './http';

type QuranTranslationLang = Exclude<TranslationLang, 'gujarati'>;

const LANGUAGE_CODES: Record<QuranTranslationLang, string> = {
  english: 'en',
  urdu: 'ur',
  hindi: 'hi',
  bangla: 'bn',
  tamil: 'ta',
  malayalam: 'ml',
  telugu: 'te',
  kannada: 'kn',
};

const PREFERRED_EDITIONS: Record<QuranTranslationLang, string[]> = {
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

export function isQuranTranslationLanguageSupported(language: TranslationLang): language is QuranTranslationLang {
  return language !== 'gujarati';
}

async function resolveEdition(language: QuranTranslationLang): Promise<string> {
  const cacheKey = `${EDITION_CACHE_PREFIX}_${language}`;
  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) return cached;

  const languageCode = LANGUAGE_CODES[language] || 'en';
  const preferred = PREFERRED_EDITIONS[language] || PREFERRED_EDITIONS.english;

  try {
    const json = await fetchJson(`https://api.alquran.cloud/v1/edition/language/${languageCode}`, 12000) as { data?: ApiEdition[] };
    assertApiSuccess(json, 'Unable to load Quran translations');
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
  const quranLanguage = isQuranTranslationLanguageSupported(language) ? language : 'english';
  const cacheKey = `surah_cache_${surahId}_${quranLanguage}`;
  
  try {
    // 1. Check local cache first (Offline Support)
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Fetch from Alquran.cloud API (Uthmani Arabic + Target Translation)
    const edition = await resolveEdition(quranLanguage);
    const json = await fetchJson(`https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,${edition}`, 12000) as { code?: number; data?: ApiSurahEdition[] };
    assertApiSuccess(json, 'Unable to load Quran surah');

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
          [quranLanguage]: translationAyahs[index]?.text || translationAyahs[0]?.text || '',
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
