import { CalculationMethod as AppCalcMethod, Madhhab as AppMadhhab } from '../store/useSettings';

export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimeResult {
  name: PrayerName;
  label: string;
  time: Date;
  isNext: boolean;
}

export interface PrayerOffset {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

// Simple prayer time calculation based on solar angles
// Uses approximate formulas for Karachi/Indian subcontinent
function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

function getJulianDay(year: number, month: number, day: number): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function getSunDeclination(jd: number): number {
  const d = jd - 2451545.0;
  const g = toRadians(357.529 + 0.98560028 * d);
  const q = 280.459 + 0.98564736 * d;
  const L = toRadians(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  const e = toRadians(23.439 - 0.00000036 * d);
  return toDegrees(Math.asin(Math.sin(e) * Math.sin(L)));
}

function getEquationOfTime(jd: number): number {
  const d = jd - 2451545.0;
  const g = toRadians(357.529 + 0.98560028 * d);
  const q = 280.459 + 0.98564736 * d;
  const L = toRadians(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  const e = toRadians(23.439 - 0.00000036 * d);
  const RA = toDegrees(Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L))) / 15;
  return (q / 15) - Math.floor((q / 15) / 24) * 24 - RA;
}

function getHourAngle(altitude: number, lat: number, decl: number): number {
  const cosHA = (Math.sin(toRadians(altitude)) - Math.sin(toRadians(lat)) * Math.sin(toRadians(decl))) /
    (Math.cos(toRadians(lat)) * Math.cos(toRadians(decl)));
  if (cosHA > 1) return 0;
  if (cosHA < -1) return 180;
  return toDegrees(Math.acos(cosHA));
}

interface MethodAngles {
  fajr: number;
  isha: number;
}

function getMethodAngles(method: AppCalcMethod): MethodAngles {
  switch (method) {
    case 'Karachi': return { fajr: 18, isha: 18 };
    case 'MuslimWorldLeague': return { fajr: 18, isha: 17 };
    case 'Egyptian': return { fajr: 19.5, isha: 17.5 };
    case 'UmmAlQura': return { fajr: 18.5, isha: 90 }; // isha is 90 min after maghrib
    case 'Dubai': return { fajr: 18.2, isha: 18.2 };
    case 'NorthAmerica': return { fajr: 15, isha: 15 };
    default: return { fajr: 18, isha: 18 };
  }
}

export function getPrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  method: AppCalcMethod,
  madhhab: AppMadhhab,
  offsets?: PrayerOffset
): PrayerTimeResult[] {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const jd = getJulianDay(year, month, day);
  const decl = getSunDeclination(jd);
  const eqt = getEquationOfTime(jd);
  
  // Timezone offset in hours (positive for east)
  const tz = -date.getTimezoneOffset() / 60;
  
  // Dhuhr (solar noon)
  const dhuhr = 12 + tz - longitude / 15 - eqt;
  
  // Sunrise & Sunset
  const sunriseAngle = -0.833;
  const harise = getHourAngle(sunriseAngle, latitude, decl);
  const sunrise = dhuhr - harise / 15;
  const sunset = dhuhr + harise / 15;
  
  // Fajr
  const angles = getMethodAngles(method);
  const haFajr = getHourAngle(-angles.fajr, latitude, decl);
  const fajr = dhuhr - haFajr / 15;
  
  // Asr
  const asrFactor = madhhab === 'Hanafi' ? 2 : 1;
  const asrAlt = toDegrees(Math.atan(1 / (asrFactor + Math.tan(toRadians(Math.abs(latitude - decl))))));
  const haAsr = getHourAngle(asrAlt, latitude, decl);
  const asr = dhuhr + haAsr / 15;
  
  // Maghrib (same as sunset + slight offset)
  const maghrib = sunset;
  
  // Isha
  let isha: number;
  if (method === 'UmmAlQura') {
    isha = maghrib + 1.5; // 90 minutes after maghrib
  } else {
    const haIsha = getHourAngle(-angles.isha, latitude, decl);
    isha = dhuhr + haIsha / 15;
  }
  
  // Convert decimal hours to Date objects
  function hoursToDate(hours: number): Date {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const result = new Date(year, month - 1, day, h, m, 0);
    return result;
  }
  
  const fajrOffset = offsets?.fajr || 0;
  const sunriseOffset = offsets?.sunrise || 0;
  const dhuhrOffset = offsets?.dhuhr || 0;
  const asrOffset = offsets?.asr || 0;
  const maghribOffset = offsets?.maghrib || 0;
  const ishaOffset = offsets?.isha || 0;
  
  const now = new Date();
  
  const prayers: PrayerTimeResult[] = [
    { name: 'fajr', label: 'Fajr', time: new Date(hoursToDate(fajr).getTime() + fajrOffset * 60000), isNext: false },
    { name: 'sunrise', label: 'Sunrise', time: new Date(hoursToDate(sunrise).getTime() + sunriseOffset * 60000), isNext: false },
    { name: 'dhuhr', label: 'Dhuhr', time: new Date(hoursToDate(dhuhr).getTime() + dhuhrOffset * 60000), isNext: false },
    { name: 'asr', label: 'Asr', time: new Date(hoursToDate(asr).getTime() + asrOffset * 60000), isNext: false },
    { name: 'maghrib', label: 'Maghrib', time: new Date(hoursToDate(maghrib).getTime() + maghribOffset * 60000), isNext: false },
    { name: 'isha', label: 'Isha', time: new Date(hoursToDate(isha).getTime() + ishaOffset * 60000), isNext: false },
  ];

  let nextFound = false;
  for (const prayer of prayers) {
    if (!nextFound && prayer.time > now) {
      prayer.isNext = true;
      nextFound = true;
    }
  }
  if (!nextFound && prayers.length > 0) {
    prayers[0].isNext = true;
  }

  return prayers;
}

export function getNextPrayer(
  latitude: number,
  longitude: number,
  method: AppCalcMethod,
  madhhab: AppMadhhab,
  offsets?: PrayerOffset
): PrayerTimeResult | null {
  const today = getPrayerTimes(new Date(), latitude, longitude, method, madhhab, offsets);
  const next = today.find((p) => p.isNext);
  return next || null;
}

export function formatPrayerTime(date: Date): string {
  const hours = date.getHours();
  const mins = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

export function getTimeUntilPrayer(prayerTime: Date): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  let diff = prayerTime.getTime() - now.getTime();

  if (diff < 0) {
    diff += 24 * 60 * 60 * 1000;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}
