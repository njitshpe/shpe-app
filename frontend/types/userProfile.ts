export type UserType = 'student' | 'alumni' | 'other';

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
    linkedin_url?: string;
    phone_number?: string;
    profile_picture_url?: string;
    resume_url?: string;
    resume_name?: string;
    created_at: string;
    updated_at: string;
}

export interface StudentProfile extends BaseProfile {
    user_type: 'student';
    major: string;
    expected_graduation_year: number;
    ucid: string;
}

export interface AlumniProfile extends BaseProfile {
    user_type: 'alumni';
    major: string;
    graduation_year: number;
    current_company?: string;
    current_position?: string;
}

export interface OtherProfile extends BaseProfile {
    user_type: 'other';
    affiliation: string;
    school_name?: string;
    reason_for_joining?: string;
}

export type UserProfile = StudentProfile | AlumniProfile | OtherProfile;
