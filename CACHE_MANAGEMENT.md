# Translation Cache Management Guide

## Overview

The translation system caches Vietnamese translations in `localStorage` for performance. When you manually edit translations in Supabase, you need to clear the cache to see your changes.

## Cache Helper Functions

Two helper functions are available in the browser console for managing translation cache:

### 1. `clearViCache()` - Clear All Translations

Clears the entire translation cache and reloads the page.

**When to use**:
- After making multiple translation edits in Supabase
- When you want to force a complete refresh from the database
- When testing translation changes

**How to use**:
```javascript
// In browser console (F12)
clearViCache()
```

**What it does**:
1. Removes `vi_dict` from localStorage
2. Logs confirmation message
3. Reloads the page
4. Page will fetch fresh translations from Supabase

### 2. `invalidateKey(key)` - Clear Specific Translation

Clears cache for a specific translation key and reloads the page.

**When to use**:
- After editing a single translation in Supabase
- When you want to test one specific translation change
- To preserve other cached translations while updating one

**How to use**:
```javascript
// In browser console (F12)
invalidateKey("Browse events")
```

**What it does**:
1. Removes the specific key from `vi_dict` in localStorage
2. Logs confirmation message
3. Reloads the page
4. Page will fetch only that translation from Supabase (others stay cached)

## Workflow: Editing Translations

### Complete Workflow

1. **Edit in Supabase**:
   - Open Supabase Dashboard → Table Editor → `app_translations`
   - Find the row or insert new one
   - Edit the `vi` column with your Vietnamese translation
   - **Change `source` to "human"** (critical!)
   - Save the row

2. **Clear Cache** (choose one method):

   **Method A - Clear Specific Key** (recommended):
   ```javascript
   invalidateKey("Browse events")
   ```

   **Method B - Clear All Cache**:
   ```javascript
   clearViCache()
   ```

   **Method C - Manual Clear**:
   ```javascript
   localStorage.removeItem("vi_dict")
   location.reload()
   ```

3. **Verify**:
   - Page reloads automatically
   - Switch to Vietnamese (VI button)
   - Your translation should appear
   - Check that it persists on subsequent toggles

## Example: Fixing "Browse Events"

### Step-by-Step

1. **In Supabase**:
   ```sql
   -- Find the row
   SELECT * FROM app_translations WHERE key = 'Browse events';
   
   -- Update with your translation
   UPDATE app_translations
   SET vi = 'Tìm sự kiện', source = 'human'
   WHERE key = 'Browse events';
   ```

2. **In Browser Console**:
   ```javascript
   invalidateKey("Browse events")
   ```

3. **Result**:
   - Page reloads
   - "Browse events" now shows as "Tìm sự kiện"
   - Translation is protected (won't be overwritten)

## Understanding the Cache

### Cache Location
- **Storage**: `localStorage.vi_dict`
- **Format**: JSON object `{ "English key": "Vietnamese translation" }`

### Cache Inspection

View current cache:
```javascript
// In browser console
const cache = JSON.parse(localStorage.getItem("vi_dict") || "{}")
console.log(cache)
```

Check specific translation:
```javascript
const cache = JSON.parse(localStorage.getItem("vi_dict") || "{}")
console.log(cache["Browse events"])
```

### Manual Cache Editing (Advanced)

You can manually edit the cache if needed:
```javascript
// Get cache
const cache = JSON.parse(localStorage.getItem("vi_dict") || "{}")

// Update specific key
cache["Browse events"] = "Tìm sự kiện"

// Save back
localStorage.setItem("vi_dict", JSON.stringify(cache))

// Reload to see changes
location.reload()
```

**Note**: This is temporary! The next time the page loads, it will fetch from Supabase and overwrite your manual edit unless it's also in the database with `source = 'human'`.

## Edge Function Behavior

### Version 5 Logic

1. **Check for Human Translation**:
   - Queries `app_translations` for the key
   - If `source = 'human'`, returns it immediately
   - No Google Translate API call
   - No database write

2. **Auto-Translation**:
   - If no translation exists, calls Google Translate
   - If `source = 'auto'`, updates with new translation
   - Never overwrites `source = 'human'`

3. **Merge vs Ignore**:
   - Uses `resolution=merge-duplicates`
   - But only writes when `source != 'human'`
   - Human translations are protected at the query level

## Troubleshooting

### Translation Not Updating

**Problem**: Edited translation in Supabase but still seeing old translation

**Solutions**:
1. ✅ Check `source` field is set to "human" in Supabase
2. ✅ Run `clearViCache()` in browser console
3. ✅ Verify Edge Function is Version 5: `supabase functions list`
4. ✅ Check browser console for errors

### Cache Cleared But Still Wrong

**Problem**: Cleared cache but still seeing wrong translation

**Solutions**:
1. ✅ Verify the edit is saved in Supabase (refresh table editor)
2. ✅ Check `source` field is "human" not "auto"
3. ✅ Check Edge Function logs for errors
4. ✅ Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Translation Reverts on Next Load

**Problem**: Translation shows correctly once but reverts later

**Cause**: `source` field is still "auto", so Edge Function updates it

**Solution**: 
```sql
UPDATE app_translations 
SET source = 'human' 
WHERE key = 'Your key here';
```

## Best Practices

### 1. Always Set source = 'human'
When manually editing translations, always change the `source` field to "human" to protect your work.

### 2. Clear Cache After Edits
Run `clearViCache()` or `invalidateKey()` after editing to see changes immediately.

### 3. Bulk Edits
For multiple translation edits:
```sql
-- Edit multiple rows
UPDATE app_translations 
SET source = 'human' 
WHERE key IN ('Browse events', 'Discover', 'Saved');

-- Then clear entire cache
```
```javascript
clearViCache()
```

### 4. Verify in Database
Always verify your edits are saved:
```sql
SELECT key, vi, source 
FROM app_translations 
WHERE source = 'human'
ORDER BY updated_at DESC;
```

## Quick Reference

| Task | Command |
|------|---------|
| Clear all cache | `clearViCache()` |
| Clear one translation | `invalidateKey("Browse events")` |
| View cache | `JSON.parse(localStorage.getItem("vi_dict"))` |
| Check if cached | `JSON.parse(localStorage.getItem("vi_dict"))["Browse events"]` |

---

**Status**: ✅ Cache helpers available
**Edge Function**: Version 5 (human translation protection)
**Last Updated**: 2025-09-30
