import { supabase } from '@/lib/supabase';

/**
 * Returns a URL safe to pass to React Native <Image source={{ uri }} />.
 * Supports either:
 * - a full https? URL
 * - a storage object path (e.g. "profile-photos/abc.webp") in bucket "user-uploads"
 */
export function resolveProfilePictureUrl(input?: string | null): string | undefined {
  if (!input) return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const bucketPrefix = 'user-uploads/';
  const normalizedPath = trimmed.startsWith(bucketPrefix)
    ? trimmed.slice(bucketPrefix.length)
    : trimmed;

  const { data } = supabase.storage.from('user-uploads').getPublicUrl(normalizedPath);
  return data.publicUrl || undefined;
}

