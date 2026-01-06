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

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();

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
                    <Text style={styles.title}>Welcome to NJIT SHPE</Text>

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
                                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                    {rememberMe && (
                                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>Remember me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Reset link sent!')}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
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
                                colors={['#8B7FD6', '#B895D9', '#FFA86E']}
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
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity
                                style={styles.socialButton}
                                onPress={handleGoogleLogin}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/signup')}>
                            <Text style={styles.footerLink}>Sign Up</Text>
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
    forgotText: {
        fontSize: 14,
        color: '#FFFFFF',
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
