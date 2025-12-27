import React, { useState, Suspense, lazy } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// SCREEN IMPORTS
import { EditProfileScreen, UserProfileData } from './EditProfileScreen';
// Lazy load NotificationSettingsScreen (only loads when user clicks "Notification Settings")
const NotificationSettingsScreen = lazy(() => import('./NotificationSettingsScreen').then(module => ({ default: module.NotificationSettingsScreen })));
import { QRScannerScreen } from './QRScannerScreen';

// Brand Colors
const SHPE_COLORS = {
  darkBlue: '#055491ff',
  orange: '#D35400',
  white: '#FFFFFF',
  lightBlue: '#00A3E0',
  textGray: '#666666',
};

// --- NEW INTERFACE FOR NAVIGATION ---
interface ProfileScreenProps {
  onNavigateBack: () => void;
}

export function ProfileScreen({ onNavigateBack }: ProfileScreenProps) {
  const { user } = useAuth();

  // Extract first and last name from email (temporary until onboarding is complete)
  const emailName = user?.email?.split('@')[0] || 'User';
  const nameParts = emailName.split(/[._-]/);
  const firstName = nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || 'User';
  const lastName = nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || '';

  // --- 1. MASTER STATE ---
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    firstName: firstName,
    lastName: lastName,
    major: "Not set", // Will be filled during onboarding
    profileImage: null,
    resumeName: null,
    interests: [],
  });

  // --- 2. MODAL CONTROLS ---
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>

        {/* --- BACK BUTTON --- */}
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          {userProfile.profileImage ? (
            <Image source={{ uri: userProfile.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {userProfile.firstName[0]}{userProfile.lastName[0]}
              </Text>
            </View>
          )}
        </View>

        {/* Name Container (Centers text if it wraps) */}
        <View style={styles.nameDataContainer}>
          <Text style={styles.nameText}>
            {userProfile.firstName} {userProfile.lastName}
          </Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        <Text style={styles.majorText}>
          {userProfile.major === "Not set" ? "Complete your profile to get started" : userProfile.major}
        </Text>

        {userProfile.resumeName && (
          <View style={styles.resumeTag}>
            <Text style={styles.resumeText}>📄 {userProfile.resumeName}</Text>
          </View>
        )}
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionSection}>

        {/* 1. EDIT PROFILE */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowEditProfile(true)}
        >
          <Text style={styles.primaryButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* 2. SCAN QR CODE */}
        <TouchableOpacity
          style={styles.scannerButton}
          onPress={() => setShowScanner(true)}
        >
          <Text style={styles.scannerButtonText}>Scan Event QR Code</Text>
        </TouchableOpacity>

        {/* 3. NOTIFICATION SETTINGS */}
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => setShowNotifications(true)}
        >
          <Text style={styles.outlineButtonText}>Notification Settings</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODALS --- */}

      {/* 1. Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
        <EditProfileScreen
          initialData={userProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={(newData) => setUserProfile(newData)}
        />
      </Modal>

      {/* 2. QR Scanner Modal */}
      <Modal visible={showScanner} animationType="slide" presentationStyle="fullScreen">
        <QRScannerScreen
          onClose={() => setShowScanner(false)}
          onSuccess={(eventName: string) => Alert.alert('Check-in Success', `Checked in to ${eventName}!`)}
        />
      </Modal>

      {/* 3. Notification Modal + Added lazy loading */}
      <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
        <Suspense fallback={
          <View style={styles.loadingFallback}>
            <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
            <Text style={styles.loadingText}>Loading Notification Settings...</Text>
          </View>
        }>
          <NotificationSettingsScreen
            onClose={() => setShowNotifications(false)}
          />
        </Suspense>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: SHPE_COLORS.darkBlue,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },

  // BACK BUTTON STYLES
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 10,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: SHPE_COLORS.white,
    fontWeight: '600',
  },

  avatarContainer: {
    marginTop: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: SHPE_COLORS.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: SHPE_COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: SHPE_COLORS.white,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: SHPE_COLORS.white,
  },

  nameDataContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SHPE_COLORS.white,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },

  majorText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  resumeTag: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  resumeText: {
    color: SHPE_COLORS.white,
    fontWeight: '600',
    fontSize: 13,
  },

  actionSection: {
    padding: 20,
    gap: 12,
  },

  primaryButton: {
    backgroundColor: SHPE_COLORS.orange,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  scannerButton: {
    backgroundColor: SHPE_COLORS.darkBlue,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scannerButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  outlineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },

  loadingFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SHPE_COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: SHPE_COLORS.darkBlue,
    fontWeight: '600',
  },
});