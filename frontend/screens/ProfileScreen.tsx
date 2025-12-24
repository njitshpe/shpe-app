import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';

// 🎨 SHPE Brand Colors
const SHPE_COLORS = {
  darkBlue: '#002855', // Primary Background
  orange: '#FF5F05',   // Action Buttons
  white: '#FFFFFF',    // Text
  lightBlue: '#00A3E0',// Secondary Accents
  gray: '#F4F4F4',     // Placeholders
};

export function ProfileScreen() {
  // 🖼️ Local state for UI testing (so you don't need the service yet)
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // 👤 Hardcoded User Data (This will come from AuthContext later)
  const firstName = "Sofia";
  const lastName = "Molina";
  const role = "Member";

  // 🛠️ Placeholder function for your Photo Service
  const handleEditPicture = () => {
    Alert.alert("Photo Service", "Themp placer");
    // Later, you will call: await photosService.pickImage()
  };

  // 📸 Placeholder function for your Friend's Camera Service
  const handleScanQR = () => {
    Alert.alert("Camera Service", "Temp placer");
    // Later, you will call: await cameraService.scanQR()
  };

  return (
    <View style={styles.container}>
      
      {/* --- Profile Header Section --- */}
      <View style={styles.headerContainer}>
        <View style={styles.avatarWrapper}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            // Fallback Initials if no image
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initialsText}>
                {firstName[0]}{lastName[0]}
              </Text>
            </View>
          )}

        </View>

        <Text style={styles.nameText}>{firstName} {lastName}</Text>
        <Text style={styles.roleText}>{role}</Text>
      </View>

      {/* --- Action Buttons Section --- */}
      <View style={styles.actionSection}>
        
        {/* The "Edit Profile Picture" Button (Explicit) */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleEditPicture}>
          <Text style={styles.primaryButtonText}>Change Profile Photo</Text>
        </TouchableOpacity>

        {/* The "Scan QR Code" Button (Primary Action) */}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleScanQR}>
          <Text style={styles.secondaryButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SHPE_COLORS.white,
    alignItems: 'center',
    paddingTop: 80, // Push content down from the top
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
  editIconBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: SHPE_COLORS.white,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: SHPE_COLORS.orange,
  },
  editIconText: {
    fontSize: 20,
    color: SHPE_COLORS.orange,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SHPE_COLORS.white,
    marginBottom: 5,
  },
  roleText: {
    fontSize: 18,
    color: SHPE_COLORS.lightBlue,
    fontWeight: '500',
  },
  actionSection: {
    width: '85%',
    gap: 15, // Spacing between buttons
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