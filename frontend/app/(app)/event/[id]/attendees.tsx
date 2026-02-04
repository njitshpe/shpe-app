import React, { useState, useMemo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolateColor,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  Platform,
  Dimensions,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEventAttendees } from '@/hooks/events';
import { useEvents } from '@/contexts/EventsContext';
import { Attendee } from '@/types/attendee';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { events } = useEvents();
  const { totalCount, attendees, isLoading, error, hasMore, loadMore } = useEventAttendees(id!);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useTheme();

  const scrollY = useSharedValue(0);

  const event = events.find((evt) => evt.id === id);

  // Filter based on search query
  const filteredAttendees = useMemo(() => {
    if (!searchQuery.trim()) return attendees;

    const query = searchQuery.toLowerCase();
    return attendees.filter(
      (attendee) =>
        attendee.name.toLowerCase().includes(query) ||
        attendee.major?.toLowerCase().includes(query) ||
        attendee.year?.toLowerCase().includes(query)
    );
  }, [attendees, searchQuery]);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '??';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handlePressAttendee = (attendeeId: string) => {
    router.push(`/profile/${attendeeId}`);
  };

  const handlePressLinkedIn = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      borderBottomColor: interpolateColor(
        scrollY.value,
        [0, 50],
        ['rgba(255,255,255,0)', 'rgba(255,255,255,0.15)']
      ),
      borderBottomWidth: 1,
    };
  });

  const headerOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, 50],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const renderAttendeeItem = ({ item }: { item: Attendee }) => (
    <View style={styles.attendeeRowContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.attendeeRow,
          pressed && styles.attendeeRowPressed
        ]}
        onPress={() => handlePressAttendee(item.id)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.avatarUrl ? (
            <Image
              source={{ uri: item.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.attendeeInfo}>
          <Text style={styles.attendeeName}>{item.name}</Text>
          {(item.major || item.year) && (
            <Text style={styles.attendeeMeta}>
              {[item.major, item.year].filter(Boolean).join(' • ')}
            </Text>
          )}
        </View>

        {/* Role Badge (optional) */}
        {item.role && item.role !== 'Member' && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        )}
      </Pressable>

      {/* LinkedIn Button (outside of main press area to avoid conflicts) */}
      {item.linkedinUrl && (
        <TouchableOpacity
          style={styles.linkedinButton}
          onPress={() => handlePressLinkedIn(item.linkedinUrl!)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="logo-linkedin" size={24} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading && attendees.length === 0) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyTitle}>Unable to load attendees</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    if (searchQuery && filteredAttendees.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      );
    }

    if (attendees.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.emptyTitle}>No attendees yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to register for this event</Text>
        </View>
      );
    }

    return null;
  };

  const headerTitle = useMemo(() => {
    if (isLoading) return 'Loading...';

    if (searchQuery) {
      return `${filteredAttendees.length} Result${filteredAttendees.length !== 1 ? 's' : ''}`;
    }

    return `${totalCount} Attending`;
  }, [isLoading, searchQuery, filteredAttendees.length, totalCount]);

  const bgSource = event?.coverImageUrl ? { uri: event.coverImageUrl } : undefined;

  // Header height approximation for padding calculation
  const HEADER_HEIGHT = 100;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={bgSource}
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}
        blurRadius={Platform.OS === 'android' ? 40 : 60}
      >
        {/* Dark Overlay for readability */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

        {/* Improved iOS Blur */}
        {Platform.OS === 'ios' && (
          <BlurView intensity={30} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        )}

        <View style={styles.contentContainer}>

          <Animated.View style={[
            styles.stickyHeaderContainer,
            { paddingTop: insets.top },
            headerAnimatedStyle
          ]}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                headerOpacityStyle
              ]}
            >
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(10,10,10,0.8)' }
                ]}
              />
            </Animated.View>

            <View style={styles.header}>
              <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </Pressable>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>{headerTitle}</Text>
              </View>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor="#fff"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {isLoading && attendees.length === 0 && (
            <View style={[styles.loadingContainer, { marginTop: HEADER_HEIGHT + insets.top }]}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading attendees...</Text>
            </View>
          )}

          <AnimatedFlatList
            data={filteredAttendees}
            renderItem={renderAttendeeItem}
            keyExtractor={(item: any, index: number) => item.id || `attendee-${index}`}
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: HEADER_HEIGHT + insets.top + 10 }
            ]}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#fff"
                progressViewOffset={HEADER_HEIGHT + insets.top}
              />
            }
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            onScroll={onScroll}
            scrollEventThrottle={16}
          />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
  },
  stickyHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    // paddingBottom: 8, // Removed to keep border on edge
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15, // Smaller font
    color: '#fff',
    paddingVertical: 0, // Reset padding
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    // paddingTop is handled dynamically in render
  },
  attendeeRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // Increased spacing since we removed card bg
    paddingHorizontal: 8, // Little breathing room
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 16,
  },
  attendeeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // Removed background and padding that made it a card
  },
  attendeeRowPressed: {
    opacity: 0.7,
    // transform: [{ scale: 0.995 }], // Removed scale
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 40, // Slightly smaller
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 1,
  },
  attendeeMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop handled dynamically
  },
  loadingText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
  },
  linkedinButton: {
    padding: 8,
    marginLeft: 8,
  },
});
