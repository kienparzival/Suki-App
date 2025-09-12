export const CATEGORIES = [
  'Music',
  'Business & Professional',
  'Food & Drink',
  'Community & Culture',
  'Performing & Visual Arts',
  'Film, Media & Entertainment',
  'Sports & Fitness',
  'Health & Wellness',
  'Science & Technology',
  'Travel & Outdoor',
  'Charity & Causes',
  'Religion & Spirituality',
  'Family & Education',
  'Seasonal & Holiday',
  'Government & Politics',
  'Fashion & Beauty',
  'Home & Lifestyle',
  'Hobbies & Special Interests',
  'School Activities',
  'Others'
] as const;

export type Category = typeof CATEGORIES[number];
