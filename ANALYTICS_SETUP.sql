-- Analytics and UTM tracking setup for Suki
-- This file contains the database schema and setup for analytics tracking

-- Create user_attribution table to store UTM parameters and referrer data
CREATE TABLE IF NOT EXISTS user_attribution (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_visit TIMESTAMPTZ NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  landing_page TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- One attribution record per user
);

-- Create email_subscribers table for weekly digest
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'All',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(email) -- One subscription per email
);

-- Create session_attributions table for anonymous UTM tracking
CREATE TABLE IF NOT EXISTS session_attributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_attribution_user_id ON user_attribution(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attribution_utm_source ON user_attribution(utm_source);
CREATE INDEX IF NOT EXISTS idx_user_attribution_utm_medium ON user_attribution(utm_medium);
CREATE INDEX IF NOT EXISTS idx_user_attribution_utm_campaign ON user_attribution(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_user_attribution_first_visit ON user_attribution(first_visit);

-- Indexes for email_subscribers
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_city ON email_subscribers(city);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_active ON email_subscribers(is_active);

-- Indexes for session_attributions
CREATE INDEX IF NOT EXISTS idx_session_attributions_utm_source ON session_attributions(utm_source);
CREATE INDEX IF NOT EXISTS idx_session_attributions_utm_medium ON session_attributions(utm_medium);
CREATE INDEX IF NOT EXISTS idx_session_attributions_utm_campaign ON session_attributions(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_session_attributions_created_at ON session_attributions(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE user_attribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attributions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own attribution data
CREATE POLICY "Users can view their own attribution data" ON user_attribution
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert/update their own attribution data
CREATE POLICY "Users can insert their own attribution data" ON user_attribution
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attribution data" ON user_attribution
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for email_subscribers (allow public access for subscription)
CREATE POLICY "Anyone can insert email subscriptions" ON email_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view email subscriptions" ON email_subscribers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update email subscriptions" ON email_subscribers
  FOR UPDATE USING (true);

-- Policies for session_attributions (allow public access for anonymous tracking)
CREATE POLICY "Anyone can insert session attributions" ON session_attributions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view session attributions" ON session_attributions
  FOR SELECT USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_attribution_updated_at 
  BEFORE UPDATE ON user_attribution 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for analytics queries (optional - for easier querying)
CREATE OR REPLACE VIEW analytics_user_attribution AS
SELECT 
  ua.*,
  au.email,
  au.created_at as user_created_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM user_attribution ua
LEFT JOIN auth.users au ON ua.user_id = au.id;

-- Grant access to the view
GRANT SELECT ON analytics_user_attribution TO authenticated;

-- Example queries for analytics:

-- 1. Top UTM sources
-- SELECT utm_source, COUNT(*) as user_count 
-- FROM user_attribution 
-- WHERE utm_source IS NOT NULL 
-- GROUP BY utm_source 
-- ORDER BY user_count DESC;

-- 2. Users by campaign
-- SELECT utm_campaign, COUNT(*) as user_count 
-- FROM user_attribution 
-- WHERE utm_campaign IS NOT NULL 
-- GROUP BY utm_campaign 
-- ORDER BY user_count DESC;

-- 3. Referrer analysis
-- SELECT referrer, COUNT(*) as user_count 
-- FROM user_attribution 
-- WHERE referrer IS NOT NULL 
-- GROUP BY referrer 
-- ORDER BY user_count DESC;

-- 4. Daily signups by source
-- SELECT 
--   DATE(first_visit) as signup_date,
--   utm_source,
--   COUNT(*) as user_count
-- FROM user_attribution 
-- WHERE utm_source IS NOT NULL 
-- GROUP BY DATE(first_visit), utm_source 
-- ORDER BY signup_date DESC, user_count DESC;

-- 5. Email subscribers by city
-- SELECT city, COUNT(*) as subscriber_count 
-- FROM email_subscribers 
-- WHERE is_active = true 
-- GROUP BY city 
-- ORDER BY subscriber_count DESC;

-- 6. Weekly digest list for Hanoi
-- SELECT email, subscribed_at 
-- FROM email_subscribers 
-- WHERE city = 'Hanoi' AND is_active = true 
-- ORDER BY subscribed_at DESC;

-- 7. Anonymous UTM tracking
-- SELECT utm_source, utm_medium, utm_campaign, COUNT(*) as session_count
-- FROM session_attributions 
-- WHERE utm_source IS NOT NULL 
-- GROUP BY utm_source, utm_medium, utm_campaign 
-- ORDER BY session_count DESC;
