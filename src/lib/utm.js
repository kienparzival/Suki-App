/**
 * UTM and attribution tracking utilities
 * Captures first-time visitor attribution data and stores it for analytics
 */

const STORAGE_KEY = 'suki_first_attrib'

/**
 * Get first-time attribution data (UTM parameters + referrer)
 * This is called once per browser session and cached in localStorage
 * @returns {Object} Attribution data with UTM params and referrer
 */
export function getFirstAttribution() {
  // Check if we already have cached attribution data
  const cached = localStorage.getItem(STORAGE_KEY)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch (error) {
      console.warn('Failed to parse cached attribution data:', error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // Extract UTM parameters from URL
  const urlParams = new URLSearchParams(window.location.search)
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .reduce((acc, param) => {
      const value = urlParams.get(param)
      if (value) {
        acc[param] = value
      }
      return acc
    }, {})

  // Create attribution payload
  const attribution = {
    ts: new Date().toISOString(),
    referrer: document.referrer || null,
    landing_page: window.location.href,
    user_agent: navigator.userAgent,
    ...utmParams
  }

  // Cache the attribution data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  } catch (error) {
    console.warn('Failed to cache attribution data:', error)
  }

  return attribution
}

/**
 * Clear cached attribution data (useful for testing)
 */
export function clearAttributionCache() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if attribution data exists in cache
 * @returns {boolean} True if attribution data is cached
 */
export function hasAttributionData() {
  return localStorage.getItem(STORAGE_KEY) !== null
}

/**
 * Get attribution data for analytics (includes additional context)
 * @returns {Object} Enhanced attribution data for analytics
 */
export function getAttributionForAnalytics() {
  const attribution = getFirstAttribution()
  
  return {
    ...attribution,
    // Add additional context
    page_title: document.title,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_resolution: `${screen.width}x${screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}
