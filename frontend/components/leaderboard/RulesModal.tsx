import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/colors';

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.modalHeader, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Ranking Rules</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.ruleCard, { backgroundColor: theme.card }, SHADOWS.small]}>
            <Ionicons name="trophy" size={32} color={theme.primary} style={styles.ruleIcon} />
            <Text style={[styles.ruleTitle, { color: theme.text }]}>How Rankings Work</Text>
            <Text style={[styles.ruleDescription, { color: theme.subtext }]}>
              Members earn points by attending events, completing challenges, and engaging with
              the community. Your rank is determined by your total points.
            </Text>
          </View>

          <View style={[styles.ruleCard, { backgroundColor: theme.card }, SHADOWS.small]}>
            <Ionicons name="calendar" size={32} color={theme.primary} style={styles.ruleIcon} />
            <Text style={[styles.ruleTitle, { color: theme.text }]}>Event Attendance</Text>
            <Text style={[styles.ruleDescription, { color: theme.subtext }]}>
              Attend events and check in to earn points. Bonus points for early check-ins!
            </Text>
          </View>

          <View style={[styles.ruleCard, { backgroundColor: theme.card }, SHADOWS.small]}>
            <Ionicons name="time" size={32} color={theme.primary} style={styles.ruleIcon} />
            <Text style={[styles.ruleTitle, { color: theme.text }]}>Time Periods</Text>
            <Text style={[styles.ruleDescription, { color: theme.subtext }]}>
              View rankings for this month, this semester, or all-time to see how you compare.
            </Text>
          </View>

          <View style={[styles.ruleCard, { backgroundColor: theme.card }, SHADOWS.small]}>
            <Ionicons name="medal" size={32} color={theme.primary} style={styles.ruleIcon} />
            <Text style={[styles.ruleTitle, { color: theme.text }]}>Rank Tiers</Text>
            <Text style={[styles.ruleDescription, { color: theme.subtext }]}>
              Progress through Bronze (25+ pts), Silver (50+ pts), and Gold (75+ pts) tiers as
              you earn more points.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalTitle: {
    ...TYPOGRAPHY.headline,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  ruleCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.md,
  },
  ruleIcon: {
    marginBottom: SPACING.sm,
  },
  ruleTitle: {
    ...TYPOGRAPHY.title,
    marginBottom: SPACING.sm,
  },
  ruleDescription: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
  },
});
