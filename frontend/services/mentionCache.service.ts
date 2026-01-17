import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types/userProfile';

const STORAGE_KEY = 'recent_mentions';
const MAX_RECENTS = 5;

let memoryCache: UserProfile[] | null = null;

// Simple implementation of a recent mentions cache. Reduces the number of DB calls;
// I made this to be a separate service so it could be reused for comment tagging in the future.
export const mentionCacheService = {
    // Save a user to the recent mentions list.
    // Moves them to the top if already exists.
    async saveRecent(user: UserProfile) {
        try {
            const current = await this.getRecents();
            // Remove if exists (to move to top)
            const filtered = current.filter(u => u.id !== user.id);
            // Add to front
            const updated = [user, ...filtered].slice(0, MAX_RECENTS);

            // Update memory immediately
            memoryCache = updated;

            // Persist to disk
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.warn('Failed to save recent mention:', error);
        }
    },

    // Get the list of recent mentions.
    async getRecents(): Promise<UserProfile[]> {
        // Return memory cache if available
        if (memoryCache) return memoryCache;

        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            const data = json ? JSON.parse(json) : [];
            memoryCache = data; // Populate cache
            return data;
        } catch (error) {
            console.warn('Failed to load recent mentions:', error);
            return [];
        }
    }
};
