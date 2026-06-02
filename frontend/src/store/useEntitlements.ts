import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Plan = 'free' | 'pro';

export interface FeatureFlags {
  'quran.multipleLanguages': boolean;
  'prayer.smartFajrAlarm': boolean;
  'ui.themes.pro': boolean;
  'quran.advancedBookmarks': boolean;
  'azkar.customCollections': boolean;
  'dua.asmaUlHusnaTranslations': boolean;
}

const FREE_FLAGS: FeatureFlags = {
  'quran.multipleLanguages': false,
  'prayer.smartFajrAlarm': false,
  'ui.themes.pro': false,
  'quran.advancedBookmarks': false,
  'azkar.customCollections': false,
  'dua.asmaUlHusnaTranslations': false,
};

const PRO_FLAGS: FeatureFlags = {
  'quran.multipleLanguages': true,
  'prayer.smartFajrAlarm': true,
  'ui.themes.pro': true,
  'quran.advancedBookmarks': true,
  'azkar.customCollections': true,
  'dua.asmaUlHusnaTranslations': true,
};

interface EntitlementsState {
  plan: Plan;
  featureFlags: FeatureFlags;
  togglePlan: () => void;
}

export const useEntitlements = create<EntitlementsState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      featureFlags: FREE_FLAGS,
      togglePlan: () => {
        const currentPlan = get().plan;
        const newPlan: Plan = currentPlan === 'free' ? 'pro' : 'free';
        set({
          plan: newPlan,
          featureFlags: newPlan === 'pro' ? PRO_FLAGS : FREE_FLAGS,
        });
      },
    }),
    {
      name: 'entitlements-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper hook to check feature access
export function useCanUse(featureKey: keyof FeatureFlags): boolean {
  const featureFlags = useEntitlements((state) => state.featureFlags);
  return featureFlags[featureKey];
}
