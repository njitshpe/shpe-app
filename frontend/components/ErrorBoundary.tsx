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

/**
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

/**
 * Default Error Fallback UI
 * Displayed when an error is caught by the ErrorBoundary
 */
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
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 32,
        maxWidth: 400,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
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
        color: '#1A1A1A',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    errorDetails: {
        backgroundColor: '#FFF3F3',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        width: '100%',
        borderLeftWidth: 4,
        borderLeftColor: '#FF5F05',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#D32F2F',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        color: '#666666',
        fontFamily: 'monospace',
    },
    button: {
        backgroundColor: '#FF5F05',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 8,
        minWidth: 150,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
