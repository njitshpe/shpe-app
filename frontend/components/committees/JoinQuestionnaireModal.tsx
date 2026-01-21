import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeInfo } from '@/utils/committeeUtils';
import { JoinFormConfig, JoinFormQuestion } from '@/config/committeeJoinForms';

interface JoinQuestionnaireModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  committee: CommitteeInfo;
  formConfig: JoinFormConfig;
}

export const JoinQuestionnaireModal: React.FC<JoinQuestionnaireModalProps> = ({
  visible,
  onClose,
  onSubmit,
  committee,
  formConfig,
}) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateAnswer = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const toggleMultiSelect = (key: string, option: string) => {
    const currentValues = answers[key] || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter((v: string) => v !== option)
      : [...currentValues, option];
    updateAnswer(key, newValues);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    formConfig.questions.forEach(question => {
      if (question.required) {
        const value = answers[question.key];
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[question.key] = 'This field is required';
        } else if (Array.isArray(value) && value.length === 0) {
          newErrors[question.key] = 'Please select at least one option';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit(answers);
    setIsSubmitting(false);

    if (result.success) {
      setAnswers({});
      onClose();
    } else {
      Alert.alert('Error', result.error || 'Failed to submit application. Please try again.');
    }
  };

  const handleClose = () => {
    if (Object.keys(answers).length > 0) {
      Alert.alert(
        'Discard Application?',
        'Your answers will be lost if you close this form.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => {
            setAnswers({});
            setErrors({});
            onClose();
          }},
        ]
      );
    } else {
      onClose();
    }
  };

  const renderQuestion = (question: JoinFormQuestion, index: number) => {
    const hasError = !!errors[question.key];

    return (
      <View key={question.key} style={styles.questionContainer}>
        <Text style={[styles.questionLabel, { color: theme.text }]}>
          {question.label}
          {question.required && <Text style={styles.requiredStar}> *</Text>}
        </Text>

        {question.type === 'text' && (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: hasError ? '#FF375F' : (isDark ? '#2C2C2E' : '#E8E5E0'),
                color: theme.text,
              },
            ]}
            placeholder={question.placeholder}
            placeholderTextColor={isDark ? '#8E8E93' : '#999999'}
            value={answers[question.key] || ''}
            onChangeText={(text) => updateAnswer(question.key, text)}
            maxLength={question.maxLen}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        {question.type === 'textarea' && (
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: hasError ? '#FF375F' : (isDark ? '#2C2C2E' : '#E8E5E0'),
                color: theme.text,
              },
            ]}
            placeholder={question.placeholder}
            placeholderTextColor={isDark ? '#8E8E93' : '#999999'}
            value={answers[question.key] || ''}
            onChangeText={(text) => updateAnswer(question.key, text)}
            maxLength={question.maxLen}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        )}

        {question.type === 'number' && (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: hasError ? '#FF375F' : (isDark ? '#2C2C2E' : '#E8E5E0'),
                color: theme.text,
              },
            ]}
            placeholder={question.placeholder}
            placeholderTextColor={isDark ? '#8E8E93' : '#999999'}
            value={answers[question.key]?.toString() || ''}
            onChangeText={(text) => updateAnswer(question.key, text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={question.maxLen}
          />
        )}

        {question.type === 'select' && question.options && (
          <View style={styles.optionsContainer}>
            {question.options.map((option) => (
              <Pressable
                key={option}
                style={({ pressed }) => [
                  styles.selectOption,
                  {
                    backgroundColor: answers[question.key] === option
                      ? committee.color
                      : (isDark ? '#1C1C1E' : '#FFFFFF'),
                    borderColor: hasError ? '#FF375F' : (answers[question.key] === option ? committee.color : (isDark ? '#2C2C2E' : '#E8E5E0')),
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => updateAnswer(question.key, option)}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    {
                      color: answers[question.key] === option ? '#FFFFFF' : theme.text,
                    },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {question.type === 'multiselect' && question.options && (
          <View style={styles.optionsContainer}>
            {question.options.map((option) => {
              const isSelected = (answers[question.key] || []).includes(option);
              return (
                <Pressable
                  key={option}
                  style={({ pressed }) => [
                    styles.selectOption,
                    {
                      backgroundColor: isSelected
                        ? committee.color
                        : (isDark ? '#1C1C1E' : '#FFFFFF'),
                      borderColor: hasError ? '#FF375F' : (isSelected ? committee.color : (isDark ? '#2C2C2E' : '#E8E5E0')),
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  onPress={() => toggleMultiSelect(question.key, option)}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={isSelected ? '#FFFFFF' : (isDark ? '#8E8E93' : '#999999')}
                    style={styles.checkIcon}
                  />
                  <Text
                    style={[
                      styles.selectOptionText,
                      {
                        color: isSelected ? '#FFFFFF' : theme.text,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {question.type === 'checkbox' && (
          <Pressable
            style={({ pressed }) => [
              styles.checkboxRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => updateAnswer(question.key, !answers[question.key])}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: answers[question.key] ? committee.color : 'transparent',
                  borderColor: hasError ? '#FF375F' : (answers[question.key] ? committee.color : (isDark ? '#3A3A3C' : '#C7C7CC')),
                },
              ]}
            >
              {answers[question.key] && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>Yes</Text>
          </Pressable>
        )}

        {hasError && (
          <Text style={styles.errorText}>{errors[question.key]}</Text>
        )}

        {question.maxLen && question.type !== 'select' && question.type !== 'multiselect' && (
          <Text style={[styles.charCount, { color: isDark ? '#666' : '#999' }]}>
            {(answers[question.key]?.length || 0)}/{question.maxLen}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
              borderBottomColor: isDark ? '#2C2C2E' : '#E8E5E0',
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerContent}>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.closeButtonText, { color: committee.color }]}>Cancel</Text>
            </Pressable>

            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                {formConfig.title}
              </Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </View>

        {/* Form Content */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Committee Header */}
            <View style={styles.committeeHeader}>
              <View style={[styles.committeeIcon, { backgroundColor: `${committee.color}20` }]}>
                <Ionicons name={committee.icon as any} size={32} color={committee.color} />
              </View>
              <Text style={[styles.committeeTitle, { color: theme.text }]}>
                {committee.title}
              </Text>
              {formConfig.description && (
                <Text style={[styles.committeeDescription, { color: isDark ? '#999' : '#666' }]}>
                  {formConfig.description}
                </Text>
              )}
            </View>

            {/* Questions */}
            {formConfig.questions.map((question, index) => renderQuestion(question, index))}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Submit Button */}
        <View
          style={[
            styles.submitContainer,
            {
              paddingBottom: insets.bottom + 16,
              backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
              borderTopColor: isDark ? '#2C2C2E' : '#E8E5E0',
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: committee.color,
                opacity: isSubmitting ? 0.7 : (pressed ? 0.8 : 1),
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#FFFFFF" style={styles.submitIcon} />
                <Text style={styles.submitButtonText}>Submit Application</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerRight: {
    width: 60,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  committeeHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  committeeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  committeeTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  committeeDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    lineHeight: 22,
  },
  requiredStar: {
    color: '#FF375F',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  checkIcon: {
    marginRight: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  errorText: {
    color: '#FF375F',
    fontSize: 13,
    marginTop: 6,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
