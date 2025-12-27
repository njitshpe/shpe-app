import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface EventMoreMenuProps {
  visible: boolean;
  onClose: () => void;
  isRegistered: boolean;
  onAddToCalendar: () => void;
  onCancelRegistration: () => void;
}

export default function EventMoreMenu({
  visible,
  onClose,
  isRegistered,
  onAddToCalendar,
  onCancelRegistration,
}: EventMoreMenuProps) {
  const handleCancelRegistration = () => {
    onClose();

    // Show confirmation dialog
    setTimeout(() => {
      Alert.alert(
        'Cancel Registration',
        'Are you sure you want to cancel your registration for this event?',
        [
          {
            text: 'No, Keep Registration',
            style: 'cancel',
          },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: onCancelRegistration,
          },
        ],
        { cancelable: true }
      );
    }, 300);
  };

  const handleAddToCalendar = () => {
    onClose();
    setTimeout(() => {
      onAddToCalendar();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.menuContainer}>
          <View style={styles.menu}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Menu Title */}
            <Text style={styles.menuTitle}>More Options</Text>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {/* Add to Calendar - Always visible */}
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={handleAddToCalendar}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name="calendar-outline" size={22} color="#1C1C1E" />
                </View>
                <Text style={styles.menuItemText}>Add to Calendar</Text>
                <Ionicons name="chevron-forward" size={20} color="#6e6e73" />
              </Pressable>

              {/* Cancel Registration - Only if registered */}
              {isRegistered && (
                <>
                  <View style={styles.divider} />
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && styles.menuItemPressed,
                    ]}
                    onPress={handleCancelRegistration}
                  >
                    <View style={styles.menuItemIconDanger}>
                      <Ionicons name="close-circle-outline" size={22} color="#DC2626" />
                    </View>
                    <Text style={styles.menuItemTextDanger}>Cancel Registration</Text>
                    <Ionicons name="chevron-forward" size={20} color="#6e6e73" />
                  </Pressable>
                </>
              )}
            </View>

            {/* Cancel Button */}
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  menu: {
    backgroundColor: '#FDFBF7',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E8E5E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6e6e73',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuItems: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F5F3F0',
  },
  menuItemPressed: {
    backgroundColor: '#E8E5E0',
    transform: [{ scale: 0.98 }],
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDFBF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemIconDanger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  menuItemTextDanger: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  divider: {
    height: 8,
  },
  cancelButton: {
    paddingVertical: 18,
    alignItems: 'center',
    backgroundColor: '#F5F3F0',
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  cancelButtonPressed: {
    backgroundColor: '#E8E5E0',
    transform: [{ scale: 0.98 }],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});
