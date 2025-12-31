import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { OnboardingPage1, OnboardingPage2, OnboardingPage3 } from '@/components/onboarding';
import type { UserType } from '@/types/userProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function OnboardingScreen() {
    const { user, signOut } = useAuth();
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<any>({});
    const { theme, isDark } = useTheme();

    // Get user info from auth context
    const userType = (user?.user_metadata?.user_type as UserType) || 'student';
    const userId = user?.id || '';
    const email = user?.email || '';

    const handleNext = (pageData: any) => {
        setFormData({ ...formData, ...pageData });
        setCurrentPage(currentPage + 1);
    };

    const handleBack = () => {
        setCurrentPage(currentPage - 1);
    };

    const totalPages = 3;

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        progressContainer: {
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
        },
        progressText: { color: theme.subtext },
        progressDot: { backgroundColor: theme.border },
        progressDotActive: { backgroundColor: '#D35400' }, // Keep brand color
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            {/* Progress Indicator */}
            <View style={[styles.progressContainer, dynamicStyles.progressContainer]}>
                <View style={styles.headerRow}>
                    <View style={styles.headerSpacer} />
                    <Text style={[styles.progressText, dynamicStyles.progressText]}>
                        Step {currentPage} of {totalPages}
                    </Text>
                    <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.progressBar}>
                    {[1, 2, 3].map((step) => (
                        <View
                            key={step}
                            style={[
                                styles.progressDot,
                                dynamicStyles.progressDot,
                                step <= currentPage && dynamicStyles.progressDotActive,
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Page Content */}
            {currentPage === 1 && (
                <OnboardingPage1
                    userType={userType}
                    initialData={formData}
                    onNext={handleNext}
                />
            )}

            {currentPage === 2 && (
                <OnboardingPage2
                    userType={userType}
                    initialData={formData}
                    onNext={handleNext}
                    onBack={handleBack}
                />
            )}

            {currentPage === 3 && (
                <OnboardingPage3
                    userType={userType}
                    userId={userId}
                    email={email}
                    formData={formData}
                    onBack={handleBack}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed
    },
    progressContainer: {
        // backgroundColor removed
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        // borderBottomColor removed
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerSpacer: {
        width: 60,
    },
    progressText: {
        fontSize: 14,
        // color removed
        fontWeight: '600',
    },
    signOutButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    signOutText: {
        fontSize: 14,
        color: '#D35400',
        fontWeight: '600',
    },
    progressBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        // backgroundColor removed
    },
    // progressDotActive removed (handled dynamically)
});
