import posthog from 'posthog-js'

// Initialize PostHog with your project key
// Replace <YOUR_POSTHOG_KEY> with your actual PostHog project key from app.posthog.com
const KEY = '<YOUR_POSTHOG_KEY>'  // TODO: Replace with actual PostHog key

// Initialize PostHog
posthog.init(KEY, { 
  api_host: 'https://app.posthog.com', 
  autocapture: true,
  // Disable in development if needed
  loaded: (posthog) => {
    if (process.env.NODE_ENV === 'development') {
      posthog.debug()
    }
  }
})

export { posthog }

// Helper functions for common tracking events
export const trackPageView = () => {
  posthog.capture('$pageview')
}

export const trackSearch = (searchData) => {
  posthog.capture('search', {
    q: searchData.q,
    category: searchData.category,
    city: searchData.city,
    timestamp: new Date().toISOString()
  })
}

export const trackEventView = (eventData) => {
  posthog.capture('event_view', {
    event_id: eventData.event_id,
    city: eventData.city,
    category: eventData.category,
    timestamp: new Date().toISOString()
  })
}

export const trackCTAClick = (ctaData) => {
  posthog.capture('cta_click_external', {
    event_id: ctaData.event_id,
    url: ctaData.url,
    cta_type: ctaData.cta_type || 'external_link',
    timestamp: new Date().toISOString()
  })
}

export const trackUserAction = (action, properties = {}) => {
  posthog.capture(action, {
    ...properties,
    timestamp: new Date().toISOString()
  })
}
