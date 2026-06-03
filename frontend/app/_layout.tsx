import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '../src/store/useSettings';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { checkOnboardingComplete } from './onboarding';
import { usePrayerNotificationSync } from '../src/hooks/usePrayerNotificationSync';

function OnboardingLaunchGate() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return; // Ensure navigation tree is ready

    const verifyOnboarding = async () => {
      const inOnboarding = segments[0] === 'onboarding';

      if (inOnboarding) {
        return;
      }

      const completed = await checkOnboardingComplete();

      if (!completed) {
        const timeout = setTimeout(() => {
          router.replace('/onboarding');
        }, 0);
        return () => clearTimeout(timeout);
      }
    };

    const cleanupPromise = verifyOnboarding();
    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [navigationState?.key, router, segments]);

  return null;
}

export default function RootLayout() {
  const { theme } = useSettings();
  const systemScheme = useColorScheme();
  const effectiveTheme = theme === 'system' ? (systemScheme || 'light') : theme;

  usePrayerNotificationSync();

  return (
    <>
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="quran/[surahId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="azkar/[categoryId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="tasbih" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="hadith/[bookId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="location" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="hijri" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="asma-ul-husna" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="dua-search" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="islamic-events" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="prayer-times-month" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
      <OnboardingLaunchGate />
    </>
  );
}
