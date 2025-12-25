import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { QRScannerScreen } from './QRScannerScreen';
import { NotificationSettingsScreen } from './NotificationSettingsScreen';

// IMPORTS
import { PhotoHelper } from '../lib/PhotoService';
import { ImageSourceModal } from '../components/ImageSourceModal';

// SHPE Brand Colors
const SHPE_COLORS = {
  darkBlue: '#002855',
  orange: '#FF5F05',
  white: '#FFFFFF',
  lightBlue: '#00A3E0',
  gray: '#F4F4F4',
};

export function ProfileScreen() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Hardcoded User Data
  const firstName = "Sofia";
  const lastName = "Molina";
  const role = "Member";

  // --- UPDATED HANDLER (No Timer Needed!) ---
  const handleImageSelection = async (method: () => Promise<string | null>) => {
    // 1. Close the overlay instantly
    setShowImageOptions(false);

    // 2. Run the picker immediately
    // Since we aren't using a native Modal anymore, there is no conflict!
    const uri = await method();
    if (uri) {
      setProfileImage(uri);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* --- Profile Header Section --- */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarWrapper}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initialsText}>{firstName[0]}{lastName[0]}</Text>
            </View>
          )}
        </View>

        <Text style={styles.nameText}>{firstName} {lastName}</Text>
        <Text style={styles.roleText}>{role}</Text>
      </View>

      {/* --- Action Buttons --- */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setShowImageOptions(true)}>
          <Text style={styles.primaryButtonText}>Change Profile Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowScanner(true)}>
          <Text style={styles.secondaryButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setShowNotificationSettings(true)}>
          <Text style={styles.primaryButtonText}>Notification Settings</Text>
        </TouchableOpacity>
      </View>

      {/* --- QR Scanner Modal (Native Modal is fine here) --- */}
      <Modal visible={showScanner} animationType="slide" presentationStyle="fullScreen">
        <QRScannerScreen
          onClose={() => setShowScanner(false)}
          onSuccess={(eventName) => Alert.alert('Success', `Checked in to ${eventName}!`)}
        />
      </Modal>

      {/* --- Notification Settings Modal --- */}
      <Modal visible={showNotificationSettings} animationType="slide" presentationStyle="fullScreen">
        <NotificationSettingsScreen onClose={() => setShowNotificationSettings(false)} />
      </Modal>

      {/* --- NEW: Overlay Menu (Must be last to sit on top) --- */}
      {/* Note: We place this at the very bottom so it renders ON TOP of everything else */}
      <ImageSourceModal 
        visible={showImageOptions}
        onClose={() => setShowImageOptions(false)}
        onSelectCamera={() => handleImageSelection(PhotoHelper.takePhoto)}
        onSelectLibrary={() => handleImageSelection(PhotoHelper.pickFromLibrary)}
        onSelectFiles={() => handleImageSelection(PhotoHelper.pickFromFiles)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SHPE_COLORS.white,
    alignItems: 'center',
    paddingTop: 80,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: SHPE_COLORS.orange,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: SHPE_COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: SHPE_COLORS.orange,
  },
  initialsText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: SHPE_COLORS.darkBlue,
  },
  nameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SHPE_COLORS.darkBlue,
    marginBottom: 5,
  },
  roleText: {
    fontSize: 18,
    color: SHPE_COLORS.lightBlue,
    fontWeight: '500',
  },
  actionSection: {
    width: '85%',
    gap: 15,
  },
  primaryButton: {
    borderWidth: 2,
    borderColor: SHPE_COLORS.lightBlue,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: SHPE_COLORS.orange,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: SHPE_COLORS.orange,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  secondaryButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  }
});