import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AuthInput } from '@/components/auth';

export default function SignupScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();

    const handleSignup = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email');
            return;
        }

        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (!agreeToTerms) {
            Alert.alert('Error', 'Please agree to Terms & Privacy');
            return;
        }

        setLoading(true);

        const result = await signUp(email, password, {
            onboarding_completed: false,
        });

        if (result.error) {
            Alert.alert('Error', result.error.message);
        } else if (result.needsEmailConfirmation) {
            Alert.alert(
                'Verify Your Email',
                `We've sent a verification link to ${email}. Please check your email and click the link to verify your account. Once verified, you can sign in.`,
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            );
        } else {
            Alert.alert(
                'Success',
                'Account created successfully!',
                [{ text: 'OK' }]
            );
        }
        setLoading(false);
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    };

    return (
        <LinearGradient
            colors={['#4A3B6E', '#2A2550', '#1E1B3B']}
            style={styles.gradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <View style={styles.logoInnerCircle}>
                                <View style={styles.logoDiamond} />
                            </View>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Sign up Account</Text>

                    {/* Form */}
                    <View style={styles.form}>
                        <AuthInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <AuthInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your Password"
                            secureTextEntry
                        />

                        <AuthInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm Password"
                            secureTextEntry
                        />

                        {/* Terms & Privacy Checkbox */}
                        <View style={styles.termsRow}>
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setAgreeToTerms(!agreeToTerms)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                                    {agreeToTerms && (
                                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>Agree to Terms & Privacy</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Sign Up Button */}
                        <Pressable
                            onPress={handleSignup}
                            disabled={loading}
                            style={({ pressed }) => [
                                styles.signupButton,
                                loading && styles.buttonDisabled,
                                pressed && styles.buttonPressed,
                            ]}
                        >
                            <LinearGradient
                                colors={['#8B7FD6', '#B895D9', '#FFA86E']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.signupButtonText}>
                                    {loading ? 'Creating account...' : 'Sign Up'}
                                </Text>
                            </LinearGradient>
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleGoogleSignup}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.socialButton}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/login')}>
                            <Text style={styles.footerLink}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 80,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoInnerCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoDiamond: {
        width: 16,
        height: 16,
        backgroundColor: '#FFFFFF',
        transform: [{ rotate: '45deg' }],
        borderRadius: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 32,
        letterSpacing: 0.3,
    },
    form: {
        flex: 1,
    },
    termsRow: {
        marginTop: 4,
        marginBottom: 24,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: 'transparent',
        borderColor: '#FFFFFF',
    },
    checkboxLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '400',
    },
    signupButton: {
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 24,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
    },
    socialRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 16,
    },
    footerText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    footerLink: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
