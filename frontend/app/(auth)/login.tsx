import React, { useEffect, useState } from 'react';
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
    useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AuthInput, ForgotPasswordModal, AuthLogo } from '@/components/auth';
import { getAuthBackgroundColors, getAuthPalette } from '@/constants/authTheme';

export default function LoginScreen() {
    const router = useRouter();
    const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const { signIn, signInWithGoogle, signInWithApple } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const backgroundColors = getAuthBackgroundColors(isDark);
    const palette = getAuthPalette(isDark);

    useEffect(() => {
        if (typeof emailParam === 'string' && emailParam.trim().length > 0) {
            setEmail(emailParam);
        }
    }, [emailParam]);

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
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithGoogle();
        setLoading(false);

        if (error) {
            Alert.alert('Sign In Failed', error.message);
        }
    };

    const handleAppleLogin = async () => {
        setLoading(true);
        const { error } = await signInWithApple();
        setLoading(false);

        if (error) {
            Alert.alert('Sign In Failed', error.message);
        }
    };

    return (
        <LinearGradient
            colors={backgroundColors}
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
                    <AuthLogo />

                    {/* Title */}
                    <Text style={[styles.title, { color: palette.text }]}>Welcome to NJIT SHPE</Text>

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

                        {/* Remember Me & Forgot Password */}
                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setRememberMe(!rememberMe)}
                                activeOpacity={0.7}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        { borderColor: palette.checkboxBorder },
                                        rememberMe && { borderColor: palette.checkboxActive },
                                    ]}
                                >
                                    {rememberMe && (
                                        <Ionicons name="checkmark" size={14} color={palette.checkboxActive} />
                                    )}
                                </View>
                                <Text style={[styles.checkboxLabel, { color: palette.subtext }]}>Remember me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setShowForgotPasswordModal(true)}>
                                <Text style={[styles.forgotText, { color: palette.text }]}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <Pressable
                            onPress={handleLogin}
                            disabled={loading}
                            style={({ pressed }) => [
                                styles.loginButton,
                                loading && styles.buttonDisabled,
                                pressed && styles.buttonPressed,
                            ]}
                        >
                            <LinearGradient
                                colors={['#7FB3FF', '#5C8DFF', '#3B6BFF']}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.loginButtonText}>
                                    {loading ? 'Logging in...' : 'Log In'}
                                </Text>
                            </LinearGradient>
                        </Pressable>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
                            <Text style={[styles.dividerText, { color: palette.muted }]}>Or</Text>
                            <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={[
                                    styles.socialButton,
                                    { backgroundColor: palette.socialBg, borderColor: palette.socialBorder },
                                ]}
                                onPress={handleGoogleLogin}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="logo-google" size={20} color={palette.text} />
                                <Text style={[styles.socialButtonText, { color: palette.text }]}>Google</Text>
                            </TouchableOpacity>

                            {Platform.OS === 'ios' && (
                                <AppleAuthentication.AppleAuthenticationButton
                                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                    buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                    cornerRadius={10}
                                    style={styles.appleButton}
                                    onPress={handleAppleLogin}
                                />
                            )}
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: palette.muted }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/signup')}>
                            <Text style={[styles.footerLink, { color: palette.link }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Forgot Password Modal */}
            <ForgotPasswordModal
                visible={showForgotPasswordModal}
                onClose={() => setShowForgotPasswordModal(false)}
            />
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
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#F5F8FF',
        textAlign: 'center',
        marginBottom: 32,
        letterSpacing: 0.3,
    },
    form: {
        flex: 1,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 14,
        fontWeight: '400',
    },
    forgotText: {
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 24,
    },
    buttonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
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
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
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
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    socialButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 16,
    },
    footerText: {
        fontSize: 14,
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    appleButton: {
        flex: 1,
        height: 50,
    },
});
