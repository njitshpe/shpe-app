export type UserType = 'student' | 'alumni' | 'guest' | 'other';

// Legacy type - kept for backward compatibility
// New tier names come from rank_tiers table (e.g., 'Chick', 'Pollito', etc.)
export type UserRank = string;

// Interest types must match the backend Database Enums exactly
export type InterestType =
    | 'professional_development'
    | 'academic'
    | 'wellness'
    | 'social'
    | 'technology'
    | 'volunteering'
    | 'networking'
    | 'career'
    | 'leadership'
    | 'hackathons'
    | 'research'
    | 'entrepreneurship';

// Legacy options kept for backward compatibility - prefer INTERESTS_LIST from constants/interests.ts
export const INTEREST_OPTIONS = [
    { value: 'professional_development' as const, label: '💼 Professional Dev' },
    { value: 'academic' as const, label: '📚 Academic Support' },
    { value: 'wellness' as const, label: '❤️ Mental Health' },
    { value: 'social' as const, label: '🎉 Social Events' },
    { value: 'technology' as const, label: '💻 Tech Workshops' },
    { value: 'volunteering' as const, label: '🌟 Community Service' },
    { value: 'networking' as const, label: '🤝 Networking' },
    { value: 'career' as const, label: '🧭 Career Fairs' },
    { value: 'leadership' as const, label: '⭐ Leadership' },
    { value: 'hackathons' as const, label: '💻 Hackathons' },
    { value: 'research' as const, label: '🔬 Research' },
    { value: 'entrepreneurship' as const, label: '🚀 Startup / Biz' },
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

const PROFILE_DATA_KEYS = [
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
] as const satisfies ReadonlyArray<keyof ProfileData>;

export function normalizeProfileData(input: unknown): ProfileData {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

    const source = input as Record<string, any>;
    const normalized: Record<string, any> = {};

    // Keep only canonical top-level keys
    for (const key of PROFILE_DATA_KEYS) {
        if (source[key] !== undefined) normalized[key] = source[key];
    }

    // Flatten known legacy nested shapes (DROP everything else)
    const contact = source.contact;
    if (contact && typeof contact === 'object' && !Array.isArray(contact)) {
        if (contact.linkedin_url !== undefined) normalized.linkedin_url = contact.linkedin_url;
        if (contact.phone_number !== undefined) normalized.phone_number = contact.phone_number;
        if (contact.portfolio_url !== undefined) normalized.portfolio_url = contact.portfolio_url;
    }

    const resume = source.resume;
    if (resume && typeof resume === 'object' && !Array.isArray(resume)) {
        if (resume.resume_url !== undefined) normalized.resume_url = resume.resume_url;
        if (resume.resume_name !== undefined) normalized.resume_name = resume.resume_name;
        if (resume.url !== undefined && normalized.resume_url === undefined) normalized.resume_url = resume.url;
        if (resume.name !== undefined && normalized.resume_name === undefined) normalized.resume_name = resume.name;
    }

    const alumni = source.alumni;
    if (alumni && typeof alumni === 'object' && !Array.isArray(alumni)) {
        if (alumni.company !== undefined) normalized.company = alumni.company;
        if (alumni.job_title !== undefined) normalized.job_title = alumni.job_title;
        if (alumni.industry !== undefined) normalized.industry = alumni.industry;
        if (alumni.degree_type !== undefined) normalized.degree_type = alumni.degree_type;
        if (alumni.mentorship_available !== undefined) normalized.mentorship_available = alumni.mentorship_available;
        if (alumni.mentorship_ways !== undefined) normalized.mentorship_ways = alumni.mentorship_ways;
    }

    const student = source.student;
    if (student && typeof student === 'object' && !Array.isArray(student)) {
        // Explicitly ignore core fields; only accept canonical keys if present.
        if (student.linkedin_url !== undefined) normalized.linkedin_url = student.linkedin_url;
        if (student.phone_number !== undefined) normalized.phone_number = student.phone_number;
        if (student.portfolio_url !== undefined) normalized.portfolio_url = student.portfolio_url;
        if (student.resume_url !== undefined) normalized.resume_url = student.resume_url;
        if (student.resume_name !== undefined) normalized.resume_name = student.resume_name;
    }

    // Push tokens must stay as columns; ignore any legacy nested push object.
    return normalized as ProfileData;
}

export interface BaseProfile {
    id: string;
    user_type: UserType;
    first_name: string;
    last_name: string;
    bio: string;
    interests: InterestType[];
    profile_picture_url?: string | null; // Column
    created_at: string;
    updated_at: string;

    // Core fields stored as columns (shared across types)
    university?: string; // University (column)
    major?: string; // Major/field of study (column, not in profile_data)
    graduation_year?: number; // Graduation year (column, not in profile_data)
    ucid?: string; // UCID for verification (column, not in profile_data)

    // Points/tier now come from points_balances + rank_tiers tables
    // Use rankService.getUserRank(userId) to fetch points data

    // JSONB column containing optional/type-specific fields
    profile_data: ProfileData;

    // Legacy columns - kept for backward compatibility during migration
    // These will be read as fallback if profile_data doesn't have the value
    linkedin_url?: string | null;
    portfolio_url?: string | null;
    phone_number?: string | null;
    resume_url?: string | null;
    resume_name?: string | null;
    company?: string | null;
    job_title?: string | null;
    industry?: string | null;
    degree_type?: string | null;
    mentorship_available?: boolean | null;
    mentorship_ways?: string[] | null;
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
    const profileDataFields: ReadonlyArray<keyof ProfileData> = PROFILE_DATA_KEYS;

    // Direct column fields (everything else is ignored to prevent accidental writes)
    const directColumnFields = new Set<string>([
        'user_type',
        'first_name',
        'last_name',
        'bio',
        'profile_picture_url',
        'university',
        'major',
        'graduation_year',
        'interests',
        'ucid',
        'push_token',
    ]);

    const directUpdates: Record<string, any> = {};
    const profileDataUpdates: ProfileData = {};

    Object.entries(updates).forEach(([key, value]) => {
        if (key === 'profile_data') {
            Object.assign(profileDataUpdates, normalizeProfileData(value));
            return;
        }

        // Allow callers to pass legacy nested objects; always flatten them.
        if (key === 'contact' || key === 'resume' || key === 'student' || key === 'alumni' || key === 'push') {
            Object.assign(profileDataUpdates, normalizeProfileData({ [key]: value }));
            return;
        }

        if (profileDataFields.includes(key as keyof ProfileData)) {
            // This field belongs in profile_data JSONB
            profileDataUpdates[key as keyof ProfileData] = value as any;
        } else if (directColumnFields.has(key)) {
            // This is a direct column update
            directUpdates[key] = value;
        }
    });

    return { directUpdates, profileDataUpdates };
}
