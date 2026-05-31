import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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