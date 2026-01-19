import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export interface PendingCheckIn {
    token: string;
    eventName: string;
    scannedAt: string; // ISO string
    expiresAt: string; // ISO string
}

export class PendingCheckInService {
    private static readonly STORAGE_KEY = 'pending_check_in_data';
    // Cache TTL: 10 minutes (in milliseconds)
    private static readonly TTL_MS = 10 * 60 * 1000;

    /**
     * Save a scanned token as a pending check-in
     */
    static async save(token: string): Promise<void> {
        try {
            // Decode token to get event details (for UI display)
            // The token payload structure from backend:
            // { event_id, event_name, iat, exp, type: "check_in" }
            const decoded: any = jwtDecode(token);

            const now = new Date();
            const expiresAt = new Date(now.getTime() + this.TTL_MS);

            const pendingData: PendingCheckIn = {
                token,
                eventName: decoded.event_name || 'Event',
                scannedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
            };

            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(pendingData));
        } catch (error) {
            console.error('Failed to save pending check-in:', error);
            throw error;
        }
    }

    /**
     * Retrieve the pending check-in if it exists and hasn't expired
     */
    static async get(): Promise<PendingCheckIn | null> {
        try {
            const json = await AsyncStorage.getItem(this.STORAGE_KEY);
            if (!json) return null;

            const data = JSON.parse(json) as PendingCheckIn;

            // Check if expired
            if (new Date() > new Date(data.expiresAt)) {
                await this.clear();
                return null;
            }

            return data;
        } catch (error) {
            console.error('Failed to get pending check-in:', error);
            return null;
        }
    }

    /**
     * Clear the pending check-in
     */
    static async clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear pending check-in:', error);
        }
    }

    /**
     * specific validation logic beyond just time expiry
     */
    static isValid(pending: PendingCheckIn): boolean {
        const now = new Date();
        const expiresAt = new Date(pending.expiresAt);
        return now <= expiresAt;
    }
}
