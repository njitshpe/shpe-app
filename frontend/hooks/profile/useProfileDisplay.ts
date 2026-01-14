import { UserProfile, getRankFromPoints, getProfileValue } from '@/types/userProfile';
import { User } from '@supabase/supabase-js';

interface UseProfileDisplayProps {
    profile: UserProfile | null;
    user: User | null;
}

export function useProfileDisplay({ profile, user }: UseProfileDisplayProps) {
    const getDisplayName = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name} ${profile.last_name}`;
        }
        return user?.email?.split('@')[0] || 'User';
    };

    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
        }
        return (user?.email?.slice(0, 2) || 'US').toUpperCase();
    };

    const getSubtitle = () => {
        if (!profile) return "Complete your profile to get started";

        if (profile.user_type === 'student') {
            const major = profile.major || "Major";
            const year = profile.graduation_year || new Date().getFullYear();
            return `${major} | Class of ${year}`;
        }

        if (profile.user_type === 'alumni') {
            const major = profile.major || "Major";
            const degreeType = getProfileValue(profile, 'degree_type');
            const year = profile.graduation_year || new Date().getFullYear();
            // Show degree type and major for alumni (e.g., "B.S. Computer Science | Class of 2020")
            return degreeType ? `${degreeType} ${major} | Class of ${year}` : `${major} | Class of ${year}`;
        }

        if (profile.user_type === 'guest') {
            const major = profile.major || "Guest Member";
            const year = profile.graduation_year || new Date().getFullYear();
            return `${major} | Class of ${year}`;
        }

        if (profile.user_type === 'other') {
            return "Member";
        }

        return "Member";
    };

    const getSecondarySubtitle = () => {
        if (!profile) return null;

        // Show job info for alumni
        if (profile.user_type === 'alumni') {
            const position = getProfileValue(profile, 'job_title');
            const company = getProfileValue(profile, 'company');

            if (position && company) {
                return `${position} at ${company}`;
            } else if (position) {
                return position;
            } else if (company) {
                return company;
            }
        }

        // Show university for guests
        if (profile.user_type === 'guest') {
            return profile.university || 'Guest';
        }

        return null;
    };

    const getUserTypeBadge = () => {
        if (!profile?.user_type) return "Student";

        // Capitalize first letter
        return profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1);
    };

    const getRankColor = () => {
        // Calculate rank from points if not provided
        const points = profile?.rank_points || 0;
        const rank = profile?.rank || getRankFromPoints(points);

        switch (rank) {
            case 'gold':
                return '#FFD700';
            case 'silver':
                return '#C0C0C0';
            case 'bronze':
                return '#CD7F32';
            default:
                return '#8E8E93';
        }
    };

    const getPoints = () => {
        return profile?.rank_points || 0;
    };

    const getRank = () => {
        const points = profile?.rank_points || 0;
        return profile?.rank || getRankFromPoints(points);
    };

    return {
        displayName: getDisplayName(),
        initials: getInitials(),
        subtitle: getSubtitle(),
        secondarySubtitle: getSecondarySubtitle(),
        userTypeBadge: getUserTypeBadge(),
        rankColor: getRankColor(),
        points: getPoints(),
        rank: getRank(),
    };
}
