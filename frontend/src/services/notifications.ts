import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PrayerTimeResult } from './prayer';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
  // Cancel existing notifications first
  await cancelPrayerNotifications();

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

export async function cancelPrayerNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
