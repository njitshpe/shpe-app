import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';

import { useTheme } from '@/contexts/ThemeContext';
import { adminRSVPService, RSVPCardData } from '@/services/adminRSVP.service';
import { ProfileHeader } from '@/components/profile/ProfileHeader'; // Reusing your component!

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function ReviewRSVPScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [cards, setCards] = useState<RSVPCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation Values
  const translateX = useSharedValue(0);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const response = await adminRSVPService.getPendingRSVPsForEvent(id);
      if (response.success && response.data) {
        setCards(response.data);
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeComplete = async (direction: 'left' | 'right') => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    // 1. Optimistic Update: Move to next card immediately
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    translateX.value = 0; // Reset position for the "next" card

    // 2. DETERMINE ACTION
    const action = direction === 'right' ? 'approve' : 'accept';

    // 3. Send API Request in background
    try {
      await adminRSVPService.processRSVP(currentCard.attendance_id, action);
    } catch (error) {
      console.error("Swipe failed:", error);
      Alert.alert('Error', 'Failed to update RSVP status.');
    }

    // 4. If finished, go back
    if (nextIndex >= cards.length) {
      Alert.alert('All Done!', 'You have reviewed all pending requests.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  // Gesture Definition
  const gesture = Gesture.Pan()
    .onChange((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe detected
        const direction = event.translationX > 0 ? 'right' : 'left';
        // Animate off screen
        translateX.value = withSpring(
          direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          {},
          () => runOnJS(handleSwipeComplete)(direction)
        );
      } else {
        // Return to center
        translateX.value = withSpring(0);
      }
    });

  // Animated Styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
          [-10, 0, 10],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          Math.abs(translateX.value),
          [0, SCREEN_WIDTH],
          [0.9, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      Math.abs(translateX.value),
      [0, SCREEN_WIDTH / 2],
      [0.6, 1],
      Extrapolation.CLAMP
    ),
  }));

  // Render Overlay (Like/Nope text)
  const LikeBadge = () => {
    const style = useAnimatedStyle(() => ({
      opacity: interpolate(
        translateX.value,
        [0, 60],        // When dragging from 0 to 60 (RIGHT)
        [0, 1],         // Opacity goes from Invisible to Visible
        Extrapolation.CLAMP
      ),
    }));
    return (
      <Animated.View style={[styles.overlayBadge, { left: 40, borderColor: '#4CD964', transform: [{ rotate: '-15deg' }] }, style]}>
        <Text style={[styles.overlayText, { color: '#4CD964' }]}>APPROVE</Text>
      </Animated.View>
    );
  };

  const NopeBadge = () => {
    const style = useAnimatedStyle(() => ({
      opacity: interpolate(
        translateX.value,
        [-60, 0],       // When dragging from -60 to 0 (LEFT)
        [1, 0],         // Opacity goes from Visible to Invisible
        Extrapolation.CLAMP
      ),
    }));
    return (
      <Animated.View style={[styles.overlayBadge, { right: 40, borderColor: '#FF3B30', transform: [{ rotate: '15deg' }] }, style]}>
        <Text style={[styles.overlayText, { color: '#FF3B30' }]}>DECLINE</Text>
      </Animated.View>
    );
  };

  const renderCard = (card: RSVPCardData, index: number) => {
    const isFront = index === currentIndex;
    const isNext = index === currentIndex + 1;

    if (!isFront && !isNext) return null;

    // Rank Logic for display
    const rankColor = card.rank_data.tier === 'Gold' ? '#FFD700' : 
                      card.rank_data.tier === 'Silver' ? '#C0C0C0' : '#CD7F32';

    return (
      <Animated.View
        key={card.attendance_id}
        style={[
          styles.cardContainer,
          { zIndex: cards.length - index }, // Stack order
          isFront ? cardStyle : nextCardStyle,
        ]}
      >
        <GestureDetector gesture={isFront ? gesture : Gesture.Tap()}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Overlay Badges */}
            {isFront && <LikeBadge />}
            {isFront && <NopeBadge />}

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              {/* Header Reuse */}
              <View style={{ marginTop: 16 }}>
                 <ProfileHeader
                    profilePictureUrl={card.user_profile.profile_picture_url || undefined}
                    initials={(card.user_profile.first_name?.[0] || '') + (card.user_profile.last_name?.[0] || '')}
                    displayName={`${card.user_profile.first_name} ${card.user_profile.last_name}`}
                    subtitle={card.user_profile.major || 'No Major'}
                    secondarySubtitle={card.user_profile.graduation_year ? `Class of ${card.user_profile.graduation_year}` : undefined}
                    isDark={isDark}
                    themeText={theme.text}
                    themeSubtext={theme.subtext}
                    userTypeBadge={card.rank_data.tier} // Showing Rank as badge
                  />
              </View>
             

              {/* Points Summary */}
              <View style={[styles.statsRow, { borderColor: theme.border }]}>
                 <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.primary }]}>{card.rank_data.points_total}</Text>
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>Points</Text>
                 </View>
                 <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
                    <Text style={[styles.statValue, { color: rankColor }]}>{card.rank_data.tier}</Text>
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>Current Tier</Text>
                 </View>
              </View>

              <View style={styles.divider} />

              {/* Registration Answers */}
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Application Answers</Text>
              
              {Object.entries(card.registration_answers).length > 0 ? (
                Object.entries(card.registration_answers).map(([question, answer], i) => (
                  <View key={i} style={[styles.answerBox, { backgroundColor: theme.background }]}>
                    <Text style={[styles.questionText, { color: theme.subtext }]}>{question}</Text>
                    <Text style={[styles.answerText, { color: theme.text }]}>{String(answer)}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.subtext, fontStyle: 'italic', textAlign: 'center' }}>
                  No questions were asked for this event.
                </Text>
              )}

            </ScrollView>
          </View>
        </GestureDetector>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (currentIndex >= cards.length) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="checkmark-done-circle" size={80} color={theme.primary} />
        <Text style={[styles.finishedTitle, { color: theme.text }]}>All Done!</Text>
        <Text style={[styles.finishedSub, { color: theme.subtext }]}>No more pending requests.</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.card }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: theme.text }}>Back to List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Review Request</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Card Stack */}
        <View style={styles.cardStack}>
          {cards.map((card, index) => renderCard(card, index))}
        </View>

        {/* Buttons (Alternative to swipe) */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]} 
            onPress={() => {
              translateX.value = withSpring(-SCREEN_WIDTH * 1.5, {}, () => runOnJS(handleSwipeComplete)('left'));
            }}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#4CD964' }]}
            onPress={() => {
               translateX.value = withSpring(SCREEN_WIDTH * 1.5, {}, () => runOnJS(handleSwipeComplete)('right'));
            }}
          >
            <Ionicons name="checkmark" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  cardContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: '100%',
    maxHeight: 600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  answerBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 40,
    paddingTop: 10,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  overlayBadge: {
    position: 'absolute',
    top: 50,
    borderWidth: 4,
    borderRadius: 8,
    padding: 8,
    zIndex: 999,
  },
  overlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  finishedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  finishedSub: {
    marginTop: 8,
    marginBottom: 30,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});