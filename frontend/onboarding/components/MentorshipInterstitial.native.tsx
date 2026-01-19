import { useEffect, useRef, useState } from 'react';
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
const ANIMATION_DURATION = 500; // Slightly faster for profile interactions

const MENTORSHIP_WAYS = [
  { id: 'resume-reviews', label: 'Resume Reviews', icon: 'document-text-outline' },
  { id: 'mock-interviews', label: 'Mock Interviews', icon: 'mic-outline' },
  { id: 'coffee-chats', label: 'Coffee Chats', icon: 'cafe-outline' },
  { id: 'company-tours', label: 'Company Tours', icon: 'business-outline' },
];

const VALID_WAY_IDS = new Set(MENTORSHIP_WAYS.map(w => w.id));

interface MentorshipInterstitialProps {
  visible: boolean;
  onDecline: () => void;
  onAccept: (selectedWays: string[]) => void;
  onDismiss: () => void;
  initialSelected?: string[]; // Add this to pre-fill choices
  isEditing?: boolean; // True when editing from profile (user is already a mentor)
}

export default function MentorshipInterstitial({
  visible,
  onDecline,
  onAccept,
  onDismiss,
  initialSelected = [],
  isEditing = false,
}: MentorshipInterstitialProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedWays, setSelectedWays] = useState<string[]>(initialSelected);
  const [showError, setShowError] = useState(false);
  const [isMounted, setIsMounted] = useState(visible);

  // Track previous visible state to detect when modal opens
  const prevVisibleRef = useRef(visible);

  // Sync state when modal opens (visible changes from false to true)
  useEffect(() => {
    const justOpened = visible && !prevVisibleRef.current;
    prevVisibleRef.current = visible;

    if (justOpened) {
      setIsMounted(true);
      // Filter initialSelected to only include valid IDs (handles legacy data migration)
      const validInitialSelected = initialSelected.filter(id => VALID_WAY_IDS.has(id));
      setSelectedWays(validInitialSelected);
      setShowError(false);
      // If editing (user is already a mentor), auto-expand to show editing view
      setExpanded(isEditing);
    }
  }, [visible, initialSelected, isEditing]);

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
    // During onboarding (not editing), require at least one selection
    if (selectedWays.length === 0 && !isEditing) {
      setShowError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // If editing and all selections removed, this will disable mentorship
    // If selections exist, this enables/updates mentorship
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
        {/* Blur Backdrop */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Dark Overlay for contrast */}
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' }} />
        </Pressable>

        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ translateY: SCREEN_HEIGHT }}
              animate={{ translateY: 0 }}
              exit={{ translateY: SCREEN_HEIGHT }}
              transition={{ 
                type: 'timing', 
                duration: ANIMATION_DURATION, 
                easing: Easing.out(Easing.exp) 
              }}
              style={styles.sheet}
            >
              <View style={styles.handle} />

              <View style={styles.content}>
                {/* REWARD BADGE */}
                {!expanded && (
                    <MotiView 
                    from={{ opacity: 0, translateY: 5 }} 
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 300 }}
                    style={styles.rewardBadge}
                    >
                    <Ionicons name="medal" size={16} color="#FFD700" />
                    <Text style={styles.rewardText}>+50 LEGACY POINTS</Text>
                    </MotiView>
                )}

                <Text style={styles.headline}>
                    {isEditing ? "Mentor Settings" : "The Legacy Program"}
                </Text>
                <Text style={styles.body}>
                  {isEditing
                    ? "Update how you wish to contribute to the next generation of engineers."
                    : "Pass the torch to the next generation. Mentors receive exclusive badges and priority placement in the networking directory."
                  }
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
                        <Text style={styles.primaryButtonText}>Become a Mentor</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onDecline} style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
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
                        colors={selectedWays.length === 0 && isEditing
                          ? ['#FF453A', '#CC362E']
                          : ['#FFD700', '#B8860B']}
                        style={styles.continueButton}
                      >
                        <Text style={styles.primaryButtonText}>
                            {selectedWays.length === 0 && isEditing
                              ? "Remove Mentor Status"
                              : isEditing
                                ? "Update Status"
                                : "Confirm Status"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    {/* Add Cancel Option in Expanded View */}
                    <TouchableOpacity onPress={onDecline} style={[styles.secondaryButton, { marginTop: 12 }]}>
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
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
    backgroundColor: '#050505', // Deep Black
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 16,
  },
  content: { padding: 24 },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  rewardText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  subHeadline: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonGroup: { gap: 16 },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#000', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  secondaryButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    gap: 8,
  },
  selectedChip: { backgroundColor: '#FFF', borderColor: '#FFF' },
  chipText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  selectedChipText: { color: '#000' },
  continueButton: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FFD700',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  errorText: { color: '#FF453A', textAlign: 'center', marginBottom: 16, fontSize: 13, fontWeight: '700' },
});