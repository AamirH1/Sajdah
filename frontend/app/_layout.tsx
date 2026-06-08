import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '../src/store/useSettings';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { checkOnboardingComplete } from './onboarding';
import { usePrayerNotificationSync } from '../src/hooks/usePrayerNotificationSync';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function OnboardingLaunchGate() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return; // Ensure navigation tree is ready

    let isActive = true;
    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    const verifyOnboarding = async () => {
      const inOnboarding = segments[0] === 'onboarding';

      if (inOnboarding) {
        return;
      }

      const completed = await checkOnboardingComplete();

      if (!completed && isActive) {
        redirectTimeout = setTimeout(() => {
          if (!isActive) return;
          router.replace('/onboarding');
        }, 0);
      }
    };

    verifyOnboarding();

    return () => {
      isActive = false;
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
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
    <SafeAreaProvider>
      {/* SafeAreaProvider supplies Android system navigation insets to the tab bar and screen content. */}
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="quran/[surahId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="azkar/[categoryId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="tasbih" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="about" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="hadith/[bookId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="location" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="hijri" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="asma-ul-husna" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="dua-search" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="islamic-events" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="prayer-times-month" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="zakat" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
      <OnboardingLaunchGate />
    </SafeAreaProvider>
  );
}
