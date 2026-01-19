import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Easing } from 'react-native-reanimated';
import { SPACING, RADIUS } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANIMATION_DURATION = 700;

const MENTORSHIP_WAYS = [
  { id: 'resume-reviews', label: 'Resume Reviews', icon: 'document-text-outline' },
  { id: 'mock-interviews', label: 'Mock Interviews', icon: 'mic-outline' },
  { id: 'coffee-chats', label: 'Coffee Chats', icon: 'cafe-outline' },
  { id: 'company-tours', label: 'Company Tours', icon: 'business-outline' },
];

interface MentorshipInterstitialProps {
  visible: boolean;
  onDecline: () => void;
  onAccept: (selectedWays: string[]) => void;
  onDismiss: () => void;
}

export default function MentorshipInterstitial({
  visible,
  onDecline,
  onAccept,
  onDismiss,
}: MentorshipInterstitialProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedWays, setSelectedWays] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible && isMounted) {
      const timer = setTimeout(() => setIsMounted(false), ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, isMounted]);

  const handleWayToggle = (wayId: string) => {
    Haptics.selectionAsync();
    setSelectedWays((prev) =>
      prev.includes(wayId)
        ? prev.filter((id) => id !== wayId)
        : [...prev, wayId]
    );
    setShowError(false);
  };

  const handleContinue = () => {
    if (selectedWays.length === 0) {
      setShowError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept(selectedWays);
  };

  if (!isMounted) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.modalContainer}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ translateY: SCREEN_HEIGHT }}
              animate={{ translateY: 0 }}
              exit={{ translateY: SCREEN_HEIGHT }}
              // REMOVED BOUNCE: Switched to smooth cubic easing
              transition={{ 
                type: 'timing', 
                duration: ANIMATION_DURATION, 
                easing: Easing.out(Easing.exp) 
              }}
              style={styles.sheet}
            >
              <View style={styles.handle} />

              <View style={styles.content}>
                {/* REWARD BADGE: Shimmering Gold */}
                <MotiView 
                  from={{ opacity: 0, translateY: 5 }} 
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 300 }}
                  style={styles.rewardBadge}
                >
                  <Ionicons name="medal" size={16} color="#FFD700" />
                  <Text style={styles.rewardText}>+50 LEGACY POINTS</Text>
                </MotiView>

                <Text style={styles.headline}>The Legacy Program</Text>
                <Text style={styles.body}>
                  Pass the torch to the next generation. Mentors receive exclusive 
                  badges and priority placement in the networking directory.
                </Text>

                {!expanded ? (
                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        setExpanded(true);
                      }}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={['#FFFFFF', '#E2E8F0']}
                        style={styles.primaryButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.primaryButtonText}>Be a Mentor</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onDecline} style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Enroll later</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <MotiView 
                    from={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: 300 }}
                  >
                    <Text style={styles.subHeadline}>Ways you can help</Text>
                    
                    <View style={styles.grid}>
                      {MENTORSHIP_WAYS.map((way) => {
                        const isSelected = selectedWays.includes(way.id);
                        return (
                          <TouchableOpacity
                            key={way.id}
                            onPress={() => handleWayToggle(way.id)}
                            style={[styles.glassChip, isSelected && styles.selectedChip]}
                          >
                            <Ionicons 
                              name={way.icon as any} 
                              size={18} 
                              color={isSelected ? '#000' : '#FFF'} 
                            />
                            <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                              {way.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {showError && (
                      <Text style={styles.errorText}>Select at least one area of impact</Text>
                    )}

                    <TouchableOpacity onPress={handleContinue} activeOpacity={0.9}>
                      <LinearGradient
                        colors={['#FFD700', '#B8860B']}
                        style={styles.continueButton}
                      >
                        <Text style={styles.primaryButtonText}>Confirm Status</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </MotiView>
                )}
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#000',
    borderTopLeftRadius: RADIUS.xl * 1.5,
    borderTopRightRadius: RADIUS.xl * 1.5,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  content: { padding: SPACING.xl },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  rewardText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  body: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 14,
    marginBottom: 40,
  },
  subHeadline: {
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonGroup: { gap: 16 },
  primaryButton: {
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  secondaryButton: { height: 50, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: 'rgba(255,255,255,0.25)', fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: RADIUS.xl,
    gap: 10,
  },
  selectedChip: { backgroundColor: '#FFF', borderColor: '#FFF' },
  chipText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  selectedChipText: { color: '#000' },
  continueButton: {
    height: 64,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FFD700',
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  errorText: { color: '#FF453A', textAlign: 'center', marginBottom: 20, fontSize: 12, fontWeight: '800' },
});
