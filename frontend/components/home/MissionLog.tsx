import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS } from '@/constants/colors';

// Placeholder Interface
interface MyEvent {
  id: string;
  title: string;
  date: string; // ISO
  location: string;
}

interface MissionLogProps {
  events: MyEvent[];
  onPress: (id: string) => void;
}

export function MissionLog({ events, onPress }: MissionLogProps) {
  if (!events || events.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>MISSION LOG</Text>
        <TouchableOpacity>
            <Text style={styles.seeAll}>SEE ALL</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {events.map((event) => {
          const dateObj = new Date(event.date);
          const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
          const day = dateObj.getDate();

          return (
            <TouchableOpacity 
              key={event.id} 
              activeOpacity={0.7}
              onPress={() => onPress(event.id)}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Date Block */}
                <View style={styles.dateBlock}>
                  <Text style={styles.dateMonth}>{month}</Text>
                  <Text style={styles.dateDay}>{day}</Text>
                </View>

                {/* Divider Line */}
                <View style={styles.divider} />

                {/* Info Block */}
                <View style={styles.infoBlock}>
                  <Text style={styles.title} numberOfLines={1}>{event.title.toUpperCase()}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={10} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.location} numberOfLines={1}>{event.location}</Text>
                  </View>
                </View>

                {/* Arrow */}
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  header: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  seeAll: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  card: {
    width: 220, // Wide enough for text
    height: 70,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
  },
  dateMonth: {
    color: '#FFD700',
    fontSize: 9,
    fontWeight: '800',
  },
  dateDay: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 12,
  },
  infoBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
  },
});