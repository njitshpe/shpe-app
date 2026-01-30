import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeInfo } from '@/utils/committeeUtils';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.55;

interface CommitteeHeroHeaderProps {
    committee: CommitteeInfo;
}

export const CommitteeHeroHeader: React.FC<CommitteeHeroHeaderProps> = ({ committee }) => {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Background Image */}
            <Image
                source={committee.image}
                style={styles.image}
                contentFit="cover"
                transition={500}
            />

            {/* Blur Layers for Readability */}
            <BlurView
                intensity={isDark ? 2 : 2}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '60%' }]}
            />
            <BlurView
                intensity={isDark ? 5 : 5}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '50%' }]}
            />
            <BlurView
                intensity={isDark ? 10 : 8}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '40%' }]}
            />
            <BlurView
                intensity={isDark ? 15 : 12}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '30%' }]}
            />
            <BlurView
                intensity={isDark ? 20 : 15}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '20%' }]}
            />
            <BlurView
                intensity={isDark ? 30 : 20}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '10%' }]}
            />

            {/* Gradient Overlay */}
            <LinearGradient
                colors={[
                    'transparent',
                    'transparent',
                    isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.6)',
                    theme.background
                ]}
                locations={[0, 0.3, 0.65, 1]}
                style={styles.gradient}
            />

            {/* Back Button */}
            <View style={[styles.backButtonContainer, { top: insets.top + 10 }]}>
                <Pressable
                    style={({ pressed }) => [
                        styles.backButton,
                        { opacity: pressed ? 0.7 : 1 }
                    ]}
                    onPress={() => router.back()}
                >
                    <BlurView
                        intensity={40}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.backButtonBlur}
                    >
                        <Ionicons name="chevron-back" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
                    </BlurView>
                </Pressable>
            </View>

            {/* Content Overlay */}
            <View style={styles.contentContainer}>
                <Text style={[styles.eyebrow, { color: isDark ? '#b0b0b0' : '#555555' }]}>
                    Committee
                </Text>

                <Text style={[styles.title, { color: theme.text }]}>
                    {committee.shortTitle}
                </Text>

                <View style={styles.divider} />

                <Text style={[styles.description, { color: isDark ? '#b0b0b0' : '#555555' }]}>
                    {committee.description}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: HEADER_HEIGHT,
        width: width,
        position: 'relative',
        marginBottom: 20,
        backgroundColor: 'transparent',
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        width: width,
        height: HEADER_HEIGHT,
    },
    blurLayer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        height: HEADER_HEIGHT,
    },
    backButtonContainer: {
        position: 'absolute',
        left: 20,
        zIndex: 100,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    backButtonBlur: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    contentContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    eyebrow: {
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: 1,
        marginBottom: 0.1,
        opacity: 0.9,
    },
    title: {
        fontSize: 42,
        fontWeight: '500',
        letterSpacing: -1.5,
        lineHeight: 50,
        marginBottom: 10,
    },
    divider: {
        height: 0.8,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        opacity: 0.25,
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '400',
        maxWidth: '100%',
    },
});
