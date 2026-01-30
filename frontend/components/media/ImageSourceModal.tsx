import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ImageSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectLibrary: () => void;
  onSelectFiles: () => void;
}

export function ImageSourceModal({
  visible,
  onClose,
  onSelectCamera,
  onSelectLibrary,
  onSelectFiles
}: ImageSourceModalProps) {
  const { theme, isDark } = useTheme();

  // If not visible, we render nothing. 
  // This replaces the "visible" prop of the native Modal.
  if (!visible) return null;

  const dynamicStyles = {
    modalContent: { backgroundColor: theme.card },
    title: { color: theme.text },
    optionText: { color: theme.primary },
    separator: { backgroundColor: theme.border },
  };

  return (
    // This creates a full-screen overlay that sits ON TOP of everything else
    <View style={styles.absoluteContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, dynamicStyles.modalContent]}>
              <Text style={[styles.title, dynamicStyles.title]}>Update Profile Picture</Text>

              <TouchableOpacity style={styles.option} onPress={onSelectCamera}>
                <Text style={[styles.optionText, dynamicStyles.optionText]}>Take Photo</Text>
              </TouchableOpacity>

              <View style={[styles.separator, dynamicStyles.separator]} />

              <TouchableOpacity style={styles.option} onPress={onSelectLibrary}>
                <Text style={[styles.optionText, dynamicStyles.optionText]}>Choose from Library</Text>
              </TouchableOpacity>

              <View style={[styles.separator, dynamicStyles.separator]} />

              <TouchableOpacity style={styles.option} onPress={onSelectFiles}>
                <Text style={[styles.optionText, dynamicStyles.optionText]}>Choose from Files</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.option, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  // This makes the view cover the WHOLE screen, ignoring other layout
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000, // Ensures it sits on top of everything
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
  },
  separator: {
    height: 1,
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
});