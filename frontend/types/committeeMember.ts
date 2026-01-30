/**
 * Committee member type for committee membership
 */
export interface CommitteeMember {
  id: string;
  name: string;
  avatarUrl?: string;
  major?: string;
  year?: string;
  role?: string; // e.g., "Chair", "Member"
  joinedAt?: string;
}

/**
 * Committee members response with count and data
 */
export interface CommitteeMembersData {
  totalCount: number;
  members: CommitteeMember[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
