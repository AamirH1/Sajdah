import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Plan = 'free' | 'pro';

interface FeatureFlags {
  'quran.multipleLanguages': boolean;
  'prayer.smartFajrAlarm': boolean;
  'ui.themes.pro': boolean;
  'quran.advancedBookmarks': boolean;
  'azkar.customCollections': boolean;
}

const FREE_FLAGS: FeatureFlags = {
  'quran.multipleLanguages': false,
  'prayer.smartFajrAlarm': false,
  'ui.themes.pro': false,
  'quran.advancedBookmarks': false,
  'azkar.customCollections': false,
};

const PRO_FLAGS: FeatureFlags = {
  'quran.multipleLanguages': true,
  'prayer.smartFajrAlarm': true,
  'ui.themes.pro': true,
  'quran.advancedBookmarks': true,
  'azkar.customCollections': true,
};

interface EntitlementsState {
  plan: Plan;
  featureFlags: FeatureFlags;
  togglePlan: () => void;
  canUse: (featureKey: keyof FeatureFlags) => boolean;
}

export const useEntitlements = create<EntitlementsState>()(
  persist(
    (set, get) => ({
      plan: 'free',
      featureFlags: FREE_FLAGS,
      togglePlan: () => {
        const newPlan = get().plan === 'free' ? 'pro' : 'free';
        set({
          plan: newPlan,
          featureFlags: newPlan === 'pro' ? PRO_FLAGS : FREE_FLAGS,
        });
      },
      canUse: (featureKey: keyof FeatureFlags) => {
        return get().featureFlags[featureKey];
      },
    }),
    {
      name: 'entitlements-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
