import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEvents } from '@/contexts/EventsContext';
import { eventsService, notificationService } from '@/services';
import { fetchAnnouncementPosts } from '@/lib/feedService';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroEventCard } from '@/components/home/HeroEventCard';
import { QuickActions } from '@/components/home/QuickActions';
import { LiveIntel } from '@/components/home/LiveIntel';
import { MissionLog } from '@/components/home/MissionLog';
import { RankTrajectory } from '@/components/home/RankTrajectory';
import { AdminControls } from '@/components/home/AdminControls'; // New Import

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
  const { profile, user } = useAuth();
  const { isCurrentUserAdmin, isCurrentUserSuperAdmin } = useEvents();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [featuredEvent, setFeaturedEvent] = useState<HeroEvent | null>(null);
  const [missionEvents, setMissionEvents] = useState<MissionEvent[]>([]);
  const [liveIntel, setLiveIntel] = useState<{ title: string; message: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- Logic ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id;
      const [upcomingResponse, myEventsResponse, announcementsResponse, badgeCount] =
        await Promise.all([
          eventsService.getUpcomingEvents(),
          userId ? eventsService.getUserUpcomingEvents(userId) : Promise.resolve({ success: true, data: [] }),
          fetchAnnouncementPosts(1),
          notificationService.getBadgeCount(),
        ]);

      const upcomingEvents = upcomingResponse.success ? upcomingResponse.data : [];
      const myEvents = myEventsResponse.success ? myEventsResponse.data : [];
      const myEventIds = new Set(myEvents.map((event) => event.event_id));

      const nextEvent = upcomingEvents[0];
      setFeaturedEvent(
        nextEvent
          ? {
              id: nextEvent.event_id,
              title: nextEvent.name,
              start_time: nextEvent.start_time,
              end_time: nextEvent.end_time,
              location: nextEvent.location_name,
              flyer: nextEvent.cover_image_url ?? null,
              is_registered: myEventIds.has(nextEvent.event_id),
            }
          : null
      );

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
        setLiveIntel({
          title: latestAlert.title?.trim() || 'Announcement',
          message: latestAlert.content,
        });
      } else if (announcementsResponse.success) {
        setLiveIntel(null);
      }

      setUnreadCount(typeof badgeCount === 'number' ? badgeCount : 0);
    } catch (error) {
      console.error(error);
      setFeaturedEvent(null);
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
  
  const handleHeroAction = (action: 'check-in' | 'rsvp') => {
    if (action === 'check-in') router.push('/check-in');
    else if (featuredEvent) router.push(`/event/${featuredEvent.id}`);
  };

  const { rankTitle, nextRankThreshold } = useMemo(() => {
    const points = profile?.points ?? 0;
    if (points < 25) {
      return { rankTitle: 'Bronze Member', nextRankThreshold: 25 };
    }
    if (points < 75) {
      return { rankTitle: 'Silver Member', nextRankThreshold: 75 };
    }
    return { rankTitle: 'Gold Member', nextRankThreshold: Math.max(points, 75) };
  }, [profile?.points]);

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* 1. Hero Event */}
        {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
        ) : featuredEvent ? (
            <HeroEventCard
                event={featuredEvent}
                onPress={() => router.push(`/event/${featuredEvent.id}`)}
                onAction={handleHeroAction}
            />
        ) : null}

        {/* 2. Quick Actions */}
        <QuickActions onPress={handleActionPress} />

        {/* 3. Live Intel */}
        {liveIntel && (
            <LiveIntel
                title={liveIntel.title}
                message={liveIntel.message}
                onPress={() => router.push('/notifications')}
            />
        )}

        {/* 4. Mission Log */}
        <MissionLog 
            events={missionEvents} 
            onPress={(id) => router.push(`/event/${id}`)}
        />

        {/* 5. Rank Trajectory */}
        <RankTrajectory
            currentPoints={profile?.points ?? 0}
            rankTitle={rankTitle}
            nextRankThreshold={nextRankThreshold}
            onPress={() => router.push('/(tabs)/leaderboard')}
        />

        {/* 6. Admin Controls (Hidden) */}
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
