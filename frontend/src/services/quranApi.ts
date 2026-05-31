import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ayah } from '../data/quran';

// Mapping your app's language keys to Alquran.cloud edition identifiers
const EDITIONS: Record<string, string> = {
  english: 'en.sahih',
  urdu: 'ur.jalandhry',
  hindi: 'hi.hindi',
  bangla: 'bn.bengali',
  tamil: 'ta.tamil',
  malayalam: 'ml.abdulhameed',
  telugu: 'te.jaan',
  kannada: 'kn.abdussalam'
};

export async function getSurah(surahId: number, language: string): Promise<Ayah[]> {
  const cacheKey = `surah_cache_${surahId}_${language}`;
  
  try {
    // 1. Check local cache first (Offline Support)
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Fetch from Alquran.cloud API (Uthmani Arabic + Target Translation)
    const edition = EDITIONS[language] || 'en.sahih';
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,${edition}`);
    
    if (!response.ok) throw new Error('Network response was not ok');
    const json = await response.json();

    if (json.code === 200 && json.data && json.data.length === 2) {
      const arabicAyahs = json.data[0].ayahs;
      const translationAyahs = json.data[1].ayahs;

      const ayahs: Ayah[] = arabicAyahs.map((ayah: any, index: number) => ({
        number: ayah.numberInSurah,
        arabic: ayah.text,
        translations: {
          [language]: translationAyahs[index].text
        }
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