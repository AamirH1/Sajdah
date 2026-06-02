import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getPrayerTimes } from './prayer';
import type { PrayerOffset } from './prayer';
import { PrayerTimeResult } from './prayer';
import type { CalculationMethod, Madhhab } from '../store/useSettings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  return true;
}

export async function scheduleDailyPrayerNotifications(
  prayerTimes: PrayerTimeResult[],
  enabledPrayers: Record<string, boolean>,
  smartFajr: boolean
): Promise<void> {
  const now = new Date();

  for (const prayer of prayerTimes) {
    if (prayer.name === 'sunrise') continue; // Don't notify for sunrise
    if (!enabledPrayers[prayer.name]) continue;
    if (prayer.time <= now) continue; // Skip past prayers

    const trigger = new Date(prayer.time);

    // Smart Fajr: schedule 5 minutes before
    if (prayer.name === 'fajr' && smartFajr) {
      const earlyTrigger = new Date(trigger.getTime() - 5 * 60 * 1000);
      if (earlyTrigger > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Fajr Approaching',
            body: 'Fajr prayer is in 5 minutes. Time to prepare.',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: { date: earlyTrigger, channelId: 'prayer-times' },
        });
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prayer.label} Prayer`,
        body: `It's time for ${prayer.label} prayer.`,
        sound: 'default',
        priority: prayer.name === 'fajr'
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: { date: trigger, channelId: 'prayer-times' },
    });
  }
}

export async function schedulePrayerNotificationsFromSettings(input: {
  latitude: number;
  longitude: number;
  calculationMethod: CalculationMethod;
  madhhab: Madhhab;
  offsets: PrayerOffset;
  notifications: {
    fajr: boolean;
    sunrise: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
    smartFajr: boolean;
  };
}): Promise<void> {
  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) {
    throw new Error('Notification permission not granted');
  }

  await cancelPrayerNotifications();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const date of [today, tomorrow]) {
    const prayerTimes = getPrayerTimes(
      date,
      input.latitude,
      input.longitude,
      input.calculationMethod,
      input.madhhab,
      input.offsets
    );

    const now = new Date();

    for (const prayer of prayerTimes) {
      if (prayer.name === 'sunrise') continue;
      if (!input.notifications[prayer.name]) continue;
      if (date.toDateString() === now.toDateString() && prayer.time <= now) continue;

      const trigger = new Date(prayer.time);

      if (prayer.name === 'fajr' && input.notifications.smartFajr) {
        const earlyTrigger = new Date(trigger.getTime() - 5 * 60 * 1000);
        if (earlyTrigger > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Fajr Approaching',
              body: 'Fajr prayer is in 5 minutes. Time to prepare.',
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: { date: earlyTrigger, channelId: 'prayer-times' },
          });
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayer.label} Prayer`,
          body: `It's time for ${prayer.label} prayer.`,
          sound: 'default',
          priority: prayer.name === 'fajr'
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { date: trigger, channelId: 'prayer-times' },
      });
    }
  }
}

export async function cancelPrayerNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
