import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '../src/store/useSettings';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const { theme } = useSettings();
  const systemScheme = useColorScheme();
  const effectiveTheme = theme === 'system' ? (systemScheme || 'light') : theme;

  return (
    <>
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quran/[surahId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="azkar/[categoryId]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="tasbih" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
    </>
  );
}
