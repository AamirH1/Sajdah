import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '../src/store/useSettings';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';
import { checkOnboardingComplete } from './onboarding';

export default function RootLayout() {
  const { theme } = useSettings();
  const systemScheme = useColorScheme();
  const effectiveTheme = theme === 'system' ? (systemScheme || 'light') : theme;

  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return; // Ensure navigation tree is ready

    const verifyOnboarding = async () => {
      const completed = await checkOnboardingComplete();
      const inOnboarding = segments[0] === 'onboarding';

      if (!completed && !inOnboarding) {
        router.replace('/onboarding');
      }
    };

    verifyOnboarding();
  }, [navigationState?.key, segments]);

  return (
    <>
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="quran/[surahId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="azkar/[categoryId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="tasbih" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="location" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
    </>
  );
}
