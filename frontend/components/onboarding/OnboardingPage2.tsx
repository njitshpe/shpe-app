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
import type { UserType } from '@/types/userProfile';
import { useTheme } from '@/contexts/ThemeContext';

interface OnboardingPage2Props {
    userType: UserType;
    initialData: any;
    onNext: (data: any) => void;
    onBack: () => void;
}

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
const PAST_YEARS = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

export function OnboardingPage2({ userType, initialData, onNext, onBack }: OnboardingPage2Props) {
    const { theme, isDark } = useTheme();

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

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        title: { color: theme.text },
        subtitle: { color: theme.subtext },
        label: { color: theme.text },
        input: {
            backgroundColor: theme.card,
            borderColor: theme.border,
            color: theme.text,
        },
        dropdownTrigger: {
            backgroundColor: theme.card,
            borderColor: theme.border,
        },
        dropdownText: { color: theme.text },
        placeholderText: { color: theme.subtext },
        dropdownIcon: { color: theme.subtext },
        backButton: {
            backgroundColor: theme.card,
            borderColor: theme.border,
        },
        backButtonText: { color: theme.subtext },
        modalContent: { backgroundColor: theme.card },
        modalHeader: { borderBottomColor: theme.border },
        modalTitle: { color: theme.text },
        dropdownItem: { borderBottomColor: theme.border },
        dropdownItemText: { color: theme.text },
    };

    const renderDropdownItem = ({ item }: { item: number }) => (
        <TouchableOpacity
            style={[styles.dropdownItem, dynamicStyles.dropdownItem]}
            onPress={() => handleSelectYear(item)}
        >
            <Text style={[
                styles.dropdownItemText,
                dynamicStyles.dropdownItemText,
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
            style={[styles.container, dynamicStyles.container]}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView style={[styles.container, dynamicStyles.container]} contentContainerStyle={styles.content}>
                    <Text style={[styles.title, dynamicStyles.title]}>Additional Details</Text>
                    <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Help us tailor your experience</Text>

                    {(userType === 'student' || userType === 'alumni') && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, dynamicStyles.label]}>
                                {userType === 'student' ? 'Expected Graduation Year *' : 'Graduation Year *'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, dynamicStyles.dropdownTrigger]}
                                onPress={openDropdown}
                            >
                                <Text style={[
                                    styles.dropdownText,
                                    dynamicStyles.dropdownText,
                                    !gradYear && dynamicStyles.placeholderText
                                ]}>
                                    {gradYear || 'Select Year'}
                                </Text>
                                <Text style={[styles.dropdownIcon, dynamicStyles.dropdownIcon]}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {userType === 'alumni' && (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, dynamicStyles.label]}>Current Company (Optional)</Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    value={company}
                                    onChangeText={setCompany}
                                    placeholder="e.g. Google"
                                    placeholderTextColor={theme.subtext}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, dynamicStyles.label]}>Current Position (Optional)</Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    value={position}
                                    onChangeText={setPosition}
                                    placeholder="e.g. Software Engineer"
                                    placeholderTextColor={theme.subtext}
                                />
                            </View>
                        </>
                    )}

                    {userType === 'other' && (
                        <>
                            {initialData.affiliation === 'Student from other school' && (
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, dynamicStyles.label]}>School Name *</Text>
                                    <TextInput
                                        style={[styles.input, dynamicStyles.input]}
                                        value={schoolName}
                                        onChangeText={setSchoolName}
                                        placeholder="e.g. Rutgers University"
                                        placeholderTextColor={theme.subtext}
                                    />
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, dynamicStyles.label]}>Reason for Joining (Optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, dynamicStyles.input]}
                                    value={reason}
                                    onChangeText={setReason}
                                    placeholder="Why do you want to join the SHPE community?"
                                    placeholderTextColor={theme.subtext}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        </>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.backButton, dynamicStyles.backButton]} onPress={onBack}>
                            <Text style={[styles.backButtonText, dynamicStyles.backButtonText]}>Back</Text>
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
                    <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                        <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
                            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Select Year</Text>
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
        // backgroundColor removed
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        // color removed
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        // color removed
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        // color removed
        marginBottom: 8,
    },
    input: {
        // backgroundColor removed
        borderWidth: 1,
        // borderColor removed
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        // color removed
    },
    textArea: {
        minHeight: 80,
        paddingTop: 12,
    },
    dropdownTrigger: {
        // backgroundColor removed
        borderWidth: 1,
        // borderColor removed
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        // color removed
    },
    // placeholderText removed (handled dynamically)
    dropdownIcon: {
        fontSize: 12,
        // color removed
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
        // borderColor removed
        // backgroundColor removed
    },
    backButtonText: {
        // color removed
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
        // backgroundColor removed
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
        // borderBottomColor removed
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        // color removed
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
        // borderBottomColor removed
    },
    dropdownItemText: {
        fontSize: 16,
        // color removed
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
