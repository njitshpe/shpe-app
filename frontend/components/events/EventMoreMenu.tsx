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
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme, isDark } = useTheme();

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

  const dynamicStyles = {
    menu: { backgroundColor: theme.card },
    handle: { backgroundColor: theme.border },
    menuTitle: { color: theme.subtext },
    menuItem: { backgroundColor: theme.background },
    menuItemPressed: { backgroundColor: theme.border },
    menuItemIcon: { backgroundColor: theme.card },
    menuItemText: { color: theme.text },
    iconColor: theme.text,
    chevronColor: theme.subtext,
    cancelButton: { backgroundColor: theme.background },
    cancelButtonPressed: { backgroundColor: theme.border },
    cancelButtonText: { color: theme.text },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.blurContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.menuContainer}>
          <View style={[styles.menu, dynamicStyles.menu]}>
            {/* Handle */}
            <View style={[styles.handle, dynamicStyles.handle]} />

            {/* Menu Title */}
            <Text style={[styles.menuTitle, dynamicStyles.menuTitle]}>More Options</Text>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {/* Add to Calendar - Always visible */}
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  dynamicStyles.menuItem,
                  pressed && dynamicStyles.menuItemPressed,
                ]}
                onPress={handleAddToCalendar}
              >
                <View style={[styles.menuItemIcon, dynamicStyles.menuItemIcon]}>
                  <Ionicons name="calendar-outline" size={22} color={dynamicStyles.iconColor} />
                </View>
                <Text style={[styles.menuItemText, dynamicStyles.menuItemText]}>Add to Calendar</Text>
                <Ionicons name="chevron-forward" size={20} color={dynamicStyles.chevronColor} />
              </Pressable>

              {/* Cancel Registration - Only if registered */}
              {isRegistered && (
                <>
                  <View style={styles.divider} />
                  <Pressable
                    style={({ pressed }) => [
                      styles.menuItem,
                      dynamicStyles.menuItem,
                      pressed && dynamicStyles.menuItemPressed,
                    ]}
                    onPress={handleCancelRegistration}
                  >
                    <View style={styles.menuItemIconDanger}>
                      <Ionicons name="close-circle-outline" size={22} color="#DC2626" />
                    </View>
                    <Text style={styles.menuItemTextDanger}>Cancel Registration</Text>
                    <Ionicons name="chevron-forward" size={20} color={dynamicStyles.chevronColor} />
                  </Pressable>
                </>
              )}
            </View>

            {/* Cancel Button */}
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                dynamicStyles.cancelButton,
                pressed && dynamicStyles.cancelButtonPressed,
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>Close</Text>
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
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
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
  },
  menuItemPressed: {
    transform: [{ scale: 0.98 }],
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  cancelButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
