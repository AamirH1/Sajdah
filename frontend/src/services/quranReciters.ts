import AsyncStorage from '@react-native-async-storage/async-storage';
import { assertApiSuccess, fetchJson } from './http';

const RECITERS_CACHE_KEY = 'quran_reciters_cache_v1';
const BASE_URL = 'https://ummahapi.com/api/quran';
const REQUEST_TIMEOUT_MS = 10000;

export interface QuranReciter {
  id: number;
  name: string;
  arabicName?: string;
  style?: string;
  nationality?: string;
  image?: string;
  sampleUrl?: string;
  fallbackServer?: string;
  fallbackPath?: string;
}

const RECITER_AUDIO_FALLBACKS: Record<number, Pick<QuranReciter, 'fallbackServer' | 'fallbackPath'>> = {
  1: { fallbackServer: 'server8', fallbackPath: 'afs' },
  2: { fallbackServer: 'server11', fallbackPath: 'sds' },
  3: { fallbackServer: 'server7', fallbackPath: 'basit' },
  4: { fallbackServer: 'server7', fallbackPath: 'basitmjwd' },
  6: { fallbackServer: 'server7', fallbackPath: 's_gmd' },
  8: { fallbackServer: 'server11', fallbackPath: 'shatri' },
  10: { fallbackServer: 'server7', fallbackPath: 'shur' },
};

const normalizeReciter = (item: unknown): QuranReciter => {
  const data = (item && typeof item === 'object') ? (item as Record<string, any>) : {};
  const id = Number(data.id ?? data.reciter_id ?? data.reciterId ?? 0);
  const fallback = RECITER_AUDIO_FALLBACKS[id];

  return {
    id,
    name: data.name || data.reciter || data.reciter_name || data.title || 'Unknown Reciter',
    arabicName: data.arabicName || data.arabic_name || data.name_ar || data.arabic || undefined,
    style: data.style || data.qiraah || data.reading || undefined,
    nationality: data.nationality || data.country || undefined,
    image: data.image || data.logo || data.avatar || undefined,
    sampleUrl: data.url || data.sampleUrl || data.sample_url || undefined,
    fallbackServer: data.server || data.host || fallback?.fallbackServer,
    fallbackPath: data.path || data.folder || data.slug || data.code || fallback?.fallbackPath,
  };
};

export async function getQuranReciters(forceRefresh = false): Promise<QuranReciter[]> {
  if (!forceRefresh) {
    const cached = await AsyncStorage.getItem(RECITERS_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as QuranReciter[];
      } catch {
        // Fall through to network.
      }
    }
  }

  const json = await fetchJson<Record<string, any>>(`${BASE_URL}/reciters`, REQUEST_TIMEOUT_MS, {
    cacheKey: RECITERS_CACHE_KEY,
    cacheTtlMs: 30 * 24 * 60 * 60 * 1000,
  });
  assertApiSuccess(json, 'Unable to load reciters');
  const rawData = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.data?.reciters)
      ? json.data.reciters
      : Array.isArray(json?.reciters)
        ? json.reciters
        : [];

  const reciters = rawData
    .map(normalizeReciter)
    .filter((reciter: QuranReciter) => reciter.id > 0 && reciter.name);
  await AsyncStorage.setItem(RECITERS_CACHE_KEY, JSON.stringify(reciters));
  return reciters;
}

const getSurahAudioPayload = async (surahId: number, reciterId: number): Promise<any> => {
  const payload = await fetchJson<Record<string, any>>(`${BASE_URL}/audio/${surahId}?reciter=${reciterId}`, REQUEST_TIMEOUT_MS, {
    cacheKey: `quran_audio_${surahId}_${reciterId}`,
    cacheTtlMs: 30 * 24 * 60 * 60 * 1000,
  });
  assertApiSuccess(payload, 'Unable to load reciter audio');
  return payload;
};

const addUrl = (urls: string[], value: unknown) => {
  if (typeof value === 'string' && value.startsWith('http') && !urls.includes(value)) {
    urls.push(value);
  }
};

const extractAudioUrls = (payload: any): string[] => {
  if (!payload) return [];
  if (typeof payload === 'string') return payload.startsWith('http') ? [payload] : [];
  if (Array.isArray(payload)) {
    const urls: string[] = [];
    for (const item of payload) {
      for (const url of extractAudioUrls(item)) {
        addUrl(urls, url);
      }
    }
    return urls;
  }
  if (typeof payload !== 'object') return [];

  const data = payload as Record<string, any>;
  const urls: string[] = [];
  const directCandidates = [
    data.url,
    data.audioUrl,
    data.audio_url,
    data.audio_url_mp3,
    data.fullSurahAudio,
    data.full_surah_audio,
    data.streamUrl,
    data.stream_url,
    data.audioUrlFull,
    data.audio_url_full,
    data.audio_url_full_surah,
    data.audio_url_surah,
    data.audio_url_verse,
    data.audio_url_ayah,
    data.audioUrlAyah,
    data.audio,
    data.src,
    data.file,
    data.path,
  ];
  for (const candidate of directCandidates) {
    addUrl(urls, candidate);
  }

  if (Array.isArray(data.data)) {
    for (const url of extractAudioUrls(data.data)) addUrl(urls, url);
  }

  if (Array.isArray(data.audio)) {
    for (const url of extractAudioUrls(data.audio)) addUrl(urls, url);
  }

  if (Array.isArray(data.ayah_by_ayah)) {
    for (const url of extractAudioUrls(data.ayah_by_ayah)) addUrl(urls, url);
  }

  if (Array.isArray(data.ayahs)) {
    for (const url of extractAudioUrls(data.ayahs)) addUrl(urls, url);
  }

  if (data.audio && typeof data.audio === 'object') {
    for (const url of extractAudioUrls(data.audio)) addUrl(urls, url);
  }

  if (data.reciters && typeof data.reciters === 'object') {
    for (const url of extractAudioUrls(data.reciters)) addUrl(urls, url);
  }

  return urls;
};

export async function getSurahAudioUrls(surahId: number, reciter: QuranReciter): Promise<string[]> {
  const urls: string[] = [];

  try {
    const payload = await getSurahAudioPayload(surahId, reciter.id);
    for (const url of extractAudioUrls(payload?.data ?? payload)) {
      addUrl(urls, url);
    }
  } catch (error) {
    console.warn('UmmahAPI audio lookup failed, trying fallback:', error);
  }

  if (reciter.fallbackServer && reciter.fallbackPath) {
    const paddedId = String(surahId).padStart(3, '0');
    addUrl(urls, `https://${reciter.fallbackServer}.mp3quran.net/${reciter.fallbackPath}/${paddedId}.mp3`);
  }

  return urls;
}

export async function getSurahAudioUrl(surahId: number, reciter: QuranReciter): Promise<string | null> {
  const urls = await getSurahAudioUrls(surahId, reciter);
  return urls[0] || null;
}
