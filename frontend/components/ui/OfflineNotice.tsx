import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OfflineNotice() {
    const insets = useSafeAreaInsets();
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(!!state.isConnected);
        });

        return () => unsubscribe();
    }, []);

    if (isConnected) {
        return null;
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.text}>No Internet Connection</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#b52424', // Offline banner color
        paddingHorizontal: 20,
        paddingBottom: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
