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
import { INTEREST_OPTIONS } from '../../types/userProfile';
import type { UserType, InterestType } from '../../types/userProfile';
import { profileService } from '../../lib/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { ResumeUploader } from '../media';
import { useResume } from '../../hooks/profile/useResume';

interface OnboardingPage3Props {
    userType: UserType;
    userId: string;
    email: string;
    formData: any;
    onBack: () => void;
}

export function OnboardingPage3({ userType, userId, email, formData, onBack }: OnboardingPage3Props) {
    const { loadProfile, updateUserMetadata } = useAuth();
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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Final Steps</Text>
                    <Text style={styles.subtitle}>What are you interested in?</Text>

                    {/* Interests */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Interests * (Select all that apply)</Text>
                        <View style={styles.chipContainer}>
                            {INTEREST_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.chip,
                                        interests.includes(option.value) && styles.chipActive,
                                    ]}
                                    onPress={() => toggleInterest(option.value)}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
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
                        <Text style={styles.label}>LinkedIn URL (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={linkedin}
                            onChangeText={setLinkedin}
                            placeholder="https://linkedin.com/in/..."
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    </View>

                    {/* Phone Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="(555) 555-5555"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Resume Upload */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Resume (Optional)</Text>
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
                            style={styles.backButton}
                            onPress={onBack}
                            disabled={loading}
                        >
                            <Text style={styles.backButtonText}>Back</Text>
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
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
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
        color: '#666',
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
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    backButtonText: {
        color: '#666',
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
