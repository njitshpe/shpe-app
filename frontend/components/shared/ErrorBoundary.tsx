import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/*
 * Error Boundary Component
 * Catches React rendering errors and provides a fallback UI
 * Prevents the entire app from crashing due to component errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error details for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // You can also log to an error reporting service here
        // Example: logErrorToService(error, errorInfo);
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided, otherwise use default
            if (this.props.fallback && this.state.error) {
                return this.props.fallback(this.state.error, this.resetError);
            }

            return <ErrorFallback error={this.state.error} onReset={this.resetError} />;
        }

        return this.props.children;
    }
}

// Default Error Fallback UI
// Displayed when an error is caught by the ErrorBoundary
interface ErrorFallbackProps {
    error: Error | null;
    onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.emoji}>⚠️</Text>
                <Text style={styles.title}>Oops! Something went wrong</Text>
                <Text style={styles.message}>
                    We encountered an unexpected error. Don't worry, your data is safe.
                </Text>

                {__DEV__ && error && (
                    <View style={styles.errorDetails}>
                        <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                        <Text style={styles.errorText}>{error.message}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.button} onPress={onReset}>
                    <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000000',
    },
    content: {
        borderRadius: 16,
        padding: 32,
        maxWidth: 400,
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#111111',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        color: '#FFFFFF',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
        color: '#FFFFFF',
    },
    errorDetails: {
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        width: '100%',
        borderLeftWidth: 4,
        borderColor: '#444444',
        backgroundColor: '#1A1A1A',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#FFFFFF',
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#FFFFFF',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        minWidth: 150,
        alignItems: 'center',
        backgroundColor: '#222222',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
