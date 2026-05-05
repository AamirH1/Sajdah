import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CalculationMethod = 'Karachi' | 'MuslimWorldLeague' | 'Egyptian' | 'UmmAlQura' | 'Dubai' | 'NorthAmerica';
export type Madhhab = 'Shafi' | 'Hanafi';
export type ThemeMode = 'light' | 'dark' | 'system';
export type QuranScript = 'Madani' | 'IndoPak';
export type TranslationLang = 'english' | 'urdu' | 'hindi' | 'bangla' | 'tamil';

interface PrayerOffset {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

interface NotificationSettings {
  fajr: boolean;
  sunrise: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  smartFajr: boolean;
}

interface Location {
  latitude: number;
  longitude: number;
  city: string;
}

interface SettingsState {
  theme: ThemeMode;
  calculationMethod: CalculationMethod;
  madhhab: Madhhab;
  offsets: PrayerOffset;
  notifications: NotificationSettings;
  location: Location;
  quranScript: QuranScript;
  translationLang: TranslationLang;
  setTheme: (theme: ThemeMode) => void;
  setCalculationMethod: (method: CalculationMethod) => void;
  setMadhhab: (madhhab: Madhhab) => void;
  setOffset: (prayer: keyof PrayerOffset, minutes: number) => void;
  setNotification: (prayer: keyof NotificationSettings, enabled: boolean) => void;
  setLocation: (location: Location) => void;
  setQuranScript: (script: QuranScript) => void;
  setTranslationLang: (lang: TranslationLang) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      calculationMethod: 'Karachi',
      madhhab: 'Hanafi',
      offsets: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      notifications: {
        fajr: true,
        sunrise: false,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
        smartFajr: false,
      },
      location: { latitude: 28.6139, longitude: 77.209, city: 'New Delhi' },
      quranScript: 'IndoPak',
      translationLang: 'english',
      setTheme: (theme) => set({ theme }),
      setCalculationMethod: (calculationMethod) => set({ calculationMethod }),
      setMadhhab: (madhhab) => set({ madhhab }),
      setOffset: (prayer, minutes) =>
        set((state) => ({ offsets: { ...state.offsets, [prayer]: minutes } })),
      setNotification: (prayer, enabled) =>
        set((state) => ({ notifications: { ...state.notifications, [prayer]: enabled } })),
      setLocation: (location) => set({ location }),
      setQuranScript: (script) => set({ quranScript: script }),
      setTranslationLang: (lang) => set({ translationLang: lang }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
