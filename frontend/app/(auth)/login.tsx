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
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SHADOWS, SPACING, RADIUS, TYPOGRAPHY, SHPE_COLORS } from '@/constants/colors';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();
    const { theme, isDark } = useTheme();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Sign In Failed', error.message);
        }
        // If successful, auth state change will trigger navigation in root layout
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);

        if (error) {
            Alert.alert('Sign In Failed', error.message);
        }
    };

    const backgroundGradient = isDark ? GRADIENTS.darkBackground : GRADIENTS.lightBackground;

    return (
        <LinearGradient
            colors={backgroundGradient}
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
                    {/* Logo and Title - Top Left Anchor */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={GRADIENTS.primaryButton}
                                style={styles.logoCircle}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.logoText}>SHPE</Text>
                            </LinearGradient>
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
                        <Text style={[styles.subtitle, { color: theme.subtext }]}>
                            Sign in to continue to SHPE NJIT
                        </Text>
                    </View>

                    {/* Form - Middle Section */}
                    <View style={styles.form}>
                        <AuthInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <AuthInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry
                        />

                        {/* Primary CTA - Bottom (Thumb Zone) */}
                        <Pressable
                            onPress={handleLogin}
                            disabled={loading}
                            style={({ pressed }) => [
                                styles.button,
                                loading && styles.buttonDisabled,
                                pressed && styles.buttonPressed,
                            ]}
                        >
                            {({ pressed }) => (
                                <LinearGradient
                                    colors={pressed ? GRADIENTS.primaryButtonPressed : GRADIENTS.primaryButton}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </Text>
                                </LinearGradient>
                            )}
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                            <Text style={[styles.dividerText, { color: theme.subtext }]}>or</Text>
                            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                        </View>

                        {/* Google Button - Distinct Dark-Mode Friendly Style */}
                        <Pressable
                            onPress={handleGoogleLogin}
                            disabled={loading}
                            style={({ pressed }) => [
                                styles.googleButton,
                                { backgroundColor: theme.card, borderColor: theme.border },
                                loading && styles.buttonDisabled,
                                pressed && styles.googleButtonPressed,
                            ]}
                        >
                            <Ionicons
                                name="logo-google"
                                size={20}
                                color={isDark ? '#FFFFFF' : '#4285F4'}
                                style={styles.googleIcon}
                            />
                            <Text style={[styles.googleButtonText, { color: theme.text }]}>
                                Continue with Google
                            </Text>
                        </Pressable>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: theme.subtext }]}>
                                Don't have an account?{' '}
                            </Text>
                            <TouchableOpacity onPress={() => router.replace('/signup')}>
                                <Text style={[styles.link, { color: SHPE_COLORS.sunsetOrange }]}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        padding: SPACING.lg,
        paddingTop: SPACING.xxl + SPACING.lg, // Extra top padding
    },
    header: {
        marginBottom: SPACING.xxl,
    },
    logoContainer: {
        marginBottom: SPACING.lg,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    title: {
        ...TYPOGRAPHY.headline,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        ...TYPOGRAPHY.body,
        opacity: 0.85,
    },
    form: {
        flex: 1,
        justifyContent: 'center',
    },
    button: {
        marginTop: SPACING.lg,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.primaryGlow,
    },
    buttonGradient: {
        paddingVertical: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: SPACING.md,
        fontSize: 14,
        fontWeight: '500',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        ...SHADOWS.small,
    },
    googleButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    googleIcon: {
        marginRight: SPACING.sm,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.xl,
        paddingBottom: SPACING.lg,
    },
    footerText: {
        fontSize: 15,
    },
    link: {
        fontSize: 15,
        fontWeight: '600',
    },
});
