import posthog from 'posthog-js'

// Initialize PostHog using env var and correct cloud host
const KEY = import.meta.env.VITE_POSTHOG_KEY

posthog.init(KEY, {
  api_host: 'https://us.i.posthog.com',
  autocapture: true,
  capture_pageview: true,
  loaded: (ph) => {
    if (process.env.NODE_ENV === 'development') {
      ph.debug()
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
