import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommitteeMembers } from '@/hooks/committees';
import { CommitteeMember } from '@/types/committeeMember';

const { height } = Dimensions.get('window');

interface MembersModalProps {
  visible: boolean;
  onClose: () => void;
  committeeSlug: string;
  committeeTitle: string;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  visible,
  onClose,
  committeeSlug,
  committeeTitle,
}) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totalCount, members, isLoading, error, refetch } = useCommitteeMembers(committeeSlug);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.major?.toLowerCase().includes(query) ||
        member.year?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '??';
  };

  const handleMemberPress = (member: CommitteeMember) => {
    onClose();
    router.push(`/profile/${member.id}`);
  };

  const renderMemberItem = ({ item }: { item: CommitteeMember }) => (
    <Pressable
      style={({ pressed }) => [
        styles.memberRow,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? '#2C2C2E' : '#E8E5E0',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={() => handleMemberPress(item)}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: isDark ? '#3A3A3C' : '#1C1C1E' }]}>
            <Text style={[styles.avatarInitials, { color: isDark ? '#FFFFFF' : '#FDFBF7' }]}>
              {getInitials(item.name)}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text>
        {(item.major || item.year) && (
          <Text style={[styles.memberMeta, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            {[item.major, item.year].filter(Boolean).join(' • ')}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#8E8E93' : '#C7C7CC'} />
    </Pressable>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Unable to load members</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: isDark ? '#FFFFFF' : '#1C1C1E' }]}
            onPress={refetch}
          >
            <Text style={[styles.retryButtonText, { color: isDark ? '#1C1C1E' : '#FDFBF7' }]}>
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    if (searchQuery && filteredMembers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            Try a different search term
          </Text>
        </View>
      );
    }

    if (members.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No members yet</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            Be the first to join this committee
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search Bar */}
      {members.length > 0 && (
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#2C2C2E' : '#E8E5E0',
            },
          ]}
        >
          <Ionicons name="search" size={20} color={isDark ? '#8E8E93' : '#6e6e73'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search members..."
            placeholderTextColor={isDark ? '#8E8E93' : '#6e6e73'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#8E8E93' : '#6e6e73'} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
              borderBottomColor: isDark ? '#2C2C2E' : '#E8E5E0',
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={onClose}
              >
                <Ionicons name="close" size={28} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {committeeTitle}
              </Text>
              {!isLoading && members.length > 0 && (
                <Text style={[styles.headerSubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
                  {totalCount} {totalCount === 1 ? 'member' : 'members'}
                </Text>
              )}
            </View>

            <View style={styles.headerRight} />
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#1C1C1E'} />
            <Text style={[styles.loadingText, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
              Loading members...
            </Text>
          </View>
        )}

        {/* Members List */}
        {!isLoading && (
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderMemberItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 44,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberMeta: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
});
