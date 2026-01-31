import React, { useState, useMemo } from 'react';
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
    Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Event } from '@/types/events';
import { formatDateHeader, formatTime } from '@/utils';

interface EventRegistrationSheetProps {
    visible: boolean;
    event: Event;
    onClose: () => void;
    onSubmit: (answers: Record<string, string>) => void;
    isSubmitting?: boolean;
}

export default function EventRegistrationSheet({
    visible,
    event,
    onClose,
    onSubmit,
    isSubmitting = false,
}: EventRegistrationSheetProps) {
    const { theme, isDark } = useTheme();
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Reset answers when modal opens
    React.useEffect(() => {
        if (visible) {
            setAnswers({});
        }
    }, [visible]);

    const hasQuestions = event.registration_questions && event.registration_questions.length > 0;

    const handleUpdateAnswer = (questionId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const isFormValid = () => {
        if (!hasQuestions) return true;

        return event.registration_questions?.every((q) => {
            if (!q.required) return true;
            const answer = answers[q.id];
            return answer && answer.trim().length > 0;
        });
    };

    const handleSubmit = () => {
        onSubmit(answers);
    };

    const renderQuestion = (question: any) => {
        const answer = answers[question.id] || '';

        return (
            <View key={question.id} style={styles.questionContainer}>
                <Text style={[styles.questionLabel, { color: theme.text }]}>
                    {question.prompt || question.label}
                    {question.required && <Text style={{ color: '#ff4444' }}> *</Text>}
                </Text>

                {question.type === 'multiple_choice' || question.type === 'single_choice' || question.type === 'multi_select' ? (
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
                        multiline={question.type === 'long_text'}
                        keyboardType={question.type === 'phone' ? 'phone-pad' : 'default'}
                    />
                )}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>

                {/* HEADER */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <View style={styles.headerLeft}>
                        {event.coverImageUrl ? (
                            <Image source={event.coverImageUrl} style={styles.headerImage} contentFit="cover" />
                        ) : (
                            <View style={[styles.headerPlaceholder, { backgroundColor: theme.primary }]}>
                                <Ionicons name="calendar" size={24} color="#fff" />
                            </View>
                        )}
                        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={2}>
                            {event.title}
                        </Text>
                    </View>

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close-circle" size={30} color={theme.subtext} />
                    </Pressable>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    >

                        {hasQuestions ? (
                            // SCENARIO A: QUESTIONS
                            <View style={styles.questionsList}>
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Registration Questions</Text>
                                <Text style={[styles.subtitle, { color: theme.subtext }]}>
                                    Please answer the following questions to complete your registration.
                                </Text>

                                {event.registration_questions?.map(renderQuestion)}
                            </View>
                        ) : (
                            // SCENARIO B: SIMPLE CONFIRMATION
                            <View style={styles.confirmContainer}>
                                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                                    <Ionicons name="calendar-outline" size={60} color={theme.text} />
                                </View>

                                <Text style={[styles.confirmTitle, { color: theme.text }]}>Confirm Registration</Text>
                                <Text style={[styles.confirmText, { color: theme.subtext }]}>
                                    You are about to register for this event.
                                </Text>

                                <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="time-outline" size={20} color={theme.primary} />
                                        <Text style={[styles.infoText, { color: theme.text }]}>
                                            {formatDateHeader(event.startTimeISO)} • {formatTime(event.startTimeISO)}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="location-outline" size={20} color={theme.primary} />
                                        <Text style={[styles.infoText, { color: theme.text }]} numberOfLines={1}>
                                            {event.locationName}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                    </ScrollView>

                    {/* FOOTER */}
                    <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                        <Pressable
                            style={[
                                styles.submitButton,
                                { backgroundColor: theme.text },
                                (!isFormValid() || isSubmitting) && { opacity: 0.5 }
                            ]}
                            onPress={handleSubmit}
                            disabled={!isFormValid() || isSubmitting}
                        >
                            <Text style={[styles.submitButtonText, { color: theme.background }]}>
                                {isSubmitting ? 'Processing...' : (hasQuestions ? 'Submit Answer' : 'Confirm Registration')}
                            </Text>
                        </Pressable>
                    </View>

                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    headerImage: {
        width: 48,
        height: 48,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    headerPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
    },
    submitButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },

    // QUESTIONS STYLES
    questionsList: {
        gap: 24,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        marginBottom: 10,
        lineHeight: 20,
    },
    questionContainer: {
        gap: 10,
    },
    questionLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        minHeight: 50,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionPill: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },

    // CONFIRM STYLES
    confirmContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    confirmTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    infoCard: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
