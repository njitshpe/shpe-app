import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { Event } from '@/types/events';
import { formatDateHeader, formatTime } from '@/utils';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    interpolateColor,
    Extrapolation,
    useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface EventRegistrationSheetProps {
    visible: boolean;
    event: Event;
    onClose: () => void;
    onSubmit: (answers: Record<string, string>) => void;
    isSubmitting?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function EventRegistrationSheet({
    visible,
    event,
    onClose,
    onSubmit,
    isSubmitting = false,
}: EventRegistrationSheetProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Refs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scrollRef = useRef<any>(null);

    // Animations
    const translateY = useSharedValue(0);
    const scrollY = useSharedValue(0);
    const startScrollY = useSharedValue(0);
    const buttonScale = useSharedValue(1);

    // Reset answers/animations when modal opens
    useEffect(() => {
        if (visible) {
            setAnswers({});
            translateY.value = SCREEN_HEIGHT;
            translateY.value = withTiming(0, { duration: 250 });
        }
    }, [visible]);

    // Force "Dark" theme values for consistency with Event View
    const TEXT_COLOR = '#FFFFFF';
    const SUBTEXT_COLOR = 'rgba(255,255,255, 0.6)';
    const BORDER_COLOR = 'rgba(255,255,255, 0.15)';
    const GLASS_BG = 'rgba(255,255,255, 0.1)';
    const PRIMARY_COLOR = theme.primary;

    const hasQuestions = event.registration_questions && event.registration_questions.length > 0;
    const isDirty = Object.keys(answers).filter(k => answers[k]?.trim().length > 0).length > 0;

    const handleUpdateAnswer = (questionId: string, value: string, isMultiSelect: boolean) => {
        setAnswers((prev) => {
            const current = prev[questionId];

            if (isMultiSelect) {
                const options = current ? current.split(',') : [];
                if (options.includes(value)) {
                    const newOptions = options.filter(o => o !== value);
                    return { ...prev, [questionId]: newOptions.join(',') };
                } else {
                    return { ...prev, [questionId]: [...options, value].join(',') };
                }
            }

            // Single Select Toggle
            if (current === value) {
                const next = { ...prev };
                delete next[questionId];
                return next;
            }

            return { ...prev, [questionId]: value };
        });
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

    // Gesture Logic
    const pan = Gesture.Pan()
        .enabled(!isDirty)
        .simultaneousWithExternalGesture(scrollRef)
        .onStart(() => {
            startScrollY.value = scrollY.value;
        })
        .onChange((event) => {
            // Only allow dragging down (positive translation)

            // If we started scrolling while content was not at top, 
            // disable sheet dragging to prevent accidental closes while scrolling up
            if (startScrollY.value > 0) {
                return;
            }

            if (event.changeY + translateY.value > 0) {
                // Simple physics: logic to prevent dragging up beyond 0
            }
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            } else {
                // If translation is negative (scrolling up), we keep sheet at 0
                translateY.value = 0;
            }
        })
        .onEnd((event) => {
            if (startScrollY.value > 0) return;

            if (event.translationY > 150 || event.velocityY > 500) {
                translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
                    runOnJS(onClose)();
                });
            } else {
                translateY.value = withTiming(0, { duration: 300 });
            }
        });

    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const animatedSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    const animatedBackdropStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateY.value,
            [0, SCREEN_HEIGHT * 0.5],
            [1, 0],
            Extrapolation.CLAMP
        );
        return {
            opacity,
        };
    });

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: buttonScale.value }],
        };
    });

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        buttonScale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        buttonScale.value = withSpring(1);
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
                            const isSelected = isMultipleChoice
                                ? answer.split(',').includes(option)
                                : answer === option;
                            const isLast = index === question.options.length - 1;
                            return (
                                <View key={option}>
                                    <Pressable
                                        onPress={() => handleUpdateAnswer(question.id, option, isMultipleChoice)}
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
                        style={[
                            styles.input,
                            { color: TEXT_COLOR, backgroundColor: GLASS_BG },
                            question.type === 'long_text' && { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }
                        ]}
                        placeholder=""
                        placeholderTextColor={SUBTEXT_COLOR}
                        selectionColor="#FFFFFF"
                        value={answer}
                        onChangeText={(val) => handleUpdateAnswer(question.id, val, false)}
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
            animationType="none"
            transparent={true}
            presentationStyle="overFullScreen"
            onRequestClose={() => !isDirty && onClose()}
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => !isDirty && onClose()} />
                </Animated.View>

                {/* Sheet */}
                <GestureDetector gesture={pan}>
                    <Animated.View style={[styles.sheetContainer, animatedSheetStyle]}>
                        <BlurView
                            intensity={80}
                            tint="dark"
                            style={[
                                styles.blurContent,
                                {
                                    backgroundColor: 'rgba(20,20,20,0.6)' // Slightly darker base
                                }
                            ]}
                        >
                            {/* PILL HANDLE */}
                            {!isDirty && (
                                <View style={[styles.pillContainer, { top: insets.top }]}>
                                    <View style={styles.pill} />
                                </View>
                            )}

                            {/* HEADER */}
                            <Animated.View style={[
                                styles.header,
                                {
                                    borderBottomColor: 'transparent',
                                    paddingTop: insets.top + 30
                                },
                                useAnimatedStyle(() => {
                                    return {
                                        backgroundColor: interpolateColor(
                                            scrollY.value,
                                            [0, 50],
                                            ['rgba(20,20,20,0)', 'rgba(20,20,20,0.95)']
                                        ),
                                        borderBottomColor: interpolateColor(
                                            scrollY.value,
                                            [0, 50],
                                            ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)']
                                        )
                                    };
                                })
                            ]}>
                                {hasQuestions && (
                                    <Text style={[styles.headerTitle, { color: TEXT_COLOR }]}>
                                        Registration
                                    </Text>
                                )}

                                <Pressable onPress={onClose} style={[styles.closeButton, { top: insets.top + 22 }]}>
                                    <Ionicons name="close-circle" size={30} color={SUBTEXT_COLOR} />
                                </Pressable>
                            </Animated.View>

                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                                style={{ flex: 1 }}
                            >
                                <AnimatedScrollView
                                    ref={scrollRef}
                                    style={styles.content}
                                    contentContainerStyle={{ paddingBottom: 100 }}
                                    showsVerticalScrollIndicator={false}
                                    bounces={false}
                                    onScroll={onScroll}
                                    scrollEventThrottle={16}
                                >

                                    {hasQuestions ? (
                                        // SCENARIO A: QUESTIONS
                                        <View style={styles.questionsList}>
                                            {/* Event Info Header */}
                                            <View style={styles.eventInfoContainer}>
                                                {event.coverImageUrl ? (
                                                    <Image source={event.coverImageUrl} style={styles.eventInfoImage} contentFit="cover" />
                                                ) : (
                                                    <View style={[styles.eventInfoPlaceholder, { backgroundColor: PRIMARY_COLOR }]}>
                                                        <Ionicons name="calendar" size={24} color="#fff" />
                                                    </View>
                                                )}
                                                <View style={styles.eventInfoTextContainer}>
                                                    <Text style={[styles.eventInfoTitle, { color: TEXT_COLOR }]}>
                                                        {event.title}
                                                    </Text>
                                                    <View style={styles.eventInfoRow}>
                                                        <Ionicons name="time-outline" size={14} color={SUBTEXT_COLOR} style={{ marginRight: 4 }} />
                                                        <Text style={[styles.eventInfoTime, { color: SUBTEXT_COLOR }]}>
                                                            {formatDateHeader(event.startTimeISO)} • {formatTime(event.startTimeISO)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <View style={[styles.divider, { backgroundColor: BORDER_COLOR, marginBottom: 12, marginHorizontal: 0 }]} />

                                            {/* Subtitle removed if header handles it, or kept for context? User asked for header "Registration". 
                                                The previous "Registration Questions" title might be redundant now. I'll keep it simple/clean. 
                                            */}
                                            <Text style={[styles.sectionTitle, { color: TEXT_COLOR }]}>
                                                Registration Questions
                                            </Text>

                                            {event.registration_questions?.map(renderQuestion)}
                                        </View>
                                    ) : (
                                        // SCENARIO B: SIMPLE CONFIRMATION
                                        <View style={styles.confirmContainer}>
                                            {event.coverImageUrl ? (
                                                <Image
                                                    source={event.coverImageUrl}
                                                    style={{
                                                        width: 200,
                                                        height: 200,
                                                        borderRadius: 20,
                                                        marginBottom: 24,
                                                        backgroundColor: '#333',
                                                        shadowColor: "#000",
                                                        shadowOffset: {
                                                            width: 0,
                                                            height: 4,
                                                        },
                                                        shadowOpacity: 0.30,
                                                        shadowRadius: 4.65,
                                                    }}
                                                    contentFit="cover"
                                                />
                                            ) : (
                                                <View style={[styles.iconContainer, { backgroundColor: GLASS_BG, width: 120, height: 120, borderRadius: 60, marginBottom: 24 }]}>
                                                    <Ionicons name="calendar-outline" size={60} color={TEXT_COLOR} />
                                                </View>
                                            )}

                                            <Text style={[styles.confirmTitle, { color: TEXT_COLOR, textAlign: 'center', fontSize: 24, marginBottom: 8 }]}>
                                                {event.title}
                                            </Text>

                                            <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.8 }}>
                                                <Text style={{ fontSize: 16, color: TEXT_COLOR, fontWeight: '500' }}>
                                                    {formatDateHeader(event.startTimeISO)} • {formatTime(event.startTimeISO)}
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                </AnimatedScrollView>

                                {/* STICKY FOOTER */}
                                <View style={[styles.footer, { borderTopWidth: 0, backgroundColor: 'rgba(20,20,20,0.4)' }]}>
                                    <AnimatedPressable
                                        style={[
                                            styles.submitButton,
                                            { backgroundColor: TEXT_COLOR },
                                            (!isFormValid() || isSubmitting) && { opacity: 0.5 },
                                            animatedButtonStyle
                                        ]}
                                        onPress={handleSubmit}
                                        onPressIn={handlePressIn}
                                        onPressOut={handlePressOut}
                                        disabled={!isFormValid() || isSubmitting}
                                    >
                                        <Text style={[styles.submitButtonText, { color: '#000000' }]}>
                                            {isSubmitting ? 'Processing...' : (hasQuestions ? 'Submit Answers' : 'Confirm Registration')}
                                        </Text>
                                    </AnimatedPressable>
                                </View>


                            </KeyboardAvoidingView>
                        </BlurView>
                    </Animated.View>
                </GestureDetector>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheetContainer: {
        flex: 1, // Take full height to allow dragging entire thing
        justifyContent: 'flex-end',
    },
    blurContent: {
        flex: 1,
        borderTopLeftRadius: 30, // Rounded top corners for sheet look
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    pillContainer: {
        position: 'absolute',
        top: 0,
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
        zIndex: 10,
    },
    pill: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    header: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 0,
        borderBottomColor: 'transparent',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
        position: 'absolute',
        right: 16,
    },
    // Event Info Styles
    eventInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventInfoImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#eee',
    },
    eventInfoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eventInfoTextContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    eventInfoTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    eventInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    eventInfoTime: {
        fontSize: 14,
        fontWeight: '400',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    footer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        borderTopWidth: 1,
    },
    submitButton: {
        paddingVertical: 16,
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
        gap: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        marginBottom: 10,
        lineHeight: 20,
    },
    questionContainer: {
        gap: 8,
    },
    questionLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        borderRadius: 12,
        padding: 12,
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
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    divider: {
        height: 1,
        marginHorizontal: 8,
    },

    // CONFIRM STYLES
    confirmContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 24,
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

