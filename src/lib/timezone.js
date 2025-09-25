// Timezone utilities for GMT+7 (Vietnam timezone)
// This ensures all date/time operations are consistent across the app

const GMT_PLUS_7_OFFSET = 7 * 60; // 7 hours in minutes

/**
 * Convert a date string (YYYY-MM-DD) and time string (HH:mm) to ISO string in GMT+7
 * This prevents timezone shifts when storing dates in the database
 */
export function toIsoInGMT7(dateString, timeString) {
  if (!dateString || !timeString) return ''
  
  // Create date in GMT+7 by manually adjusting for the timezone offset
  const [year, month, day] = dateString.split("-".map(n => parseInt(n, 10))
  const [hours, minutes] = timeString.split(":".map(n => parseInt(n, 10))
  
  // Create date object in local time, then adjust for GMT+7
  const localDate = new Date(year, month - 1, day, hours, minutes, 0)
  
  // Get the local timezone offset and adjust to GMT+7
  const localOffset = localDate.getTimezoneOffset() // minutes
  const gmt7Offset = -GMT_PLUS_7_OFFSET // GMT+7 is -420 minutes from UTC
  const totalOffset = localOffset - gmt7Offset
  
  // Apply the offset to get the correct UTC time that represents GMT+7
  const utcDate = new Date(localDate.getTime() - (totalOffset * 60 * 1000))
  
  return utcDate.toISOString()
}

/**
 * Parse an ISO string and return a Date object that represents the time in GMT+7
 * This is used for displaying dates consistently
 */
export function parseFromGMT7(isoString) {
  if (!isoString || typeof isoString !== 'string') return new Date(NaN)
  
  // Parse the ISO string as UTC
  const utcDate = new Date(isoString)
  
  // Adjust to GMT+7 by adding 7 hours
  const gmt7Date = new Date(utcDate.getTime() + (GMT_PLUS_7_OFFSET * 60 * 1000))
  
  return gmt7Date
}

/**
 * Format a date for display in GMT+7
 */
export function formatDateTimeGMT7(isoString, options = {}) {
  const date = parseFromGMT7(isoString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  
  const defaultOptions = {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh' // Vietnam timezone
  }
  
  return date.toLocaleString('en-US', { ...defaultOptions, ...options })
}

/**
 * Format just the date part in GMT+7
 */
export function formatDateGMT7(isoString) {
  return formatDateTimeGMT7(isoString, {
    weekday: undefined,
    hour: undefined,
    minute: undefined
  })
}

/**
 * Format just the time part in GMT+7
 */
export function formatTimeGMT7(isoString) {
  return formatDateTimeGMT7(isoString, {
    weekday: undefined,
    day: undefined,
    month: undefined,
    year: undefined
  })
}

/**
 * Get current date and time in GMT+7
 */
export function getCurrentGMT7() {
  const now = new Date()
  const gmt7Now = new Date(now.getTime() + (GMT_PLUS_7_OFFSET * 60 * 1000))
  return gmt7Now
}

/**
 * Get today's date string in YYYY-MM-DD format in GMT+7
 */
export function getTodayGMT7() {
  const today = getCurrentGMT7()
  return today.toISOString().split("T"[0]
}

/**
 * Get current time string in HH:mm format in GMT+7
 */
export function getCurrentTimeGMT7() {
  const now = getCurrentGMT7()
  return now.toTimeString().split(""[0].substring(0, 5)
}
