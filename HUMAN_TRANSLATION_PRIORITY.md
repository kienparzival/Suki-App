# Human Translation Priority System

## Problem Solved

Previously, manually edited translations in Supabase would get overwritten by automatic translations. This happened because the Edge Function used `resolution=merge-duplicates`, which would replace existing rows with new auto-translated content.

## Solution

The Edge Function now implements a **"human beats auto"** priority system:

1. ✅ Check if translation exists and is marked as `source: "human"`
2. ✅ If human translation exists, return it immediately (no API call, no overwrite)
3. ✅ If no translation exists, call Google Translate API
4. ✅ Insert new translation with `resolution=ignore-duplicates` (never overwrite)

## How It Works

### Edge Function Logic Flow

```typescript
// Step 1: Check for existing human translation
const existingRes = await fetch(
  `${SUPABASE_URL}/rest/v1/app_translations?select=key,vi,source&key=eq.${key}&limit=1`
);
const existing = await existingRes.json();

// Step 2: If human translation exists, use it
if (existing.length && existing[0].source === "human") {
  return { translated: existing[0].vi }; // Return curated translation
}

// Step 3: No human translation, get machine translation
const translated = await translateWithGoogle(key, "en", "vi", API_KEY);

// Step 4: Insert (but never overwrite existing rows)
await fetch(`${SUPABASE_URL}/rest/v1/app_translations`, {
  method: "POST",
  headers: {
    "Prefer": "resolution=ignore-duplicates" // KEY: Never overwrite!
  },
  body: JSON.stringify({ key, vi: translated, source: "auto" })
});
```

### Key Changes

**Before** (❌ Problem):
```typescript
headers: {
  "Prefer": "resolution=merge-duplicates" // Would overwrite existing rows
}
```

**After** (✅ Solution):
```typescript
headers: {
  "Prefer": "resolution=ignore-duplicates" // Never overwrites existing rows
}
```

## Using Manual Translations

### How to Add/Edit Human Translations

1. **Open Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/[your-project]/editor
   - Navigate to: Table Editor → `app_translations`

2. **Find or Create the Row**:
   - Search for the English key (e.g., "Browse events")
   - Click the row to edit, or insert a new row

3. **Edit the Translation**:
   - `key`: English text (e.g., "Browse events")
   - `vi`: Your Vietnamese translation (e.g., "Tìm sự kiện")
   - `source`: Change to **"human"** (very important!)

4. **Save**:
   - Click "Save" in the row editor
   - Your translation is now protected from auto-overwrite

### Translation Source Types

| Source | Meaning | Behavior |
|--------|---------|----------|
| `auto` | Machine translated via Google Translate | Can be improved by editing and changing source to "human" |
| `human` | Manually curated by you | **Protected** - will never be overwritten by auto-translation |

## Benefits

### ✅ For Developers
- Edit translations directly in Supabase
- No need to redeploy code for translation updates
- Clear distinction between auto and curated translations

### ✅ For Users
- Get human-quality translations for important UI elements
- Automatic fallback for new content
- Consistent experience with curated content

### ✅ For Translation Quality
- Gradually improve translations without breaking workflow
- Keep auto-translation for coverage
- Curate important strings over time

## Workflow: Improving Translations

### Step 1: Find Auto-Translated Strings
Query to find machine translations that might need improvement:

```sql
SELECT key, vi, source, updated_at
FROM app_translations
WHERE source = 'auto'
ORDER BY updated_at DESC
LIMIT 20;
```

### Step 2: Review and Improve
For important strings:
1. Review the auto-translation quality
2. If incorrect or awkward, edit the `vi` column
3. **Change `source` to "human"** to protect your edit
4. Save the row

### Step 3: Monitor Usage
Check which strings are accessed most often:

```sql
SELECT key, COUNT(*) as access_count
FROM app_translation_events
GROUP BY key
ORDER BY access_count DESC
LIMIT 20;
```

Focus your manual translation efforts on high-traffic strings.

## Examples

### Example 1: Fix "Browse events"

**Auto-translated** (incorrect):
- `key`: "Browse events"
- `vi`: "Duyệt sự kiện"
- `source`: "auto"

**Human-corrected**:
- `key`: "Browse events"
- `vi`: "Tìm sự kiện"
- `source`: "human" ← Changed to protect

**Result**: Now "Browse events" will always show as "Tìm sự kiện" and won't be overwritten.

### Example 2: Add New Curated Translation

1. Insert new row in `app_translations`:
   - `key`: "Discover amazing events"
   - `vi`: "Khám phá sự kiện tuyệt vời"
   - `source`: "human"

2. First time this string appears on the website:
   - Edge Function checks database
   - Finds existing "human" translation
   - Returns "Khám phá sự kiện tuyệt vời"
   - Never calls Google Translate API

## Testing the Fix

### Verify Human Translations are Protected

1. **Edit a translation in Supabase**:
   ```sql
   UPDATE app_translations
   SET vi = 'Your custom translation', source = 'human'
   WHERE key = 'Browse events';
   ```

2. **Clear browser cache**:
   - Clear localStorage: `localStorage.clear()`
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

3. **Visit your website and toggle to Vietnamese**:
   - Your custom translation should appear
   - It should persist even after multiple page loads

4. **Check Supabase**:
   - Row should still have `source = 'human'`
   - Translation should not have reverted

### Debug Checklist

If translations still revert:

1. ✅ Check `source` field is set to "human" (not "auto")
2. ✅ Verify Edge Function is Version 4 or higher
3. ✅ Clear browser localStorage
4. ✅ Check Edge Function logs for errors
5. ✅ Verify CORS headers are working (no preflight errors)

## Edge Function Version History

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2025-09-29 | Initial translation function |
| 2 | 2025-09-29 | Updated translation logic |
| 3 | 2025-09-30 | Added CORS headers |
| **4** | **2025-09-30** | **Human translation priority system** ← Current |

## Best Practices

### 1. Start with Auto, Improve Over Time
- Let auto-translation provide coverage
- Identify important/visible strings
- Manually improve those strings
- Mark as "human" to protect

### 2. Use Consistent Terminology
- Keep a glossary of important terms
- Use same translations across app
- Update related strings together

### 3. Review Periodically
- Check `app_translation_events` for popular strings
- Prioritize high-visibility translations
- Update outdated translations

### 4. Document Custom Translations
- Keep notes on why certain translations were chosen
- Share context with team members
- Maintain translation quality standards

## Troubleshooting

### Translation Still Reverts
**Cause**: `source` not set to "human"
**Fix**: Edit row and set `source = 'human'`

### New String Not Appearing
**Cause**: Edge Function not being called
**Fix**: Check browser console for CORS errors

### Same Auto-Translation Keeps Coming Back
**Cause**: Using `source = 'auto'` instead of `source = 'human'`
**Fix**: Change `source` field to "human" when editing

---

**Status**: ✅ Implemented and deployed (Version 4)
**Last Updated**: 2025-09-30
**Edge Function Version**: 4
