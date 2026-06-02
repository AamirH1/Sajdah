import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getPrayerTimes, PrayerTimeResult } from './prayer';
import type { PrayerOffset } from './prayer';
import type { CalculationMethod, Madhhab } from '../store/useSettings';

const PRAYER_NOTIFICATION_CHANNEL_ID = 'prayer-times';
const PRAYER_NOTIFICATION_ID_PREFIX = 'sajdah-prayer';
const PRAYER_NOTIFICATION_DAYS_TO_SCHEDULE = 7;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

async function ensurePrayerNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(PRAYER_NOTIFICATION_CHANNEL_ID, {
    name: 'Prayer Times',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

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

  await ensurePrayerNotificationChannel();

  return true;
}

const createPrayerNotificationIdentifier = (date: Date, prayerName: string, variant = 'time') =>
  `${PRAYER_NOTIFICATION_ID_PREFIX}:${date.toISOString()}:${prayerName}:${variant}`;

const createDateTrigger = (date: Date): Notifications.DateTriggerInput => ({
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date,
  channelId: PRAYER_NOTIFICATION_CHANNEL_ID,
});

export interface PrayerNotificationSettingsInput {
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
          identifier: createPrayerNotificationIdentifier(earlyTrigger, prayer.name, 'smart-fajr'),
          content: {
            title: 'Fajr Approaching',
            body: 'Fajr prayer is in 5 minutes. Time to prepare.',
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            data: { type: PRAYER_NOTIFICATION_ID_PREFIX, prayer: prayer.name, variant: 'smart-fajr' },
          },
          trigger: createDateTrigger(earlyTrigger),
        });
      }
    }

    await Notifications.scheduleNotificationAsync({
      identifier: createPrayerNotificationIdentifier(trigger, prayer.name),
      content: {
        title: `${prayer.label} Prayer`,
        body: `It's time for ${prayer.label} prayer.`,
        sound: 'default',
        priority: prayer.name === 'fajr'
          ? Notifications.AndroidNotificationPriority.MAX
          : Notifications.AndroidNotificationPriority.HIGH,
        data: { type: PRAYER_NOTIFICATION_ID_PREFIX, prayer: prayer.name, variant: 'time' },
      },
      trigger: createDateTrigger(trigger),
    });
  }
}

export async function schedulePrayerNotificationsFromSettings(
  input: PrayerNotificationSettingsInput,
  options: { requestPermission?: boolean } = {}
): Promise<void> {
  const permissionGranted = options.requestPermission
    ? await requestNotificationPermission()
    : await hasNotificationPermission();

  if (!permissionGranted) {
    throw new Error('Notification permission not granted');
  }

  await ensurePrayerNotificationChannel();
  await cancelPrayerNotifications();

  const today = new Date();

  for (let dayOffset = 0; dayOffset < PRAYER_NOTIFICATION_DAYS_TO_SCHEDULE; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);

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
            identifier: createPrayerNotificationIdentifier(earlyTrigger, prayer.name, 'smart-fajr'),
            content: {
              title: 'Fajr Approaching',
              body: 'Fajr prayer is in 5 minutes. Time to prepare.',
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              data: { type: PRAYER_NOTIFICATION_ID_PREFIX, prayer: prayer.name, variant: 'smart-fajr' },
            },
            trigger: createDateTrigger(earlyTrigger),
          });
        }
      }

      await Notifications.scheduleNotificationAsync({
        identifier: createPrayerNotificationIdentifier(trigger, prayer.name),
        content: {
          title: `${prayer.label} Prayer`,
          body: `It's time for ${prayer.label} prayer.`,
          sound: 'default',
          priority: prayer.name === 'fajr'
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
          data: { type: PRAYER_NOTIFICATION_ID_PREFIX, prayer: prayer.name, variant: 'time' },
        },
        trigger: createDateTrigger(trigger),
      });
    }
  }
}

export async function cancelPrayerNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const prayerNotifications = scheduled.filter((item) => {
    const request = 'request' in item ? item.request : item;
    const identifier = request?.identifier;
    const type = request?.content?.data?.type;
    return identifier?.startsWith(PRAYER_NOTIFICATION_ID_PREFIX) || type === PRAYER_NOTIFICATION_ID_PREFIX;
  });

  await Promise.all(
    prayerNotifications.map((item) => {
      const request = 'request' in item ? item.request : item;
      return request?.identifier
        ? Notifications.cancelScheduledNotificationAsync(request.identifier)
        : Promise.resolve();
    })
  );
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
