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
    SafeAreaView,
} from 'react-native';
import type { UserType } from '../../types/userProfile';

interface OnboardingPage1Props {
    userType: UserType;
    initialData: any;
    onNext: (data: any) => void;
}

const MAJORS = [
    'Computer Science',
    'Computer Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biomedical Engineering',
    'Chemical Engineering',
    'Industrial Engineering',
    'Information Systems',
    'Data Science',
    'Other',
];

const AFFILIATIONS = [
    'Industry Partner',
    'Faculty',
    'Student from other school',
    'Community Member',
    'Other',
];

export function OnboardingPage1({ userType, initialData, onNext }: OnboardingPage1Props) {
    const [firstName, setFirstName] = useState(initialData.firstName || '');
    const [lastName, setLastName] = useState(initialData.lastName || '');
    const [major, setMajor] = useState(initialData.major || '');
    const [affiliation, setAffiliation] = useState(initialData.affiliation || '');
    const [bio, setBio] = useState(initialData.bio || '');

    // Dropdown state
    const [modalVisible, setModalVisible] = useState(false);
    const [dropdownType, setDropdownType] = useState<'major' | 'affiliation' | null>(null);

    const handleNext = () => {
        // Validation
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Error', 'Please enter your first and last name');
            return;
        }

        if ((userType === 'student' || userType === 'alumni') && !major) {
            Alert.alert('Error', 'Please select your major');
            return;
        }

        if (userType === 'other' && !affiliation) {
            Alert.alert('Error', 'Please select your affiliation');
            return;
        }

        if (!bio.trim()) {
            Alert.alert('Error', 'Please write a short bio');
            return;
        }

        // Pass data to next page
        const data: any = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            bio: bio.trim(),
        };

        if (userType === 'student' || userType === 'alumni') {
            data.major = major;
        } else {
            data.affiliation = affiliation;
        }

        onNext(data);
    };

    const openDropdown = (type: 'major' | 'affiliation') => {
        setDropdownType(type);
        setModalVisible(true);
        Keyboard.dismiss();
    };

    const handleSelect = (item: string) => {
        if (dropdownType === 'major') {
            setMajor(item);
        } else {
            setAffiliation(item);
        }
        setModalVisible(false);
    };

    const renderDropdownItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleSelect(item)}
        >
            <Text style={[
                styles.dropdownItemText,
                (dropdownType === 'major' ? major : affiliation) === item && styles.dropdownItemTextActive
            ]}>
                {item}
            </Text>
            {(dropdownType === 'major' ? major : affiliation) === item && (
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
                    <Text style={styles.title}>Let's get to know you</Text>
                    <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

                    {/* First Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="John"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Last Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Doe"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Major (for students/alumni) or Affiliation (for others) */}
                    {userType === 'student' || userType === 'alumni' ? (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Major *</Text>
                            <TouchableOpacity
                                style={styles.dropdownTrigger}
                                onPress={() => openDropdown('major')}
                            >
                                <Text style={[styles.dropdownText, !major && styles.placeholderText]}>
                                    {major || 'Select your major'}
                                </Text>
                                <Text style={styles.dropdownIcon}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Affiliation *</Text>
                            <TouchableOpacity
                                style={styles.dropdownTrigger}
                                onPress={() => openDropdown('affiliation')}
                            >
                                <Text style={[styles.dropdownText, !affiliation && styles.placeholderText]}>
                                    {affiliation || 'Select your affiliation'}
                                </Text>
                                <Text style={styles.dropdownIcon}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Bio */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio *</Text>
                        <Text style={styles.hint}>Tell us about yourself in 2-3 sentences</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="I'm a passionate engineer interested in..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>

            {/* Dropdown Modal */}
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
                            <Text style={styles.modalTitle}>
                                Select {dropdownType === 'major' ? 'Major' : 'Affiliation'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={dropdownType === 'major' ? MAJORS : AFFILIATIONS}
                            renderItem={renderDropdownItem}
                            keyExtractor={(item) => item}
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
    hint: {
        fontSize: 12,
        color: '#999',
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
        minHeight: 100,
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
    nextButton: {
        backgroundColor: '#D35400',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
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
        maxHeight: '70%',
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
