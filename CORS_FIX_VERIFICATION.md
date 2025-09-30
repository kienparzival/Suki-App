# CORS Fix Verification Guide

## What Was Fixed

The Edge Function was blocking browser requests due to missing CORS headers. This prevented the GlobalAutoTranslate component from translating page content and footer text.

## Changes Made

### Edge Function (`supabase/functions/translate/index.ts`)
- ✅ Added CORS headers for Vercel domain: `https://suki-app-two.vercel.app`
- ✅ Handle OPTIONS preflight requests
- ✅ Include CORS headers in all responses (success and error)
- ✅ Allow required headers: authorization, apikey, content-type
- ✅ Deployed as Version 3

## How to Test

### 1. Open Your Website
Visit: https://suki-app-two.vercel.app

### 2. Open Browser DevTools
- Press `F12` or right-click → Inspect
- Go to **Network** tab
- Enable "Preserve log" (checkbox at top)

### 3. Click Language Toggle
Click the "VI" button in the header

### 4. Check Network Requests

You should see:

#### ✅ Preflight (OPTIONS) Request
- **Method**: OPTIONS
- **Status**: 200 OK
- **Response Headers** should include:
  ```
  Access-Control-Allow-Origin: https://suki-app-two.vercel.app
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
  ```

#### ✅ Translation (POST) Requests
- **Method**: POST
- **URL**: `https://[your-supabase-url]/functions/v1/translate`
- **Status**: 200 OK
- **Response**: `{ "translated": "Vietnamese text here" }`
- **Response Headers** should include CORS headers

### 5. Verify Translation Working

**What should happen:**
- ✅ Header text translates immediately (already working)
- ✅ Page content starts translating (fixing now)
- ✅ Footer text translates (fixing now)
- ✅ Dynamic content translates on route changes

**Check the page:**
- All visible English text should gradually change to Vietnamese
- May take a few seconds as each unique string is translated
- Subsequent visits will be instant (cached)

### 6. Check Database

Go to Supabase Dashboard → Table Editor → `app_translations`

You should see new rows with:
- `key`: English text
- `vi`: Vietnamese translation
- `source`: 'auto'
- `updated_at`: Recent timestamp

## Troubleshooting

### Still seeing CORS errors?

1. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear all browser cache

2. **Verify environment variables**:
   - Open DevTools Console
   - Type: `import.meta.env.VITE_SUPABASE_URL`
   - Should show your Supabase URL
   - Type: `import.meta.env.VITE_SUPABASE_ANON_KEY`
   - Should show your anon key (not undefined)

3. **Check Edge Function logs**:
   - Go to: https://supabase.com/dashboard/project/qdywfwlafkmpnalnfbli/functions/translate/logs
   - Look for errors or failed requests

4. **Verify Google Translate API key**:
   - Go to: https://supabase.com/dashboard/project/qdywfwlafkmpnalnfbli/settings/functions
   - Check `GOOGLE_TRANSLATE_API_KEY` is set correctly
   - If just added, wait 30 seconds for Edge Function to pick it up

### No translations appearing?

1. **Check Network tab**: Are POST requests being made?
2. **Check Console tab**: Any JavaScript errors?
3. **Check language**: Make sure you clicked VI button
4. **Wait a few seconds**: First translation takes time, subsequent visits are instant

### Translations work but slow?

This is expected on first load:
- Each unique string needs to be translated via Google API
- Translations are cached in localStorage and database
- Second visit will be instant
- Consider adding common translations manually to database

## Testing Different Scenarios

### Test 1: Fresh Translation
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Click VI button
4. Watch translations appear gradually

### Test 2: Cached Translation
1. Click EN button (switch back to English)
2. Click VI button again
3. Translations should appear instantly (from cache)

### Test 3: Different Pages
1. Switch to VI
2. Navigate to different pages (Browse, Events, Profile)
3. All pages should translate

### Test 4: Footer Translation
1. Scroll to footer
2. Click VI button
3. Footer text should translate

## Success Metrics

✅ **CORS working**: No CORS errors in Console
✅ **API calls successful**: POST requests return 200 status
✅ **Translations visible**: All text changes to Vietnamese
✅ **Database populated**: New rows in app_translations table
✅ **Performance good**: Cached translations load instantly

## Current Deployment Status

- **Edge Function**: Version 3 (deployed with CORS fix)
- **Status**: ACTIVE
- **Last Updated**: 2025-09-30 08:56:34 UTC
- **Allowed Origin**: https://suki-app-two.vercel.app
- **GitHub**: Changes pushed to main branch
- **Vercel**: Auto-deployment in progress

## Next Steps

Once verification is complete:
1. Monitor Edge Function logs for any errors
2. Review auto-translated text in database
3. Replace important auto-translations with human translations
4. Consider adding common phrases manually for better quality

---

**Need help?** Check the Edge Function logs and browser console for specific error messages.
