import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import type { UserType } from '../../types/userProfile';

interface OnboardingPage2Props {
    userType: UserType;
    initialData: any;
    onNext: (data: any) => void;
    onBack: () => void;
}

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
const PAST_YEARS = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

export function OnboardingPage2({ userType, initialData, onNext, onBack }: OnboardingPage2Props) {
    // Student/Alumni fields
    const [gradYear, setGradYear] = useState(initialData.graduation_year?.toString() || initialData.expected_graduation_year?.toString() || '');

    // Alumni fields
    const [company, setCompany] = useState(initialData.current_company || '');
    const [position, setPosition] = useState(initialData.current_position || '');

    // Other fields
    const [schoolName, setSchoolName] = useState(initialData.school_name || '');
    const [reason, setReason] = useState(initialData.reason_for_joining || '');

    // Dropdown state
    const [modalVisible, setModalVisible] = useState(false);

    const handleNext = () => {
        const data: any = {};

        if (userType === 'student') {
            if (!gradYear) {
                Alert.alert('Error', 'Please select your expected graduation year');
                return;
            }
            data.expected_graduation_year = parseInt(gradYear);
        } else if (userType === 'alumni') {
            if (!gradYear) {
                Alert.alert('Error', 'Please select your graduation year');
                return;
            }
            data.graduation_year = parseInt(gradYear);
            if (company) data.current_company = company.trim();
            if (position) data.current_position = position.trim();
        } else if (userType === 'other') {
            if (initialData.affiliation === 'Student from other school' && !schoolName.trim()) {
                Alert.alert('Error', 'Please enter your school name');
                return;
            }
            if (schoolName) data.school_name = schoolName.trim();
            if (reason) data.reason_for_joining = reason.trim();
        }

        onNext(data);
    };

    const openDropdown = () => {
        setModalVisible(true);
        Keyboard.dismiss();
    };

    const handleSelectYear = (year: number) => {
        setGradYear(year.toString());
        setModalVisible(false);
    };

    const renderDropdownItem = ({ item }: { item: number }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleSelectYear(item)}
        >
            <Text style={[
                styles.dropdownItemText,
                gradYear === item.toString() && styles.dropdownItemTextActive
            ]}>
                {item}
            </Text>
            {gradYear === item.toString() && (
                <Text style={styles.checkmark}>✓</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Additional Details</Text>
                    <Text style={styles.subtitle}>Help us tailor your experience</Text>

                    {(userType === 'student' || userType === 'alumni') && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                {userType === 'student' ? 'Expected Graduation Year *' : 'Graduation Year *'}
                            </Text>
                            <TouchableOpacity
                                style={styles.dropdownTrigger}
                                onPress={openDropdown}
                            >
                                <Text style={[styles.dropdownText, !gradYear && styles.placeholderText]}>
                                    {gradYear || 'Select Year'}
                                </Text>
                                <Text style={styles.dropdownIcon}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {userType === 'alumni' && (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Current Company (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={company}
                                    onChangeText={setCompany}
                                    placeholder="e.g. Google"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Current Position (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={position}
                                    onChangeText={setPosition}
                                    placeholder="e.g. Software Engineer"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </>
                    )}

                    {userType === 'other' && (
                        <>
                            {initialData.affiliation === 'Student from other school' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>School Name *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={schoolName}
                                        onChangeText={setSchoolName}
                                        placeholder="e.g. Rutgers University"
                                        placeholderTextColor="#999"
                                    />
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Reason for Joining (Optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={reason}
                                    onChangeText={setReason}
                                    placeholder="Why do you want to join the SHPE community?"
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={onBack}>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>

            {/* Year Dropdown Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Year</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={userType === 'student' ? YEARS : PAST_YEARS}
                            renderItem={renderDropdownItem}
                            keyExtractor={(item) => item.toString()}
                            style={styles.list}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        minHeight: 80,
        paddingTop: 12,
    },
    dropdownTrigger: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    placeholderText: {
        color: '#999',
    },
    dropdownIcon: {
        fontSize: 12,
        color: '#666',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    backButton: {
        flex: 1,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    backButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#D35400',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    closeButton: {
        fontSize: 16,
        color: '#D35400',
        fontWeight: '600',
    },
    list: {
        padding: 20,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    dropdownItemTextActive: {
        color: '#D35400',
        fontWeight: '600',
    },
    checkmark: {
        fontSize: 16,
        color: '#D35400',
        fontWeight: 'bold',
    },
});
