import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';
import { eventsService, notificationService, rankService } from '@/services';
import { fetchAnnouncementPosts } from '@/lib/feedService';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroEventCard } from '@/components/home/HeroEventCard';
import { QuickActions } from '@/components/home/QuickActions';
import { Announcements } from '@/components/home/Announcements';
import { Committees } from '@/components/home/Committees';
import { MissionLog } from '@/components/home/MissionLog';
import { RankTrajectory } from '@/components/home/RankTrajectory';
import { AdminControls } from '@/components/home/AdminControls';

interface HeroEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  flyer?: string | null;
  image_url?: string | null;
  is_registered?: boolean;
}

interface MissionEvent {
  id: string;
  title: string;
  date: string;
  location: string;
}

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { isCurrentUserAdmin, isCurrentUserSuperAdmin } = useEvents();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [featuredEvents, setFeaturedEvents] = useState<HeroEvent[]>([]);
  const [missionEvents, setMissionEvents] = useState<MissionEvent[]>([]);
  const [announcement, setAnnouncement] = useState<{ title: string; message: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(0);

  // --- Logic ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id;
      const [upcomingResponse, myEventsResponse, announcementsResponse, badgeCount, rankResponse] =
        await Promise.all([
          eventsService.getUpcomingEvents(),
          userId ? eventsService.getUserUpcomingEvents(userId) : Promise.resolve({ success: true, data: [] }),
          fetchAnnouncementPosts(1),
          notificationService.getBadgeCount(),
          rankService.getMyRank(),
        ]);

      const upcomingEvents = upcomingResponse.success ? upcomingResponse.data : [];
      const myEvents = myEventsResponse.success ? myEventsResponse.data : [];
      const myEventIds = new Set(myEvents.map((event) => event.event_id));

      // Take up to 3 upcoming events for the carousel
      const heroEvents = upcomingEvents.slice(0, 3).map((event) => ({
        id: event.event_id,
        title: event.name,
        start_time: event.start_time,
        end_time: event.end_time,
        location: event.location_name,
        flyer: event.cover_image_url ?? null,
        is_registered: myEventIds.has(event.event_id),
      }));
      setFeaturedEvents(heroEvents);

      setMissionEvents(
        myEvents.map((event) => ({
          id: event.event_id,
          title: event.name,
          date: event.start_time,
          location: event.location_name,
        }))
      );

      if (announcementsResponse.success && announcementsResponse.data.length > 0) {
        const latestAlert = announcementsResponse.data[0];
        setAnnouncement({
          title: latestAlert.title?.trim() || 'Announcement',
          message: latestAlert.content,
        });
      } else if (announcementsResponse.success) {
        setAnnouncement(null);
      }

      setUnreadCount(typeof badgeCount === 'number' ? badgeCount : 0);
      setCurrentPoints(rankResponse.success ? rankResponse.data.points_total : 0);
    } catch (error) {
      console.error(error);
      setFeaturedEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleActionPress = (route: string) => router.push(route as any);

  const handleHeroAction = (eventId: string, action: 'check-in' | 'rsvp') => {
    if (action === 'check-in') router.push('/check-in');
    else router.push(`/event/${eventId}`);
  };

  const { rankTitle, nextRankThreshold } = useMemo(() => {
    if (currentPoints < 25) {
      return { rankTitle: 'Bronze Member', nextRankThreshold: 25 };
    }
    if (currentPoints < 75) {
      return { rankTitle: 'Silver Member', nextRankThreshold: 75 };
    }
    return { rankTitle: 'Gold Member', nextRankThreshold: Math.max(currentPoints, 75) };
  }, [currentPoints]);

  // --- Role Check ---
  const isAdmin = isCurrentUserAdmin || isCurrentUserSuperAdmin;

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />

      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#000000'] : ['#FFFFFF', '#F5F5F5']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            progressViewOffset={80}
          />
        }
      >
        {/* 1. Hero Event */}
        {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
        ) : featuredEvents.length > 0 ? (
            <HeroEventCard
                events={featuredEvents}
                onPress={(eventId) => router.push(`/event/${eventId}`)}
                onAction={handleHeroAction}
            />
        ) : null}

        {/* 2. Quick Actions */}
        <QuickActions onPress={handleActionPress} />

        {/* 3. Announcements */}
        {announcement && (
            <Announcements
                title={announcement.title}
                message={announcement.message}
                onPress={() => router.push('/notifications')}
            />
        )}

        {/* 4. Committees */}
        <Committees onPress={(committeeId) => router.push(`/committees/${committeeId}` as any)} />

        {/* 5. Mission Log */}
        <MissionLog
            events={missionEvents}
            onPress={(id) => router.push(`/event/${id}`)}
        />

        {/* 6. Rank Trajectory */}
        <RankTrajectory
          currentPoints={currentPoints}
          rankTitle={rankTitle}
          nextRankThreshold={nextRankThreshold}
          onPress={() => router.push('/(tabs)/leaderboard')}
        />

        {/* 7. Admin Controls (Hidden) */}
        {isAdmin && (
          <AdminControls
            onDebug={() => router.push('/_sitemap')}
            onAdmin={() => router.push('/admin')}
          />
        )}

      </ScrollView>

      {/* Header Overlay */}
      <HomeHeader hasUnreadNotifications={unreadCount > 0} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    // Dynamic padding
  },
});
