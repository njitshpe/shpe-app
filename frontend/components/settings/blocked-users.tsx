import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBlock } from '@/contexts/BlockContext';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/profile.service';
import type { UserProfile } from '@/types/userProfile';

interface BlockedUserItem {
  userId: string;
  profile: UserProfile | null;
  isLoading: boolean;
  error?: string;
}

export default function BlockedUsersScreen() {
  const { theme, isDark } = useTheme();
  const { blockedUserIds, unblockUser, isLoading: contextLoading } = useBlock();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unblockingIds, setUnblockingIds] = useState<Set<string>>(new Set());

  // Fetch profiles for blocked user IDs
  useEffect(() => {
    const fetchBlockedProfiles = async () => {
      const userIds = Array.from(blockedUserIds);

      if (userIds.length === 0) {
        setBlockedUsers([]);
        return;
      }

      // Initialize with loading state
      setBlockedUsers(
        userIds.map(userId => ({
          userId,
          profile: null,
          isLoading: true,
        }))
      );

      // Fetch all profiles
      const results = await Promise.all(
        userIds.map(async (userId) => {
          const result = await profileService.getProfile(userId);
          return {
            userId,
            profile: result.success ? result.data : null,
            isLoading: false,
            error: result.success ? undefined : result.error?.message,
          };
        })
      );

      setBlockedUsers(results);
    };

    fetchBlockedProfiles();
  }, [blockedUserIds]);

  const handleUnblock = async (userId: string) => {
    setUnblockingIds(prev => new Set([...prev, userId]));

    try {
      const success = await unblockUser(userId);

      if (!success) {
        console.warn('[BlockedUsers] Failed to unblock user:', userId);
      }
    } finally {
      setUnblockingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return blockedUsers;
    }

    const query = searchQuery.toLowerCase();
    return blockedUsers.filter(item => {
      if (!item.profile) return false;

      const fullName = `${item.profile.first_name} ${item.profile.last_name}`.toLowerCase();
      const username = item.profile.id.toLowerCase();

      return fullName.includes(query) || username.includes(query);
    });
  }, [blockedUsers, searchQuery]);

  const renderBlockedUser = ({ item }: { item: BlockedUserItem }) => {
    const { userId, profile, isLoading, error } = item;
    const isUnblocking = unblockingIds.has(userId);

    if (isLoading) {
      return (
        <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      );
    }

    if (error || !profile) {
      return (
        <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
              <Ionicons name="person-outline" size={24} color={theme.subtext} />
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.subtext }]}>
                {error ? 'Error loading user' : 'User not found'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.unblockButton, { backgroundColor: theme.primary }]}
            onPress={() => handleUnblock(userId)}
            disabled={isUnblocking}
          >
            {isUnblocking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.unblockButtonText}>Unblock</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    const displayName = `${profile.first_name} ${profile.last_name}`;
    const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();

    const major = profile.major?.trim();
    const graduationYear = profile.graduation_year;

    const fallbackSubtitle = (() => {
      if (major && graduationYear) return `${major} • Class of ${graduationYear}`;
      if (major) return major;
      return 'Guest Member';
    })();

    let subtitle = fallbackSubtitle;
    if (profile.user_type === 'alumni') {
      const jobTitle = profile.job_title?.trim();
      const company = profile.company?.trim();
      subtitle = jobTitle && company ? `${jobTitle} at ${company}` : fallbackSubtitle;
    }

    return (
      <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.userInfo}>
          {profile.profile_picture_url ? (
            <Image source={{ uri: profile.profile_picture_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#444' : '#C0C0C0' }]}>
              <Text style={[styles.avatarInitials, { color: isDark ? '#fff' : '#000' }]}>
                {initials}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            {subtitle && (
              <Text style={[styles.userSubtitle, { color: theme.subtext }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.unblockButton, { backgroundColor: theme.primary }]}
          onPress={() => handleUnblock(userId)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.unblockButtonText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
        <Ionicons name="people-outline" size={48} color={theme.subtext} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Blocked Users</Text>
      <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
        {searchQuery.trim()
          ? 'No users match your search.'
          : 'You haven\'t blocked anyone yet.'}
      </Text>
    </View>
  );

  const dynamicStyles = {
    container: { backgroundColor: theme.background },
    searchContainer: { backgroundColor: theme.card, borderColor: theme.border },
    searchInput: { color: theme.text },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, dynamicStyles.searchContainer]}>
        <Ionicons name="search" size={20} color={theme.subtext} />
        <TextInput
          style={[styles.searchInput, dynamicStyles.searchInput]}
          placeholder="Search by name..."
          placeholderTextColor={theme.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {/* Blocked Users List */}
      {contextLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.subtext }]}>
            Loading blocked users...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.userId}
          renderItem={renderBlockedUser}
          contentContainerStyle={
            filteredUsers.length === 0 ? styles.emptyListContainer : styles.listContainer
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    fontFamily: 'System',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 13,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
