import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { reportService, type Report, type ReportStatus } from '@/services';

export default function MyReportsScreen() {
  const { theme, isDark } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const response = await reportService.fetchMyReports();

    if (response.success) {
      setReports(response.data);
    } else {
      console.error('[MyReports] Failed to load reports:', response.error?.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'open':
        return theme.error;
      case 'reviewing':
        return '#FFA500';
      case 'actioned':
        return theme.success;
      case 'closed':
        return theme.subtext;
      default:
        return theme.text;
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'open':
        return 'alert-circle';
      case 'reviewing':
        return 'time';
      case 'actioned':
        return 'checkmark-circle';
      case 'closed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getTargetTypeLabel = (targetType: string) => {
    switch (targetType) {
      case 'post':
        return 'Post';
      case 'user':
        return 'User';
      default:
        return targetType;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const renderReport = ({ item }: { item: Report }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const targetTypeLabel = getTargetTypeLabel(item.target_type);

    return (
      <View style={[styles.reportCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Header with target type and date */}
        <View style={styles.reportHeader}>
          <View style={styles.targetTypeContainer}>
            <Ionicons
              name={item.target_type === 'post' ? 'document-text' : 'person'}
              size={16}
              color={theme.subtext}
            />
            <Text style={[styles.targetTypeText, { color: theme.subtext }]}>
              {targetTypeLabel}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: theme.subtext }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        {/* Reason */}
        <View style={styles.reasonContainer}>
          <Text style={[styles.reasonLabel, { color: theme.subtext }]}>Reason:</Text>
          <Text style={[styles.reasonText, { color: theme.text }]}>{item.reason}</Text>
        </View>

        {/* Details (if provided) */}
        {item.details && (
          <View style={styles.detailsContainer}>
            <Text style={[styles.detailsText, { color: theme.subtext }]} numberOfLines={2}>
              "{item.details}"
            </Text>
          </View>
        )}

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColor + '20',
                borderColor: statusColor,
              },
            ]}
          >
            <Ionicons name={statusIcon as any} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Resolution info */}
        {item.resolved_at && (
          <View style={styles.resolvedContainer}>
            <Text style={[styles.resolvedText, { color: theme.subtext }]}>
              Resolved on {new Date(item.resolved_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
        <Ionicons name="flag-outline" size={48} color={theme.subtext} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Reports Submitted</Text>
      <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
        You haven't submitted any reports yet.{'\n'}
        Reports help keep our community safe.
      </Text>
    </View>
  );

  const dynamicStyles = {
    container: { backgroundColor: theme.background },
  };

  if (loading) {
    return (
      <View style={[styles.container, dynamicStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.subtext }]}>
          Loading your reports...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={
          reports.length === 0 ? styles.emptyListContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetTypeText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  reasonLabel: {
    fontSize: 14,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailsContainer: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  detailsText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resolvedContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  resolvedText: {
    fontSize: 12,
  },
});
