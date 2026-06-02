import { useEffect } from 'react';
import { cancelPrayerNotifications, hasNotificationPermission, schedulePrayerNotificationsFromSettings } from '../services/notifications';
import { useSettings } from '../store/useSettings';

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function usePrayerNotificationSync() {
  const {
    hasHydrated,
    location,
    calculationMethod,
    madhhab,
    offsets,
    notifications,
  } = useSettings();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    let active = true;

    const sync = async () => {
      const hasEnabledReminder = PRAYER_KEYS.some((prayer) => notifications[prayer]);

      if (!hasEnabledReminder) {
        await cancelPrayerNotifications();
        return;
      }

      const permissionGranted = await hasNotificationPermission();
      if (!permissionGranted) {
        return;
      }

      await schedulePrayerNotificationsFromSettings({
        latitude: location.latitude,
        longitude: location.longitude,
        calculationMethod,
        madhhab,
        offsets,
        notifications,
      });
    };

    sync().catch((error) => {
      if (active) {
        console.warn('Unable to sync prayer notifications:', error);
      }
    });

    return () => {
      active = false;
    };
  }, [
    hasHydrated,
    location.latitude,
    location.longitude,
    calculationMethod,
    madhhab,
    offsets,
    notifications,
  ]);
}
