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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AuthInput } from '@/components/auth';
import { useTheme } from '@/contexts/ThemeContext';

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

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        title: { color: theme.text },
        subtitle: { color: theme.subtext },
        googleButton: {
            backgroundColor: theme.card,
            borderColor: theme.border,
        },
        googleButtonText: { color: theme.text },
        dividerLine: { backgroundColor: theme.border },
        dividerText: { color: theme.subtext },
        footerText: { color: theme.subtext },
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, dynamicStyles.container]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>SHPE</Text>
                    </View>
                    <Text style={[styles.title, dynamicStyles.title]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Sign in to your SHPE NJIT account</Text>
                </View>

                <View style={styles.form}>
                    <TouchableOpacity
                        style={[styles.googleButton, dynamicStyles.googleButton, loading && styles.buttonDisabled]}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                    >
                        <Text style={[styles.googleButtonText, dynamicStyles.googleButtonText]}>Continue with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, dynamicStyles.dividerLine]} />
                        <Text style={[styles.dividerText, dynamicStyles.dividerText]}>or</Text>
                        <View style={[styles.dividerLine, dynamicStyles.dividerLine]} />
                    </View>

                    <AuthInput
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@email.com"
                        keyboardType="email-address"
                    />

                    <AuthInput
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, dynamicStyles.footerText]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/signup')}>
                            <Text style={styles.link}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#D35400',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        // color removed
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        // color removed
    },
    form: {
        width: '100%',
    },
    googleButton: {
        // backgroundColor removed
        borderWidth: 1,
        // borderColor removed
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    googleButtonText: {
        // color removed
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        // backgroundColor removed
    },
    dividerText: {
        marginHorizontal: 16,
        // color removed
        fontSize: 14,
    },
    button: {
        backgroundColor: '#D35400',
        padding: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        // color removed
        fontSize: 14,
    },
    link: {
        color: '#D35400',
        fontSize: 14,
        fontWeight: '600',
    },
});
