import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Modal } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { QRScannerScreen } from './QRScannerScreen';

interface HomeScreenProps {
  onNavigateToProfile: () => void;
}

export function HomeScreen({ onNavigateToProfile }: HomeScreenProps) {
  const { user, signOut, updateUserMetadata, profile } = useAuth();
  const [showScanner, setShowScanner] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.title}>SHPE NJIT</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎉 Auth Working!</Text>
          <Text style={styles.infoText}>
            You've successfully authenticated with Supabase.
            This is a placeholder home screen for devs.
          </Text>
        </View>

        <View style={styles.debugCard}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>User ID: {user?.id}</Text>
          <Text style={styles.debugText}>
            Created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </Text>

          <View style={styles.debugActions}>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={async () => {
                try {
                  await updateUserMetadata({ onboarding_completed: false });
                  Alert.alert('Success', 'Onboarding reset! Restart the app to see changes.');
                } catch (e) {
                  Alert.alert('Error', 'Failed to reset onboarding');
                }
              }}
            >
              <Text style={styles.debugButtonText}>Reset Onboarding</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => {
                console.log('User:', JSON.stringify(user, null, 2));
                console.log('Profile:', JSON.stringify(profile, null, 2));
                Alert.alert('Logged', 'User data logged to console');
              }}
            >
              <Text style={styles.debugButtonText}>Log User Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.profileButton} onPress={onNavigateToProfile}>
        <Text style={styles.profileButtonText}>View Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.scannerButton} onPress={() => setShowScanner(true)}>
        <Text style={styles.scannerButtonText}>Scan Event QR Code</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Modal visible={showScanner} animationType="slide" presentationStyle="fullScreen">
        <QRScannerScreen
          onClose={() => setShowScanner(false)}
          onSuccess={(eventName: string) => Alert.alert('Check-in Success', `Checked in to ${eventName}!`)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60,
  },
  content: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: '#D35400',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  email: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  debugCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  debugActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  debugButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  profileButton: {
    backgroundColor: '#D35400',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  profileButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  signOutText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  scannerButton: {
    backgroundColor: '#002855',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  scannerButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});