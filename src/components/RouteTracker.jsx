import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView, posthog } from '../lib/analytics.js'
import { getAttributionForAnalytics } from '../lib/utm.js'

/**
 * Component to track page views and route changes
 * Should be placed inside the Router but outside individual route components
 */
export default function RouteTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page view on route change
    trackPageView()

    // Set user properties with attribution data if available
    const attribution = getAttributionForAnalytics()
    if (attribution) {
      posthog.people.set({
        first_visit: attribution.ts,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
        referrer: attribution.referrer,
        landing_page: attribution.landing_page
      })
    }
  }, [location])

  return null // This component doesn't render anything
}
