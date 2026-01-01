import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { INTEREST_OPTIONS } from '@/types/userProfile';
import type { UserType, InterestType } from '@/types/userProfile';
import { profileService } from '@/services/profile.service';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeUploader } from '@/components/media';
import { useResume } from '@/hooks/profile';
import { useTheme } from '@/contexts/ThemeContext';

interface OnboardingPage3Props {
    userType: UserType;
    userId: string;
    email: string;
    formData: any;
    onBack: () => void;
}

export function OnboardingPage3({ userType, userId, email, formData, onBack }: OnboardingPage3Props) {
    const { loadProfile, updateUserMetadata } = useAuth();
    const { theme, isDark } = useTheme();
    const [interests, setInterests] = useState<InterestType[]>([]);
    const [linkedin, setLinkedin] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    // Resume state
    const { pickResume } = useResume();
    const [resumeName, setResumeName] = useState<string | null>(null);
    const [resumeUrl, setResumeUrl] = useState<string | null>(null);

    const toggleInterest = (value: InterestType) => {
        if (interests.includes(value)) {
            setInterests(interests.filter((i) => i !== value));
        } else {
            setInterests([...interests, value]);
        }
    };

    const handleResumePick = async () => {
        const result = await pickResume();
        if (result) {
            setResumeName(result.name);
            setResumeUrl(result.uri);
        }
    };

    const handleComplete = async () => {
        if (interests.length === 0) {
            Alert.alert('Error', 'Please select at least one area of interest');
            return;
        }

        setLoading(true);

        // Combine all data
        const profileData = {
            ...formData,
            user_type: userType,
            interests,
            linkedin_url: linkedin.trim() || null,
            phone_number: phone.trim() || null,
            resume_name: resumeName,
            resume_url: resumeUrl,
            // UCID is already handled in signup for students, but we can store it if needed
            // For now, we rely on the email being ucid@njit.edu
            ucid: userType === 'student' ? email.split('@')[0] : null,
        };

        const result = await profileService.createProfile(userId, profileData);

        if (result.success) {
            // Update user metadata to mark onboarding as completed
            // This allows us to skip the DB read for profile check in App.tsx
            try {
                await updateUserMetadata({ onboarding_completed: true });
                // No need to call loadProfile here as App.tsx will react to the metadata change
                // But we can call it if we want the profile data ready for the next screen
                await loadProfile(userId);
            } catch (error) {
                console.error('Failed to update user metadata:', error);
                // We still proceed since the profile was created
            }
        } else {
            Alert.alert('Error', result.error?.message || 'Failed to create profile');
            setLoading(false);
        }
    };

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        title: { color: theme.text },
        subtitle: { color: theme.subtext },
        label: { color: theme.text },
        input: {
            backgroundColor: theme.card,
            borderColor: theme.border,
            color: theme.text,
        },
        chip: {
            backgroundColor: theme.card,
            borderColor: theme.border,
        },
        chipText: { color: theme.subtext },
        backButton: {
            backgroundColor: theme.card,
            borderColor: theme.border,
        },
        backButtonText: { color: theme.subtext },
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, dynamicStyles.container]}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView style={[styles.container, dynamicStyles.container]} contentContainerStyle={styles.content}>
                    <Text style={[styles.title, dynamicStyles.title]}>Final Steps</Text>
                    <Text style={[styles.subtitle, dynamicStyles.subtitle]}>What are you interested in?</Text>

                    {/* Interests */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Interests * (Select all that apply)</Text>
                        <View style={styles.chipContainer}>
                            {INTEREST_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.chip,
                                        dynamicStyles.chip,
                                        interests.includes(option.value) && styles.chipActive,
                                    ]}
                                    onPress={() => toggleInterest(option.value)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            dynamicStyles.chipText,
                                            interests.includes(option.value) && styles.chipTextActive,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* LinkedIn */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>LinkedIn URL (Optional)</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={linkedin}
                            onChangeText={setLinkedin}
                            placeholder="https://linkedin.com/in/..."
                            placeholderTextColor={theme.subtext}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Phone Number (Optional)</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="(555) 555-5555"
                            placeholderTextColor={theme.subtext}
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Resume Upload */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Resume (Optional)</Text>
                        <ResumeUploader
                            resumeName={resumeName}
                            onUpload={handleResumePick}
                            onRemove={() => {
                                setResumeName(null);
                                setResumeUrl(null);
                            }}
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.backButton, dynamicStyles.backButton]}
                            onPress={onBack}
                            disabled={loading}
                        >
                            <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.completeButton, loading && styles.buttonDisabled]}
                            onPress={handleComplete}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.completeButtonText}>Complete Setup</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        // color removed
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        // color removed
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        // color removed
        marginBottom: 8,
    },
    input: {
        // backgroundColor removed
        borderWidth: 1,
        // borderColor removed
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        // color removed
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        // backgroundColor removed
        borderWidth: 1,
        // borderColor removed
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 8,
        width: '100%',
    },
    chipActive: {
        backgroundColor: '#FFE5D9',
        borderColor: '#D35400',
        borderWidth: 2,
    },
    chipText: {
        fontSize: 14,
        // color removed
    },
    chipTextActive: {
        color: '#D35400',
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 40,
    },
    backButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        // borderColor removed
        // backgroundColor removed
    },
    backButtonText: {
        // color removed
        fontSize: 16,
        fontWeight: '600',
    },
    completeButton: {
        flex: 2,
        backgroundColor: '#D35400',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
