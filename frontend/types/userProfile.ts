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

export interface BaseProfile {
    id: string;
    user_type: UserType;
    first_name: string;
    last_name: string;
    bio: string;
    interests: InterestType[];
    university?: string; // University affiliation (required for guests, defaults to NJIT for students/alumni)
    linkedin_url?: string;
    phone_number?: string;
    profile_picture_url?: string;
    resume_url?: string;
    resume_name?: string;
    created_at: string;
    updated_at: string;
    rank_points?: number;
    rank?: UserRank;
}

export interface StudentProfile extends BaseProfile {
    user_type: 'student';
    major: string;
    expected_graduation_year: number;
    university: string; // Defaults to 'NJIT'
    ucid: string;
}

export interface AlumniProfile extends BaseProfile {
    user_type: 'alumni';
    major: string;
    degree_type?: string; // e.g., 'B.S.', 'M.S.', 'Ph.D.'
    graduation_year: number;
    university: string; // Defaults to 'NJIT'
    current_company?: string;
    current_position?: string;
    mentorship_available?: boolean;
    mentorship_ways?: string[]; // e.g., ['resume-reviews', 'mock-interviews']
}

export interface GuestProfile extends BaseProfile {
    user_type: 'guest';
    university: string; // Required - their home university/organization
    major?: string; // Optional - their role or major
    expected_graduation_year?: number; // Optional - their expected graduation year
}

export interface OtherProfile extends BaseProfile {
    user_type: 'other';
    affiliation: string;
    school_name?: string;
    reason_for_joining?: string;
}

export type UserProfile = StudentProfile | AlumniProfile | GuestProfile | OtherProfile;
