import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommitteeMembers } from '@/hooks/committees';
import { MembersModal } from './MembersModal';

interface ViewMembersButtonProps {
  committeeSlug: string;
  committeeTitle: string;
}

export const ViewMembersButton: React.FC<ViewMembersButtonProps> = ({
  committeeSlug,
  committeeTitle,
}) => {
  const { theme, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const { totalCount, isLoading } = useCommitteeMembers(committeeSlug);

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: isDark ? '#2C2C2E' : '#E8E5E0',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.buttonContent}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F5F3F0' }]}>
            <Ionicons name="people" size={22} color={isDark ? '#FFFFFF' : '#1C1C1E'} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.buttonTitle, { color: theme.text }]}>
              Committee Members
            </Text>
            {!isLoading && (
              <Text style={[styles.buttonSubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
                {totalCount} {totalCount === 1 ? 'member' : 'members'}
              </Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={22} color={isDark ? '#8E8E93' : '#C7C7CC'} />
        </View>
      </Pressable>

      <MembersModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        committeeSlug={committeeSlug}
        committeeTitle={committeeTitle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  button: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  buttonSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
