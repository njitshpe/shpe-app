/**
 * Single Source of Truth for Interests data.
 * The `id` values must match the backend Database Enums exactly.
 * The `label` is the user-facing display name.
 * The `icon` is the Ionicons icon name.
 */

import type { InterestType } from '@/types/userProfile';

export interface Interest {
  id: InterestType;
  label: string;
  icon: string;
}

export const INTERESTS_LIST: Interest[] = [
  { id: 'professional_development', label: 'Professional Dev', icon: 'briefcase' },
  { id: 'academic', label: 'Academic Support', icon: 'book' },
  { id: 'wellness', label: 'Mental Health', icon: 'heart' },
  { id: 'social', label: 'Social Events', icon: 'people' },
  { id: 'technology', label: 'Tech Workshops', icon: 'code-slash' },
  { id: 'volunteering', label: 'Community Service', icon: 'hand-left' },
  { id: 'networking', label: 'Networking', icon: 'git-network' },
  { id: 'career', label: 'Career Fairs', icon: 'compass' },
  { id: 'leadership', label: 'Leadership', icon: 'star' },
  { id: 'hackathons', label: 'Hackathons', icon: 'laptop-outline' },
  { id: 'research', label: 'Research', icon: 'flask' },
  { id: 'entrepreneurship', label: 'Startup / Biz', icon: 'rocket' },
];

/**
 * Returns the interest details for a given ID.
 * Falls back to a default object if the ID is not found.
 */
export function getInterestDetails(id: InterestType | string): Interest {
  const interest = INTERESTS_LIST.find((i) => i.id === id);
  if (interest) return interest;

  // Fallback: format the ID as a readable label
  return {
    id: id as InterestType,
    label: id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: 'help-circle',
  };
}
