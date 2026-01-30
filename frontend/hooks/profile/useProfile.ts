import { useState } from 'react';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  major: string;
  year: string;
  profileImage: string | null;
  interests: string[];
}

// Mock Data (Replace with DB fetch later)
const MOCK_USER: UserProfile = {
  id: '1',
  firstName: 'Sofia',
  lastName: 'Molina',
  major: 'Computer Science',
  year: '2025',
  profileImage: null,
  interests: ['Web Development'],
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(MOCK_USER);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return { profile, updateProfile };
}