import React, { useState, Suspense, lazy } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, SafeAreaView, Alert, ActivityIndicator } from 'react-native';

// SCREEN IMPORTS
import { EditProfileScreen, UserProfileData } from './EditProfileScreen';
// Lazy load NotificationSettingsScreen (only loads when user clicks "Notification Settings")
const NotificationSettingsScreen = lazy(() => import('./NotificationSettingsScreen').then(module => ({ default: module.NotificationSettingsScreen })));
import { QRScannerScreen } from './QRScannerScreen';

// Brand Colors
const SHPE_COLORS = {
  darkBlue: '#002855',
  orange: '#FF5F05',
  white: '#FFFFFF',
  lightBlue: '#00A3E0',
  textGray: '#666666',
};

// --- NEW INTERFACE FOR NAVIGATION ---
interface ProfileScreenProps {
  onNavigateBack: () => void;
}

export function ProfileScreen({ onNavigateBack }: ProfileScreenProps) {
  // --- 1. MASTER STATE ---
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    firstName: "Sofia",
    lastName: "Molina",
    major: "Computer Science",
    profileImage: null,
    resumeName: null,
    interests: ["Web Dev", "AI/ML"],
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
        </View>

        <Text style={styles.majorText}>{userProfile.major}</Text>

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
    backgroundColor: SHPE_COLORS.white,
    alignItems: 'center',
  },
  headerContainer: {
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    position: 'relative', // Necessary for absolute positioning of back button
  },

  // BACK BUTTON STYLES
  backButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    zIndex: 10,
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: SHPE_COLORS.darkBlue,
    fontWeight: '600',
  },
  // -------------------------

  avatarContainer: {
    marginTop: 40, // Push avatar down so it doesn't overlap with back button
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: SHPE_COLORS.orange,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SHPE_COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: SHPE_COLORS.orange,
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: 'bold',
    color: SHPE_COLORS.white,
  },

  // --- NAME CONTAINER STYLES ---
  nameDataContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 5,
  },
  nameText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: SHPE_COLORS.darkBlue,
    textAlign: 'center',
  },
  // -----------------------------

  majorText: {
    fontSize: 16,
    color: SHPE_COLORS.textGray,
  },
  resumeTag: {
    marginTop: 10,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  resumeText: {
    color: SHPE_COLORS.lightBlue,
    fontWeight: '600',
    fontSize: 13,
  },
  actionSection: {
    width: '85%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: SHPE_COLORS.darkBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerButton: {
    backgroundColor: SHPE_COLORS.orange,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  scannerButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: SHPE_COLORS.darkBlue,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: SHPE_COLORS.darkBlue,
    fontSize: 16,
    fontWeight: 'bold',
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