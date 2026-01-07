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
    useColorScheme,
    Modal,
    SafeAreaView,
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
    const [loading, setLoading] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const backgroundColors = isDark
        ? ['#001e55', '#001339', '#00030a']
        : ['#F7FAFF', '#E9F0FF', '#DDE8FF'];
    const palette = isDark
        ? {
            text: '#F5F8FF',
            subtext: 'rgba(229, 239, 255, 0.85)',
            muted: 'rgba(229, 239, 255, 0.7)',
            logoBg: 'rgba(255, 255, 255, 0.12)',
            logoBorder: 'rgba(255, 255, 255, 0.25)',
            logoInner: 'rgba(255, 255, 255, 0.18)',
            logoDiamond: '#FFFFFF',
            checkboxBorder: 'rgba(191, 215, 255, 0.55)',
            checkboxActive: '#FFFFFF',
            divider: 'rgba(255, 255, 255, 0.16)',
            socialBg: 'rgba(255, 255, 255, 0.12)',
            socialBorder: 'rgba(255, 255, 255, 0.2)',
            link: '#CFE0FF',
        }
        : {
            text: '#0B1630',
            subtext: 'rgba(22, 39, 74, 0.75)',
            muted: 'rgba(22, 39, 74, 0.6)',
            logoBg: 'rgba(11, 22, 48, 0.08)',
            logoBorder: 'rgba(11, 22, 48, 0.18)',
            logoInner: 'rgba(11, 22, 48, 0.12)',
            logoDiamond: '#0B1630',
            checkboxBorder: 'rgba(11, 22, 48, 0.35)',
            checkboxActive: '#0B1630',
            divider: 'rgba(11, 22, 48, 0.15)',
            socialBg: 'rgba(255, 255, 255, 0.7)',
            socialBorder: 'rgba(11, 22, 48, 0.12)',
            link: '#2D4E9D',
        };

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
                [{ text: 'OK', onPress: () => router.replace({ pathname: '/(auth)/login', params: { email } }) }]
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
                    <View style={styles.logoContainer}>
                        <View style={[styles.logoCircle, { backgroundColor: palette.logoBg, borderColor: palette.logoBorder }]}>
                            <View style={[styles.logoInnerCircle, { backgroundColor: palette.logoInner }]}>
                                <View style={[styles.logoDiamond, { backgroundColor: palette.logoDiamond }]} />
                            </View>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: palette.text }]}>Sign up Account</Text>

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

                        {/* Terms & Privacy */}
                        <View style={styles.termsRow}>
                            <Text
                                style={[styles.checkboxLabel, { color: palette.subtext }]}
                            >
                                By continuing, you accept our
                                <Text style={[styles.linkText, { color: palette.link }]} onPress={() => setShowTermsModal(true)}>
                                    {' '}Terms of Conditions
                                </Text>
                                {' '}and
                                <Text style={[styles.linkText, { color: palette.link }]} onPress={() => setShowPrivacyModal(true)}>
                                    {' '}Privacy Policy
                                </Text>
                            </Text>
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
                                colors={['#7FB3FF', '#5C8DFF', '#3B6BFF']}
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
                                onPress={handleGoogleSignup}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="logo-google" size={20} color={palette.text} />
                                <Text style={[styles.socialButtonText, { color: palette.text }]}>Google</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: palette.muted }]}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/login')}>
                            <Text style={[styles.footerLink, { color: palette.link }]}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Terms & Conditions Modal */}
            <Modal
                visible={showTermsModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowTermsModal(false)}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#001339' : '#FFFFFF' }]}>
                    <View
                        style={[
                            styles.modalHeader,
                            { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(11, 22, 48, 0.12)' },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: palette.text }]}>Terms of Conditions</Text>
                        <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.modalClose}>
                            <Ionicons name="close" size={22} color={palette.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={[styles.modalText, { color: palette.subtext }]}>
                            Add your Terms of Conditions content here.
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Privacy Policy Modal */}
            <Modal
                visible={showPrivacyModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowPrivacyModal(false)}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#001339' : '#FFFFFF' }]}>
                    <View
                        style={[
                            styles.modalHeader,
                            { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(11, 22, 48, 0.12)' },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: palette.text }]}>Privacy Policy</Text>
                        <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.modalClose}>
                            <Ionicons name="close" size={22} color={palette.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={[styles.modalText, { color: palette.subtext }]}>
                            Add your Privacy Policy content here.
                        </Text>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
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
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    logoInnerCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
        color: '#F5F8FF',
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
    checkboxLabel: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 18,
    },
    linkText: {
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalClose: {
        padding: 4,
    },
    modalContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    modalText: {
        fontSize: 14,
        lineHeight: 20,
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
});
