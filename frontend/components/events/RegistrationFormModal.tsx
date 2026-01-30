import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface RegistrationFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  questions: any[];
  onSubmit: (answers: Record<string, string>) => void;
}

export default function RegistrationFormModal({
  isVisible,
  onClose,
  questions,
  onSubmit,
}: RegistrationFormModalProps) {
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleUpdateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
        await onSubmit(answers);
    } finally {
        // We set this back to false so they can try again if it fails
        setIsSubmitting(false); 
    }
  };

  const isFormValid = () => {
    return questions.every((q) => {
      if (!q.required) return true;
      return answers[q.id] && answers[q.id].trim().length > 0;
    });
  };

  const renderQuestion = (question: any) => {
    const answer = answers[question.id] || '';

    return (
      <View key={question.id} style={styles.questionContainer}>
        <Text style={[styles.label, { color: theme.text }]}>
          {question.label}
          {question.required && <Text style={{ color: '#ff4444' }}> *</Text>}
        </Text>

        {question.type === 'multiple_choice' ? (
          <View style={styles.optionsContainer}>
            {question.options?.map((option: string) => (
              <Pressable
                key={option}
                onPress={() => handleUpdateAnswer(question.id, option)}
                style={[
                  styles.optionPill,
                  { borderColor: theme.border },
                  answer === option && { backgroundColor: theme.text, borderColor: theme.text },
                ]}
              >
                <Text
                  style={{
                    color: answer === option ? theme.background : theme.text,
                    fontWeight: answer === option ? '600' : '400',
                  }}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder={question.placeholder || 'Type your answer...'}
            placeholderTextColor={theme.subtext}
            value={answer}
            onChangeText={(val) => handleUpdateAnswer(question.id, val)}
            keyboardType={question.type === 'phone' ? 'phone-pad' : 'default'}
          />
        )}
      </View>
    );
  };

 return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <Text style={[styles.title, { color: theme.text }]}>Registration</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
            {questions.map(renderQuestion)}
          </ScrollView>

          {/* This is the only button you need */}
          <Pressable 
            disabled={!isFormValid() || isSubmitting}
            onPress={handleSubmit}
            style={[
              styles.submitButton, 
              { backgroundColor: theme.text },
              (!isFormValid() || isSubmitting) && { opacity: 0.5 }
            ]}
          >
            <Text style={[styles.submitText, { color: theme.background }]}>
              {isSubmitting ? 'Registering...' : 'Complete Registration'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  card: { borderRadius: 24, maxHeight: '85%', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  content: { marginBottom: 20 },
  questionContainer: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionPill: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1 },
  submitButton: { padding: 18, borderRadius: 16, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700' },
});