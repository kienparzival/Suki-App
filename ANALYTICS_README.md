# Analytics & UTM Tracking Implementation

This document describes the analytics and UTM tracking implementation for Suki.

## Overview

The analytics system includes:
- **PostHog Analytics**: Event tracking and user behavior analysis
- **UTM Parameter Capture**: Track where users came from (utm_source, utm_medium, etc.)
- **Referrer Tracking**: Capture the referring website
- **Supabase Storage**: Store attribution data for querying and analysis

## Setup Instructions

### 1. PostHog Setup

1. Create a PostHog account at [app.posthog.com](https://app.posthog.com)
2. Get your project key from the PostHog dashboard
3. Update `src/lib/analytics.js` and replace `<YOUR_POSTHOG_KEY>` with your actual PostHog project key:

```javascript
const KEY = 'phc-your-actual-posthog-key-here'
```

### 2. Database Setup

Run the SQL commands in `ANALYTICS_SETUP.sql` in your Supabase SQL editor to create the necessary tables and policies.

### 3. Environment Variables

Make sure you have the following environment variables set:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Features Implemented

### Analytics Tracking

#### Page Views
- Automatically tracked on route changes via `RouteTracker` component
- Includes attribution data for each page view

#### Search Events
- Tracked when users submit search queries
- Includes search term, category, and city context
- Events: `search`

#### Event Views
- Tracked when users view individual event pages
- Includes event ID, city, and category
- Events: `event_view`

#### CTA Clicks
- Tracked when users click external ticket links
- Includes event ID, URL, and CTA type
- Events: `cta_click_external`

### UTM Parameter Capture

The system automatically captures:
- `utm_source`: Traffic source (e.g., "google", "facebook")
- `utm_medium`: Marketing medium (e.g., "cpc", "social")
- `utm_campaign`: Campaign name
- `utm_content`: Ad content identifier
- `utm_term`: Keywords for paid search
- `referrer`: Referring website URL
- `landing_page`: First page visited
- `user_agent`: Browser information

### Data Storage

#### PostHog
- Real-time event tracking
- User identification and properties
- Attribution data attached to user profiles

#### Supabase
- Persistent storage of attribution data
- Queryable for analytics and reporting
- Table: `user_attribution`

## Usage Examples

### Querying Attribution Data

```sql
-- Top UTM sources
SELECT utm_source, COUNT(*) as user_count 
FROM user_attribution 
WHERE utm_source IS NOT NULL 
GROUP BY utm_source 
ORDER BY user_count DESC;

-- Users by campaign
SELECT utm_campaign, COUNT(*) as user_count 
FROM user_attribution 
WHERE utm_campaign IS NOT NULL 
GROUP BY utm_campaign 
ORDER BY user_count DESC;

-- Daily signups by source
SELECT 
  DATE(first_visit) as signup_date,
  utm_source,
  COUNT(*) as user_count
FROM user_attribution 
WHERE utm_source IS NOT NULL 
GROUP BY DATE(first_visit), utm_source 
ORDER BY signup_date DESC, user_count DESC;
```

### PostHog Events

The following events are automatically tracked:

1. **$pageview**: Page views with attribution data
2. **search**: Search queries with context
3. **event_view**: Event page views
4. **cta_click_external**: External ticket link clicks

## File Structure

```
src/
├── lib/
│   ├── analytics.js          # PostHog initialization and tracking functions
│   └── utm.js               # UTM parameter capture utilities
├── components/
│   └── RouteTracker.jsx     # Route change tracking component
└── pages/
    └── EventPage.jsx        # Event view and CTA tracking
```

## Privacy Considerations

- UTM parameters are only captured on first visit
- Data is cached in localStorage to prevent duplicate tracking
- User identification only occurs when logged in
- Anonymous users are tracked with session-based identification

## Email Capture Integration

For email capture (weekly digest), you can:

1. **PostHog Cohorts**: Create cohorts based on city/location
2. **Supabase Queries**: Query users by city for targeted emails
3. **Export Data**: Use PostHog's export features or Supabase queries

Example query for Hanoi users:
```sql
SELECT au.email, ua.first_visit, ua.utm_source
FROM analytics_user_attribution ua
JOIN auth.users au ON ua.user_id = au.id
WHERE au.email_confirmed_at IS NOT NULL
AND ua.first_visit >= NOW() - INTERVAL '30 days'
ORDER BY ua.first_visit DESC;
```

## Troubleshooting

### PostHog Not Tracking
- Check browser console for errors
- Verify PostHog key is correct
- Ensure PostHog is initialized before tracking calls

### UTM Parameters Not Captured
- Check if parameters are in URL on first visit
- Verify localStorage is available
- Check browser console for errors

### Supabase Storage Issues
- Verify Supabase credentials
- Check RLS policies are correct
- Ensure `user_attribution` table exists

## Next Steps

1. **Set up PostHog project** and add your key
2. **Run the SQL setup** in Supabase
3. **Test the implementation** with UTM parameters
4. **Set up PostHog dashboards** for key metrics
5. **Create email capture workflows** for weekly digests

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all environment variables are set
3. Test with UTM parameters in URL
4. Check PostHog dashboard for events
5. Query Supabase for attribution data
