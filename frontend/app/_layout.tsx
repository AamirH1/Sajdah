import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '../src/store/useSettings';
import { useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_complete';

export default function RootLayout() {
  const { theme } = useSettings();
  const systemScheme = useColorScheme();
  const effectiveTheme = theme === 'system' ? (systemScheme || 'light') : theme;
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setNeedsOnboarding(value !== 'true');
      } catch {
        setNeedsOnboarding(true);
      }
      setIsReady(true);
    }
    check();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const inOnboarding = segments[0] === 'onboarding';

    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    }
  }, [isReady, needsOnboarding, segments]);

  return (
    <>
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quran/[surahId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="azkar/[categoryId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="tasbih" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="location" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
    </>
  );
}
