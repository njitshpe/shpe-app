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
import { BlurView } from 'expo-blur';
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
    const { theme } = useTheme();
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Reset answers when modal opens
    React.useEffect(() => {
        if (visible) {
            setAnswers({});
        }
    }, [visible]);

    // Force "Dark" theme values for consistency with Event View
    const TEXT_COLOR = '#FFFFFF';
    const SUBTEXT_COLOR = 'rgba(255,255,255, 0.6)';
    const BORDER_COLOR = 'rgba(255,255,255, 0.15)';
    const GLASS_BG = 'rgba(255,255,255, 0.1)';
    const PRIMARY_COLOR = theme.primary; // Keep brand color

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
        const isMultipleChoice = question.type === 'multi_select';
        const isSingleChoice = question.type === 'single_choice' || question.type === 'multiple_choice';

        return (
            <View key={question.id} style={styles.questionContainer}>
                <Text style={[styles.questionLabel, { color: SUBTEXT_COLOR }]}>
                    {question.prompt || question.label}
                    {question.required && <Text style={{ color: '#ff4444' }}> *</Text>}
                </Text>

                {isSingleChoice || isMultipleChoice ? (
                    <View style={[styles.optionsContainer, { backgroundColor: GLASS_BG }]}>
                        {question.options?.map((option: string, index: number) => {
                            const isSelected = answer === option;
                            const isLast = index === question.options.length - 1;
                            return (
                                <View key={option}>
                                    <Pressable
                                        onPress={() => handleUpdateAnswer(question.id, option)}
                                        style={[
                                            styles.optionRow,
                                            isSelected && { backgroundColor: 'rgba(255,255,255,0.08)' },
                                        ]}
                                    >
                                        <Ionicons
                                            name={isSingleChoice
                                                ? (isSelected ? "radio-button-on" : "radio-button-off")
                                                : (isSelected ? "checkbox" : "square-outline")
                                            }
                                            size={20}
                                            color={isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
                                            style={{ marginRight: 14 }}
                                        />
                                        <Text
                                            style={{
                                                color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
                                                fontWeight: isSelected ? '600' : '400',
                                                fontSize: 16,
                                                flex: 1,
                                            }}
                                        >
                                            {option}
                                        </Text>
                                    </Pressable>
                                    {!isLast && <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />}
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <TextInput
                        style={[styles.input, { color: TEXT_COLOR, backgroundColor: GLASS_BG }]}
                        placeholder=""
                        placeholderTextColor={SUBTEXT_COLOR}
                        selectionColor="#FFFFFF"
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
            transparent={true}
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
        >
            <BlurView
                intensity={80}
                tint="dark"
                style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
            >

                {/* HEADER */}
                <View style={[styles.header, { borderBottomColor: BORDER_COLOR }]}>
                    <View style={styles.headerLeft}>
                        {event.coverImageUrl ? (
                            <Image source={event.coverImageUrl} style={styles.headerImage} contentFit="cover" />
                        ) : (
                            <View style={[styles.headerPlaceholder, { backgroundColor: PRIMARY_COLOR }]}>
                                <Ionicons name="calendar" size={24} color="#fff" />
                            </View>
                        )}
                        <Text style={[styles.headerTitle, { color: TEXT_COLOR }]} numberOfLines={2}>
                            {event.title}
                        </Text>
                    </View>

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close-circle" size={30} color={SUBTEXT_COLOR} />
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
                                <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>Registration Questions</Text>

                                {event.registration_questions?.map(renderQuestion)}
                            </View>
                        ) : (
                            // SCENARIO B: SIMPLE CONFIRMATION
                            <View style={styles.confirmContainer}>
                                <View style={[styles.iconContainer, { backgroundColor: GLASS_BG }]}>
                                    <Ionicons name="calendar-outline" size={60} color={TEXT_COLOR} />
                                </View>

                                <Text style={[styles.confirmTitle, { color: TEXT_COLOR }]}>Confirm Registration</Text>
                                <Text style={[styles.confirmText, { color: SUBTEXT_COLOR }]}>
                                    You are about to register for this event.
                                </Text>

                                <View style={[styles.infoCard, { backgroundColor: GLASS_BG }]}>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="time-outline" size={20} color={PRIMARY_COLOR} />
                                        <Text style={[styles.infoText, { color: TEXT_COLOR }]}>
                                            {formatDateHeader(event.startTimeISO)} • {formatTime(event.startTimeISO)}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Ionicons name="location-outline" size={20} color={PRIMARY_COLOR} />
                                        <Text style={[styles.infoText, { color: TEXT_COLOR }]} numberOfLines={1}>
                                            {event.locationName}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* INLINE SUBMIT BUTTON */}
                        <Pressable
                            style={[
                                styles.submitButton,
                                { backgroundColor: TEXT_COLOR, marginTop: 40 },
                                (!isFormValid() || isSubmitting) && { opacity: 0.5 }
                            ]}
                            onPress={handleSubmit}
                            disabled={!isFormValid() || isSubmitting}
                        >
                            <Text style={[styles.submitButtonText, { color: '#000000' }]}>
                                {isSubmitting ? 'Processing...' : (hasQuestions ? 'Submit Answer' : 'Confirm Registration')}
                            </Text>
                        </Pressable>

                    </ScrollView>

                </KeyboardAvoidingView>
            </BlurView>
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
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        minHeight: 50,
    },
    optionsContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
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
