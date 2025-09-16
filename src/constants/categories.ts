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

// Rich list with display labels and icons for the scroller
import {
  Sparkles, Music4, Disc3, Theater, CalendarDays, Heart, Gamepad2,
  Briefcase, CupSoda, Users, BookOpen, Dumbbell, Cpu, HeartPulse,
  Scissors, Film, Camera, Tent, Palette, Joystick, Smile, MoreHorizontal
} from 'lucide-react'

export type CategoryKey = string

export const CATEGORY_ITEMS: { key: CategoryKey; label: string; Icon: any }[] = [
  { key: 'all',                 label: 'All',                    Icon: Sparkles },
  { key: 'Music',               label: 'Music',                  Icon: Music4 },
  { key: 'Nightlife',           label: 'Nightlife',              Icon: Disc3 },
  { key: 'Performing & Visual Arts', label: 'Performing & Visual Arts', Icon: Theater },
  { key: 'Food & Drink',        label: 'Food & Drink',           Icon: CupSoda },
  { key: 'Community & Culture', label: 'Community & Culture',    Icon: Users },
  { key: 'Business',            label: 'Business',               Icon: Briefcase },
  { key: 'Education',           label: 'Education',              Icon: BookOpen },
  { key: 'Sports & Fitness',    label: 'Sports & Fitness',       Icon: Dumbbell },
  { key: 'Tech',                label: 'Tech',                   Icon: Cpu },
  { key: 'Health & Wellness',   label: 'Health & Wellness',      Icon: HeartPulse },
  { key: 'Fashion & Beauty',    label: 'Fashion & Beauty',       Icon: Scissors },
  { key: 'Film & Media',        label: 'Film & Media',           Icon: Film },
  { key: 'Photography',         label: 'Photography',            Icon: Camera },
  { key: 'Arts & Crafts',       label: 'Arts & Crafts',          Icon: Palette },
  { key: 'Outdoors & Adventure',label: 'Outdoors & Adventure',   Icon: Tent },
  { key: 'Games & Anime',       label: 'Games & Anime',          Icon: Joystick },
  { key: 'Family & Kids',       label: 'Family & Kids',          Icon: Smile },
  { key: 'Dating',              label: 'Dating',                 Icon: Heart },
  { key: 'Holidays',            label: 'Holidays',               Icon: CalendarDays },
  { key: 'Others',              label: 'Others',                 Icon: MoreHorizontal },
]

export const CATEGORY_KEYS = CATEGORY_ITEMS.map(c => c.key)
