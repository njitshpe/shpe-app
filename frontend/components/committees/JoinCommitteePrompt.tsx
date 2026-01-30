import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { MembershipStatus } from '@/hooks/committees';
import { CommitteeInfo } from '@/utils/committeeUtils';
import { getJoinFormConfig } from '@/config/committeeJoinForms';
import { JoinQuestionnaireModal } from './JoinQuestionnaireModal';

interface JoinCommitteePromptProps {
  committee: CommitteeInfo;
  status: MembershipStatus;
  onRequestJoin: (answers?: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  onCancelRequest: () => Promise<{ success: boolean; error?: string }>;
}

export const JoinCommitteePrompt: React.FC<JoinCommitteePromptProps> = ({
  committee,
  status,
  onRequestJoin,
  onCancelRequest,
}) => {
  const { theme, isDark } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const formConfig = useMemo(() => getJoinFormConfig(committee.id), [committee.id]);

  const handleJoin = () => {
    setIsQuestionnaireOpen(true);
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    await onCancelRequest();
    setIsSubmitting(false);
  };

  const renderContent = () => {
    if (status === 'pending') {
      return (
        <>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255, 159, 10, 0.1)' }]}>
            <Ionicons name="time-outline" size={40} color="#FF9F0A" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Request Pending</Text>
          <Text style={[styles.description, { color: isDark ? '#999' : '#666' }]}>
            Your request to join {committee.title} is being reviewed. You'll be notified once an admin approves your request.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: isDark ? 'rgba(255, 55, 95, 0.15)' : 'rgba(255, 55, 95, 0.1)',
                opacity: pressed ? 0.7 : 1
              }
            ]}
            onPress={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FF375F" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            )}
          </Pressable>
        </>
      );
    }

    if (status === 'rejected') {
      return (
        <>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255, 55, 95, 0.15)' : 'rgba(255, 55, 95, 0.1)' }]}>
            <Ionicons name="close-circle-outline" size={40} color="#FF375F" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Request Declined</Text>
          <Text style={[styles.description, { color: isDark ? '#999' : '#666' }]}>
            Your request to join {committee.title} was not approved at this time. Please reach out to a committee chair for more information.
          </Text>
        </>
      );
    }

    if (status === 'revoked') {
      return (
        <>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255, 159, 10, 0.1)' }]}>
            <Ionicons name="alert-circle-outline" size={40} color="#FF9F0A" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Membership Revoked</Text>
          <Text style={[styles.description, { color: isDark ? '#999' : '#666' }]}>
            Your membership in {committee.title} has been revoked. Please contact a committee chair if you believe this was in error.
          </Text>
        </>
      );
    }

    // Default: not a member (status === null)
    return (
      <>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? `${committee.color}20` : `${committee.color}15` }]}>
          <Ionicons name={committee.icon as any} size={40} color={committee.color} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Join This Committee</Text>
        <Text style={[styles.description, { color: isDark ? '#999' : '#666' }]}>
          Become a member of {committee.title} to view events, connect with other members, and participate in committee activities.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.joinButton,
            {
              backgroundColor: committee.color,
              opacity: pressed ? 0.8 : 1
            }
          ]}
          onPress={handleJoin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.joinButtonText}>Request to Join</Text>
            </>
          )}
        </Pressable>
      </>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
      {renderContent()}
      <JoinQuestionnaireModal
        visible={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        onSubmit={onRequestJoin}
        committee={committee}
        formConfig={formConfig}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 180,
  },
  buttonIcon: {
    marginRight: 8,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 160,
  },
  cancelButtonText: {
    color: '#FF375F',
    fontSize: 15,
    fontWeight: '500',
  },
});
