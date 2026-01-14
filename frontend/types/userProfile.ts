export type UserType = 'student' | 'alumni' | 'guest' | 'other';

export type UserRank = 'unranked' | 'bronze' | 'silver' | 'gold';

export const RANK_THRESHOLDS: Record<UserRank, { min: number; max: number }> = {
    unranked: { min: 0, max: 24 },
    bronze: { min: 25, max: 49 },
    silver: { min: 50, max: 74 },
    gold: { min: 75, max: 100 },
};

export function getRankFromPoints(points: number): UserRank {
    if (points >= 75) return 'gold';
    if (points >= 50) return 'silver';
    if (points >= 25) return 'bronze';
    return 'unranked';
}

export type InterestType =
    | 'workshops'
    | 'networking'
    | 'speakers'
    | 'career'
    | 'volunteering'
    | 'social';

export const INTEREST_OPTIONS = [
    { value: 'workshops' as const, label: '🔬 Workshops & Technical Training' },
    { value: 'networking' as const, label: '🤝 Networking Events' },
    { value: 'speakers' as const, label: '🎤 Guest Speakers & Panels' },
    { value: 'career' as const, label: '💼 Career Development' },
    { value: 'volunteering' as const, label: '🌟 Volunteering & Community Service' },
    { value: 'social' as const, label: '🎉 Social Events' },
];

// Type-specific data stored in profile_data JSONB column
// These are OPTIONAL fields that vary by user type
export interface ProfileData {
    // Contact & Social
    portfolio_url?: string | null;
    linkedin_url?: string | null;
    phone_number?: string | null;

    // Resume
    resume_url?: string | null;
    resume_name?: string | null;

    // Professional fields (Alumni)
    company?: string | null;
    job_title?: string | null;
    industry?: string | null;
    degree_type?: string | null;

    // Mentorship fields (Alumni)
    mentorship_available?: boolean | null;
    mentorship_ways?: string[] | null;
}

export interface BaseProfile {
    id: string;
    user_type: UserType;
    first_name: string;
    last_name: string;
    bio: string;
    interests: InterestType[];
    profile_picture_url?: string;
    created_at: string;
    updated_at: string;

    // Core fields stored as columns (shared across types)
    university?: string; // University (column)
    major?: string; // Major/field of study (column, not in profile_data)
    graduation_year?: number; // Graduation year (column, not in profile_data)
    ucid?: string; // UCID for verification (column, not in profile_data)
    rank_points: number; // Points for gamification (column)
    rank?: UserRank; // Computed rank based on points

    // JSONB column containing optional/type-specific fields
    profile_data: ProfileData;

    // Legacy columns - kept for backward compatibility during migration
    // These will be read as fallback if profile_data doesn't have the value
    linkedin_url?: string;
    portfolio_url?: string;
    phone_number?: string;
    resume_url?: string;
    resume_name?: string;
    company?: string;
    job_title?: string;
    industry?: string;
    degree_type?: string;
    mentorship_available?: boolean;
    mentorship_ways?: string[];
}

export interface StudentProfile extends BaseProfile {
    user_type: 'student';
    major: string; // Required for students
    graduation_year: number; // Expected graduation year
    university: string; // Defaults to 'NJIT'
    ucid: string; // Required for students
}

export interface AlumniProfile extends BaseProfile {
    user_type: 'alumni';
    major: string; // Required for alumni
    graduation_year: number; // Actual graduation year
    university: string; // Defaults to 'NJIT'
    // Optional fields in profile_data:
    // - degree_type
    // - company
    // - job_title
    // - industry
    // - mentorship_available
    // - mentorship_ways
}

export interface GuestProfile extends BaseProfile {
    user_type: 'guest';
    university: string; // Required - their home university/organization
    major?: string; // Optional - their role or major
    graduation_year?: number; // Optional - their expected graduation year
}

export interface OtherProfile extends BaseProfile {
    user_type: 'other';
    // Other users have minimal required fields
    // Optional fields stored in profile_data as needed
}

export type UserProfile = StudentProfile | AlumniProfile | GuestProfile | OtherProfile;

// Utility function to read from profile_data with fallback to legacy columns
// Use this for fields that are being migrated to profile_data
export function getProfileValue<K extends keyof ProfileData>(
    profile: BaseProfile | null | undefined,
    field: K
): ProfileData[K] | undefined {
    if (!profile) return undefined;

    // Try profile_data first (preferred location)
    const valueInData = profile.profile_data?.[field];
    if (valueInData !== undefined && valueInData !== null) {
        return valueInData;
    }

    // Fallback to legacy column during migration
    const legacyValue = (profile as any)[field];
    if (legacyValue !== undefined && legacyValue !== null) {
        return legacyValue;
    }

    return undefined;
}

// Utility to prepare profile data for updates
// Separates fields into direct column updates vs profile_data JSONB updates
export function prepareProfileUpdate(updates: Partial<UserProfile>): {
    directUpdates: Record<string, any>;
    profileDataUpdates: ProfileData;
} {
    // Fields that should be stored in profile_data JSONB
    const profileDataFields: (keyof ProfileData)[] = [
        'portfolio_url',
        'linkedin_url',
        'phone_number',
        'resume_url',
        'resume_name',
        'company',
        'job_title',
        'industry',
        'degree_type',
        'mentorship_available',
        'mentorship_ways',
    ];

    const directUpdates: Record<string, any> = {};
    const profileDataUpdates: ProfileData = {};

    Object.entries(updates).forEach(([key, value]) => {
        if (profileDataFields.includes(key as keyof ProfileData)) {
            // This field belongs in profile_data JSONB
            profileDataUpdates[key as keyof ProfileData] = value as any;
        } else if (key !== 'profile_data') {
            // This is a direct column update (major, ucid, graduation_year, etc.)
            directUpdates[key] = value;
        }
    });

    return { directUpdates, profileDataUpdates };
}
