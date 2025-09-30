# Event Content Protection

## Overview

Event titles and descriptions are now protected from automatic translation, ensuring that organizer-created content remains exactly as they typed it, regardless of the selected language.

## What's Protected

### Event Titles
- ✅ Event card titles (EventCard component)
- ✅ Event detail modal titles (EventDetail component)
- ✅ Event page titles (EventPage component)

### Event Descriptions
- ✅ Event card descriptions/teasers (EventCard component)
- ✅ Event detail modal descriptions (EventDetail component)
- ✅ Event page full descriptions (EventPage component)

## How It Works

### 1. Data Attribute Protection
Elements with the `data-no-translate` attribute are automatically skipped by the GlobalAutoTranslate component:

```jsx
<h1 data-no-translate>{event.title}</h1>
<p data-no-translate>{event.description}</p>
```

### 2. Recursive Parent Checking
The translation system checks not just the immediate element, but also all parent elements for the `data-no-translate` attribute, ensuring nested content is also protected.

### 3. Class/ID Pattern Matching (Fallback)
As an additional safeguard, elements with these class or ID patterns are also skipped:
- `event-title`
- `event-name`
- `event-description`
- `event-details`

## What Still Gets Translated

✅ **UI Elements**:
- Navigation menus
- Buttons and labels
- Form fields
- Error messages
- System notifications
- Footer text
- Header text

✅ **Static Content**:
- Page titles
- Section headings
- Instructions
- Help text

❌ **User Content** (NOT translated):
- Event titles
- Event descriptions
- Organizer names (preserved)
- Venue names (preserved)

## Components Updated

### EventCard.jsx
```jsx
<h3 className="text-lg font-semibold text-neutral-900" data-no-translate>
  {event.title}
</h3>
<p className="text-sm text-neutral-600 line-clamp-2" data-no-translate>
  {teaser}
</p>
```

### EventDetail.jsx
```jsx
<h2 className="text-xl font-semibold" data-no-translate>
  {event.title}
</h2>
<div className="text-sm text-neutral-700 leading-relaxed" data-no-translate>
  {event.description}
</div>
```

### EventPage.jsx
```jsx
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" data-no-translate>
  {event.title}
</h1>
<section className="prose" data-no-translate>
  <DescriptionBlock text={event.description} />
</section>
```

## GlobalAutoTranslate Logic

The translation walker now includes this check:

```javascript
// Skip elements with data-no-translate attribute
let el = parent;
while (el) {
  if (el.hasAttribute && el.hasAttribute('data-no-translate')) {
    return NodeFilter.FILTER_REJECT;
  }
  
  // Check class/id patterns
  const className = el.className || '';
  const id = el.id || '';
  if (
    className.includes('event-title') ||
    className.includes('event-name') ||
    className.includes('event-description') ||
    className.includes('event-details') ||
    id.includes('event-title') ||
    id.includes('event-description')
  ) {
    return NodeFilter.FILTER_REJECT;
  }
  
  el = el.parentElement;
}
```

## Adding Protection to Other Content

To protect any other content from translation, simply add the `data-no-translate` attribute:

```jsx
// Single element
<div data-no-translate>
  This content will not be translated
</div>

// Parent element (protects all children)
<section data-no-translate>
  <h1>Title</h1>
  <p>All content here is protected</p>
</section>
```

## Benefits

1. **Preserves Organizer Intent**: Event creators' content stays exactly as they wrote it
2. **Multi-language Events**: Organizers can write events in any language (English, Vietnamese, Chinese, etc.)
3. **Professional Quality**: No machine-translated event names that might lose meaning
4. **User Trust**: Attendees see authentic event information
5. **Flexible System**: Easy to add protection to other content types

## Testing

### To Verify Protection:
1. Open your website
2. Click the VI language toggle
3. Navigate to events pages
4. Check that:
   - ✅ Event titles remain unchanged
   - ✅ Event descriptions remain unchanged
   - ✅ UI elements (buttons, labels) translate to Vietnamese
   - ✅ Page headings translate to Vietnamese

## Future Enhancements

If you want to support bilingual events in the future:
1. Add `title_vi` and `description_vi` fields to the events table
2. Display Vietnamese version when available and language is set to VI
3. Fall back to original if Vietnamese translation not provided
4. Keep `data-no-translate` to prevent machine translation

---

**Status**: ✅ Implemented and deployed
**Last Updated**: 2025-09-30
**Version**: 1.0.0
