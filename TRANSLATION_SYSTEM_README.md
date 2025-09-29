# Translation System Setup

This project implements a 3-layer translation system that always shows Vietnamese text to users, with automatic fallback translation for missing keys.

## Architecture

1. **Primary (curated)**: English keys → Vietnamese translations from Supabase `app_translations` table
2. **Auto-fill fallback**: Missing keys trigger serverless translation function, get Vietnamese translation, write back to Supabase, and cache it
3. **Dev visibility**: Log/mark machine-translated strings for later review

## Database Schema

The system uses two Supabase tables:

### `app_translations`
- `key` (text, primary key): English source string (exact)
- `vi` (text, not null): Vietnamese translation (human or machine)
- `source` (text, default 'auto'): 'auto' or 'human'
- `updated_at` (timestamptz, default now())

### `app_translation_events` (optional)
- `id` (bigserial, primary key)
- `key` (text, not null): Translation key that was missing
- `lang` (text, not null): Target language (e.g., 'vi')
- `seen_at` (timestamptz, default now())

## Edge Function

The translation Edge Function (`supabase/functions/translate/index.ts`) handles:
- Receiving translation requests with English keys
- Calling Google Translate API (or other provider)
- Upserting translations into `app_translations` table
- Returning translated text

## Client Implementation

The client-side i18n system (`src/i18n.tsx`) provides:
- `I18nProvider`: Context provider for translation state
- `T` component: Translation component for JSX
- `LangToggle`: Language switcher component
- `useI18n`: Hook for accessing translation functions

## Usage

### Basic Translation
```jsx
import { T } from '../i18n.tsx'

// Simple text
<T>Hello World</T>

// With variables
<T vars={{name: 'John'}}>Hello {name}</T>
```

### Language Toggle
```jsx
import { LangToggle } from '../i18n.tsx'

<LangToggle className="custom-class" />
```

### Programmatic Translation
```jsx
import { useI18n } from '../i18n.tsx'

const { t, lang, setLang } = useI18n()
const translated = t('Hello World')
```

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `GOOGLE_TRANSLATE_API_KEY`: Google Translate API key (for Edge Function)

## Deployment

1. Deploy the Edge Function to Supabase:
   ```bash
   supabase functions deploy translate
   ```

2. Set environment variables in Supabase dashboard

3. Deploy the frontend to Vercel (auto-deploys on GitHub push)

## Benefits

- Users never see mixed languages in Vietnamese mode
- New content automatically gets translated on first view
- Developers can review and improve machine translations later
- No need to hunt for missing translations
- Seamless user experience with immediate Vietnamese display
