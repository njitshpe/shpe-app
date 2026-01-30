import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface WizardBackButtonProps {
  onPress: () => void;
  hasFormData?: boolean;
  showConfirmation?: boolean;
}

export default function WizardBackButton({
  onPress,
  hasFormData = false,
  showConfirmation = false,
}: WizardBackButtonProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    if (showConfirmation && hasFormData) {
      Alert.alert(
        'Go back to role selection?',
        'Your progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Back', style: 'destructive', onPress },
        ]
      );
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.backButton}
      activeOpacity={0.7}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={24} color={theme.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
