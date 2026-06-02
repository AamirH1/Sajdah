import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../store/useSettings';
import { useTasbih } from '../store/useTasbih';

// Android emulator requires 10.0.2.2 to access host machine's localhost
const getBaseUrl = () => {
  // Note: If you are testing on a physical device over Wi-Fi, 
  // replace this with your computer's local IP address (e.g., 'http://192.168.1.100:8000/api')
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getBaseUrl();

const DEVICE_ID_KEY = 'sajdah_device_id';

// Fallback UUID generator if crypto is unavailable
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export interface StatusCheck {
  id: string;
  client_name: string;
  device_id?: string;
  timestamp: string;
}

export interface SyncPayload {
  device_id: string;
  client_name: string;
  settings: {
    theme: string;
    calculationMethod: string;
    madhhab: string;
    offsets: {
      fajr: number;
      sunrise: number;
      dhuhr: number;
      asr: number;
      maghrib: number;
      isha: number;
    };
    notifications: {
      fajr: boolean;
      sunrise: boolean;
      dhuhr: boolean;
      asr: boolean;
      maghrib: boolean;
      isha: boolean;
      smartFajr: boolean;
    };
    location: { latitude: number; longitude: number; city: string };
    quranScript: string;
    translationLang: string;
  };
  tasbih: {
    counters: Array<{ id: string; name: string; count: number; target: number; lastUsed: string }>;
    activeCounterId: string | null;
  };
}

export interface SyncResponse {
  id: string;
  device_id: string;
  timestamp: string;
  backup_size: number;
}

export const pingBackend = async (): Promise<StatusCheck> => {
  try {
    const deviceId = await getDeviceId();
    const response = await fetch(`${API_BASE_URL}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-ID': deviceId },
      body: JSON.stringify({ client_name: `Sajdah-${Platform.OS}`, device_id: deviceId }),
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error("Backend connection error:", error);
    throw error;
  }
};

export const syncBackup = async (): Promise<SyncResponse> => {
  try {
    const deviceId = await getDeviceId();
    const settingsState = useSettings.getState();
    const tasbihState = useTasbih.getState();
    const payload: SyncPayload = {
      device_id: deviceId,
      client_name: `Sajdah-${Platform.OS}`,
      settings: {
        theme: settingsState.theme,
        calculationMethod: settingsState.calculationMethod,
        madhhab: settingsState.madhhab,
        offsets: settingsState.offsets,
        notifications: settingsState.notifications,
        location: settingsState.location,
        quranScript: settingsState.quranScript,
        translationLang: settingsState.translationLang,
      },
      tasbih: {
        counters: tasbihState.counters,
        activeCounterId: tasbihState.activeCounterId,
      },
    };

    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Backup request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Sync backup error:', error);
    throw error;
  }
};
