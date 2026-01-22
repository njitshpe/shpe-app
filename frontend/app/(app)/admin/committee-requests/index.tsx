import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { adminCommitteeService, PendingCommitteeRequest } from '@/services/adminCommittee.service';

export default function CommitteeRequestsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PendingCommitteeRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      const response = await adminCommitteeService.getPendingRequests();
      if (response.success && response.data) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Failed to load committee requests', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDecision = async (request: PendingCommitteeRequest, action: 'approve' | 'reject') => {
    const actionLabel = action === 'approve' ? 'Approve' : 'Reject';
    Alert.alert(
      `${actionLabel} Request`,
      `Are you sure you want to ${action} ${request.user_profile?.first_name || 'this user'} for ${request.committee_title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: async () => {
            const result = await adminCommitteeService.processRequest(
              request.committee_id,
              request.user_id,
              action
            );
            if (!result.success) {
              Alert.alert('Error', result.error.message);
              return;
            }
            setRequests((prev) => prev.filter((item) => `${item.committee_id}:${item.user_id}` !== `${request.committee_id}:${request.user_id}`));
          },
        },
      ]
    );
  };

  const renderApplication = (application: Record<string, any> | null) => {
    if (!application || Object.keys(application).length === 0) {
      return (
        <Text style={[styles.applicationEmpty, { color: theme.subtext }]}>No application details provided.</Text>
      );
    }

    return Object.entries(application).map(([key, value]) => {
      const formattedValue = Array.isArray(value) ? value.join(', ') : String(value ?? '');
      return (
        <View key={key} style={styles.applicationRow}>
          <Text style={[styles.applicationKey, { color: theme.subtext }]}>{key.replace(/_/g, ' ')}:</Text>
          <Text style={[styles.applicationValue, { color: theme.text }]}>{formattedValue}</Text>
        </View>
      );
    });
  };

  const renderItem = ({ item }: { item: PendingCommitteeRequest }) => {
    const key = `${item.committee_id}:${item.user_id}`;
    const isExpanded = !!expanded[key];
    const initials = item.user_profile
      ? `${item.user_profile.first_name?.[0] || ''}${item.user_profile.last_name?.[0] || ''}`.toUpperCase()
      : 'NA';

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={styles.cardHeader}>
          {item.user_profile?.profile_picture_url ? (
            <Image source={{ uri: item.user_profile.profile_picture_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: theme.primary + '20' }]}> 
              <Text style={[styles.avatarText, { color: theme.primary }]}>{initials}</Text>
            </View>
          )}

          <View style={styles.cardInfo}>
            <Text style={[styles.name, { color: theme.text }]}>
              {item.user_profile ? `${item.user_profile.first_name} ${item.user_profile.last_name}` : 'Unknown User'}
            </Text>
            <Text style={[styles.committee, { color: theme.subtext }]}>{item.committee_title}</Text>
            <Text style={[styles.date, { color: theme.subtext }]}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleDecision(item, 'approve')}
          >
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleDecision(item, 'reject')}
          >
            <Ionicons name="close" size={18} color="#FFFFFF" />
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.border }]}
            onPress={() => toggleExpanded(key)}
          >
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.text} />
            <Text style={[styles.actionText, { color: theme.text }]}>Application</Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.applicationContainer}>
            {renderApplication(item.application)}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.header, { backgroundColor: theme.card, paddingTop: insets.top }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Committee Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}> 
            <Ionicons name="checkmark-done-circle" size={64} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>All Caught Up!</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>No committee requests pending review.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.committee_id}:${item.user_id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  committee: {
    fontSize: 13,
  },
  date: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flex: 1,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  applicationContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  applicationRow: {
    gap: 4,
  },
  applicationKey: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  applicationValue: {
    fontSize: 14,
  },
  applicationEmpty: {
    fontSize: 13,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
