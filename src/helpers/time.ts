// Timezone helpers for Asia/Bangkok (GMT+7)
// This ensures all date/time operations are consistent across the app

export const TZ_OFFSET = "+07:00"; // Asia/Bangkok
export const BANGKOK_MINUTES = 7 * 60; // 7 hours in minutes

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Compose an ISO string with explicit Bangkok timezone offset
 * This prevents timezone conversion issues when storing in the database
 */
export function composeBangkokIso(date: string, time: string): string {
  // date="2025-09-20", time="19:00"
  return `${date}T${time}:00${TZ_OFFSET}`; // "2025-09-20T19:00:00+07:00"
}

/**
 * Convert ISO string to local input format for datetime-local inputs
 * This ensures the input shows the correct time in GMT+7
 */
export function isoToBangkokLocalInput(iso: string): string {
  const d = new Date(iso); // UTC in memory
  const t = new Date(d.getTime() + BANGKOK_MINUTES * 60000); // shift to GMT+7
  const y = t.getUTCFullYear();
  const m = pad(t.getUTCMonth() + 1);
  const day = pad(t.getUTCDate());
  const hh = pad(t.getUTCHours());
  const mm = pad(t.getUTCMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

/**
 * Format ISO string for display in Asia/Bangkok timezone
 * This ensures all displays show the correct local time
 */
export function formatBangkokLabel(iso: string, options: Intl.DateTimeFormatOptions = {}): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  
  return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options }).format(new Date(iso));
}

/**
 * Format just the date part in Asia/Bangkok timezone
 */
export function formatBangkokDate(iso: string): string {
  return formatBangkokLabel(iso, {
    weekday: undefined,
    hour: undefined,
    minute: undefined,
  });
}

/**
 * Format just the time part in Asia/Bangkok timezone
 */
export function formatBangkokTime(iso: string): string {
  return formatBangkokLabel(iso, {
    weekday: undefined,
    year: undefined,
    month: undefined,
    day: undefined,
  });
}

/**
 * Get current date and time in Asia/Bangkok timezone
 */
export function getCurrentBangkokTime(): Date {
  const now = new Date();
  const bangkokTime = new Date(now.getTime() + (BANGKOK_MINUTES * 60 * 1000));
  return bangkokTime;
}

/**
 * Get today's date string in YYYY-MM-DD format in Asia/Bangkok timezone
 */
export function getTodayBangkok(): string {
  const today = getCurrentBangkokTime();
  return today.toISOString().split('T')[0];
}

/**
 * Get current time string in HH:mm format in Asia/Bangkok timezone
 */
export function getCurrentTimeBangkok(): string {
  const now = getCurrentBangkokTime();
  return now.toTimeString().split(' ')[0].substring(0, 5);
}

/**
 * Parse a datetime-local input value and convert to Bangkok ISO
 * This is used when handling form inputs
 */
export function parseDatetimeLocalToBangkokIso(datetimeLocal: string): string {
  const [date, time] = datetimeLocal.split('T');
  return composeBangkokIso(date, time);
}
