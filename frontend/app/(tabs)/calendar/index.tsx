import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarHeader } from '../../../components/calendar/CalendarHeader';
import { TagChips } from '../../../components/calendar/TagChips';
import { LumaEventCard } from '../../../components/calendar/LumaEventCard';
import { Sidebar } from '../../../components/calendar/Sidebar';
import { Event } from '../../../data/mockEvents';
import { groupEventsByDate, getAllTags } from '../../../utils/date';
import { useEvents } from '../../../context/EventsContext';

export default function CalendarScreen() {
  const router = useRouter();
  const { events, isAdminMode, toggleAdminMode, deleteEvent } = useEvents();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming');
  const sectionListRef = useRef<SectionList>(null);

  // Get all unique tags
  const allTags = useMemo(() => getAllTags(events), [events]);

  // Filter events based on time and tag
  const filteredEvents = useMemo(() => {
    let filtered = events.filter((event) => event.status === timeFilter);

    if (selectedTag) {
      filtered = filtered.filter((event) => event.tags.includes(selectedTag));
    }

    return filtered;
  }, [events, timeFilter, selectedTag]);

  // Group events by date
  const sections = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  // Build dateKey -> sectionIndex lookup map
  const dateKeyToSectionIndex = useMemo(() => {
    const map = new Map<string, number>();
    sections.forEach((section, index) => {
      map.set(section.dateKey, index);
    });
    return map;
  }, [sections]);

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const handleAddEvent = () => {
    router.push({
      pathname: '/(modals)/event-form',
      params: { mode: 'create' },
    });
  };

  const handleEditEvent = (eventId: string) => {
    router.push({
      pathname: '/(modals)/event-form',
      params: { mode: 'edit', id: eventId },
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
  };

  // Handle date selection from mini calendar
  const handleDateSelect = (date: Date) => {
    // Format date to match our dateKey format
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const sectionIndex = dateKeyToSectionIndex.get(dateKey);

    if (sectionIndex !== undefined && sectionListRef.current) {
      // Scroll to the section
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewOffset: 0,
      });
    } else {
      // No events found for this date
      Alert.alert(
        'No Events',
        `No ${timeFilter} events found for ${date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderSectionHeader = ({ section }: any) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderEvent = ({ item }: { item: Event }) => (
    <LumaEventCard
      event={item}
      onPress={() => handleEventPress(item.id)}
      isAdminMode={isAdminMode}
      onEdit={() => handleEditEvent(item.id)}
      onDelete={() => handleDeleteEvent(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {selectedTag
          ? `No ${timeFilter} events with "${selectedTag}" tag`
          : `No ${timeFilter} events`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        ref={sectionListRef}
        sections={sections}
        renderItem={renderEvent}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Hero Header */}
            <CalendarHeader
              coverImageUrl="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"
              title="SHPE NJIT"
              subtitle="Society of Hispanic Professional Engineers at NJIT. Building a community of Hispanic engineers and scientists."
              onSubscribe={() => console.log('Subscribe toggled')}
              onBack={() => router.back()}
            />

            {/* Admin Mode Toggle */}
            <View style={styles.adminToggleContainer}>
              <Pressable style={styles.adminToggle} onPress={toggleAdminMode}>
                <Text style={styles.adminToggleText}>
                  {isAdminMode ? 'Admin Mode: ON' : 'Admin Mode: OFF'}
                </Text>
              </Pressable>
            </View>

            {/* Tag Filter Chips */}
            <TagChips tags={allTags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />

            {/* Add Event Button (Admin Only) */}
            {isAdminMode && (
              <View style={styles.addButtonContainer}>
                <Pressable
                  style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                  onPress={handleAddEvent}
                >
                  <Text style={styles.addButtonText}>+ Submit Event</Text>
                </Pressable>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <>
            {/* Sidebar at bottom on mobile */}
            <View style={styles.sidebarContainer}>
              <Sidebar
                onDateSelect={handleDateSelect}
                timeFilter={timeFilter}
                onTimeFilterChange={setTimeFilter}
              />
            </View>
          </>
        }
        ListEmptyComponent={renderEmptyState}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  listContent: {
    paddingBottom: 32,
  },
  adminToggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  adminToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adminToggleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '500',
  },
  addButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  addButtonPressed: {
    opacity: 0.75,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeader: {
    backgroundColor: '#0A0F1C',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.90)',
    letterSpacing: -0.2,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
  },
  sidebarContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
});
