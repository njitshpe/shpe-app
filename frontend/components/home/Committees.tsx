import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '@/constants/colors';

const COMMITTEES = [
  { id: 'external-vp', label: 'External VP', icon: 'globe-outline', color: '#5E5CE6' },
  { id: 'internal-vp', label: 'Internal VP', icon: 'people-outline', color: '#FF9F0A' },
  { id: 'treasurer', label: 'Treasurer', icon: 'cash-outline', color: '#30D158' },
  { id: 'webmaster', label: 'Webmaster', icon: 'code-slash-outline', color: '#64D2FF' },
  { id: 'secretary', label: 'Secretary', icon: 'document-text-outline', color: '#BF5AF2' },
  { id: 'public-relations', label: 'Public Relations', icon: 'chatbubbles-outline', color: '#FF375F' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone-outline', color: '#FF6482' },
  { id: 'event-coordinator', label: 'Event Coordinator', icon: 'calendar-outline', color: '#0A84FF' },
  { id: 'outreach', label: 'Outreach', icon: 'hand-left-outline', color: '#32D74B' },
  { id: 'pre-college', label: 'Pre-College', icon: 'school-outline', color: '#FFD60A' },
  { id: 'membership', label: 'Membership Dev', icon: 'person-add-outline', color: '#AC8E68' },
  { id: 'shpetinas', label: 'SHPEtinas', icon: 'flower-outline', color: '#FF6B9D' },
  { id: 'internshpe', label: 'InternSHPE', icon: 'briefcase-outline', color: '#00CED1' },
];

interface CommitteesProps {
  onPress: (committeeId: string) => void;
}

export function Committees({ onPress }: CommitteesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>COMMITTEES</Text>

      <View style={styles.listContent}>
        {COMMITTEES.map((committee) => (
          <TouchableOpacity
            key={committee.id}
            activeOpacity={0.8}
            onPress={() => onPress(committee.id)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.iconHalo, { backgroundColor: `${committee.color}20` }]}>
                <Ionicons name={committee.icon as any} size={20} color={committee.color} />
              </View>
              <Text style={styles.cardLabel}>{committee.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: SPACING.md,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  listContent: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  iconHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
