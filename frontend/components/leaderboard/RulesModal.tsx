import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, RADIUS } from '@/constants/colors';

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ visible, onClose }) => {
  const { theme, isDark } = useTheme();

  // Glass Styles
  const glassBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const iconHalo = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#000000'] : ['#FFFFFF', '#F2F2F7']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: glassBorder }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>RANKING PROTOCOLS</Text>
            <TouchableOpacity 
              onPress={onClose} 
              activeOpacity={0.7}
              style={[styles.closeButton, { backgroundColor: iconHalo }]}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Card 1: System */}
            <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="trophy" size={24} color={theme.primary} />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>SCORING SYSTEM</Text>
                <Text style={[styles.cardDescription, { color: theme.subtext }]}>
                  Members earn points by attending events, completing challenges, and engaging with the community. Your rank is calculated in real-time.
                </Text>
              </View>
            </View>

            {/* Card 2: Attendance */}
            <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="calendar" size={24} color={theme.primary} />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>ATTENDANCE</Text>
                <Text style={[styles.cardDescription, { color: theme.subtext }]}>
                  Check in to events via the app to earn points. Early check-ins may award bonus points depending on the event configuration.
                </Text>
              </View>
            </View>

            {/* Card 3: Scopes */}
            <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="time" size={24} color={theme.primary} />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>TIME SCOPES</Text>
                <Text style={[styles.cardDescription, { color: theme.subtext }]}>
                  Leaderboards are divided into Monthly, Semester, and All-Time standings.
                </Text>
              </View>
            </View>

            {/* Card 4: Tiers */}
            <View style={[styles.glassCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="medal" size={24} color={theme.primary} />
              </View>
              <View style={styles.cardTextContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>CLASSIFICATION TIERS</Text>
                <Text style={[styles.cardDescription, { color: theme.subtext, marginBottom: 12 }]}>
                  Your total points determine your badge tier:
                </Text>
                
                {/* Tier List */}
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: '#CD7F32' }]} />
                  <Text style={[styles.tierText, { color: theme.text }]}>BRONZE</Text>
                  <Text style={[styles.tierPoints, { color: theme.subtext }]}>5+ PTS</Text>
                </View>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: '#C0C0C0' }]} />
                  <Text style={[styles.tierText, { color: theme.text }]}>SILVER</Text>
                  <Text style={[styles.tierPoints, { color: theme.subtext }]}>150+ PTS</Text>
                </View>
                <View style={styles.tierRow}>
                  <View style={[styles.tierDot, { backgroundColor: '#FFD700' }]} />
                  <Text style={[styles.tierText, { color: theme.text }]}>GOLD</Text>
                  <Text style={[styles.tierPoints, { color: theme.subtext }]}>350+ PTS</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: RADIUS.full,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  glassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: SPACING.lg,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContent: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    width: 60,
  },
  tierPoints: {
    fontSize: 12,
    opacity: 0.6,
  },
});