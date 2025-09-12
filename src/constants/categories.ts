export const CATEGORIES = [
  'Music',
  'Food & Drink',
  'Community & Culture',
  'Arts & Theatre',
  'Business',
  'Sports & Fitness',
  'Nightlife',
  'Family',
  'Education',
  'Charity',
] as const;

export type Category = typeof CATEGORIES[number];
