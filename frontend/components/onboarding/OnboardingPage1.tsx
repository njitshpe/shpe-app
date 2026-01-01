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
    Image,
    ActionSheetIOS,
} from 'react-native';
import { PhotoHelper } from '@/services';
import type { UserType } from '@/types/userProfile';
import { useTheme } from '@/contexts/ThemeContext';

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

    const [profilePicture, setProfilePicture] = useState(initialData.profile_picture_url || null);

    // Dropdown state
    const [modalVisible, setModalVisible] = useState(false);
    const [dropdownType, setDropdownType] = useState<'major' | 'affiliation' | null>(null);

    const { theme, isDark } = useTheme();

    const handleImagePick = async () => {
        const options = ['Take Photo', 'Choose from Library', 'Choose from Files', 'Cancel'];
        const cancelButtonIndex = 3;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                },
                async (buttonIndex) => {
                    if (buttonIndex === 0) {
                        const uri = await PhotoHelper.takePhoto();
                        if (uri) setProfilePicture(uri);
                    } else if (buttonIndex === 1) {
                        const uri = await PhotoHelper.pickFromLibrary();
                        if (uri) setProfilePicture(uri);
                    } else if (buttonIndex === 2) {
                        const uri = await PhotoHelper.pickFromFiles();
                        if (uri) setProfilePicture(uri);
                    }
                }
            );
        } else {
            Alert.alert(
                'Change Profile Picture',
                'Choose an option',
                [
                    {
                        text: 'Take Photo', onPress: async () => {
                            const uri = await PhotoHelper.takePhoto();
                            if (uri) setProfilePicture(uri);
                        }
                    },
                    {
                        text: 'Choose from Library', onPress: async () => {
                            const uri = await PhotoHelper.pickFromLibrary();
                            if (uri) setProfilePicture(uri);
                        }
                    },
                    {
                        text: 'Choose from Files', onPress: async () => {
                            const uri = await PhotoHelper.pickFromFiles();
                            if (uri) setProfilePicture(uri);
                        }
                    },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
        }
    };

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
            profile_picture_url: profilePicture,
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

    const dynamicStyles = {
        title: { color: theme.text },
        subtitle: { color: theme.subtext },
        label: { color: theme.text },
        hint: { color: theme.subtext },
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
        nextButton: { backgroundColor: theme.primary },
        modalContent: { backgroundColor: theme.card },
        modalHeader: { borderBottomColor: theme.border },
        modalTitle: { color: theme.text },
        closeButton: { color: theme.primary },
        dropdownItem: { borderBottomColor: theme.border },
        dropdownItemText: { color: theme.text },
        dropdownItemTextActive: { color: theme.primary },
        checkmark: { color: theme.primary },
        avatarPlaceholder: { backgroundColor: isDark ? '#333' : '#E0E0E0' },
        avatarInitials: { color: theme.subtext },
        editIconBadge: { backgroundColor: theme.primary, borderColor: theme.card },
        changePhotoText: { color: theme.primary },
    };

    const renderDropdownItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[styles.dropdownItem, dynamicStyles.dropdownItem]}
            onPress={() => handleSelect(item)}
        >
            <Text style={[
                styles.dropdownItemText,
                dynamicStyles.dropdownItemText,
                (dropdownType === 'major' ? major : affiliation) === item && dynamicStyles.dropdownItemTextActive
            ]}>
                {item}
            </Text>
            {(dropdownType === 'major' ? major : affiliation) === item && (
                <Text style={[styles.checkmark, dynamicStyles.checkmark]}>✓</Text>
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
                    <Text style={[styles.title, dynamicStyles.title]}>Let's get to know you</Text>
                    <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Tell us a bit about yourself</Text>

                    {/* Avatar Picker */}
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={handleImagePick} style={styles.avatarWrapper}>
                            {profilePicture ? (
                                <Image source={{ uri: profilePicture }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, dynamicStyles.avatarPlaceholder]}>
                                    <Text style={[styles.avatarInitials, dynamicStyles.avatarInitials]}>
                                        {firstName && lastName ? `${firstName[0]}${lastName[0]}` : '📷'}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.editIconBadge, dynamicStyles.editIconBadge]}>
                                <Text style={styles.editIconText}>+</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleImagePick}>
                            <Text style={[styles.changePhotoText, dynamicStyles.changePhotoText]}>Add Profile Photo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* First Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>First Name *</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="John"
                            placeholderTextColor={theme.subtext}
                        />
                    </View>

                    {/* Last Name */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Last Name *</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Doe"
                            placeholderTextColor={theme.subtext}
                        />
                    </View>

                    {/* Major (for students/alumni) or Affiliation (for others) */}
                    {userType === 'student' || userType === 'alumni' ? (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, dynamicStyles.label]}>Major *</Text>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, dynamicStyles.dropdownTrigger]}
                                onPress={() => openDropdown('major')}
                            >
                                <Text style={[
                                    styles.dropdownText,
                                    dynamicStyles.dropdownText,
                                    !major && dynamicStyles.placeholderText
                                ]}>
                                    {major || 'Select your major'}
                                </Text>
                                <Text style={[styles.dropdownIcon, dynamicStyles.dropdownIcon]}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, dynamicStyles.label]}>Affiliation *</Text>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, dynamicStyles.dropdownTrigger]}
                                onPress={() => openDropdown('affiliation')}
                            >
                                <Text style={[
                                    styles.dropdownText,
                                    dynamicStyles.dropdownText,
                                    !affiliation && dynamicStyles.placeholderText
                                ]}>
                                    {affiliation || 'Select your affiliation'}
                                </Text>
                                <Text style={[styles.dropdownIcon, dynamicStyles.dropdownIcon]}>▼</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Bio */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Bio *</Text>
                        <Text style={[styles.hint, dynamicStyles.hint]}>Tell us about yourself in 2-3 sentences</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, dynamicStyles.input]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="I'm a passionate engineer interested in..."
                            placeholderTextColor={theme.subtext}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity style={[styles.nextButton, dynamicStyles.nextButton]} onPress={handleNext}>
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
                    <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                        <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
                            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>
                                Select {dropdownType === 'major' ? 'Major' : 'Affiliation'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={[styles.closeButton, dynamicStyles.closeButton]}>Close</Text>
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
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    hint: {
        fontSize: 12,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    dropdownTrigger: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
    },
    dropdownIcon: {
        fontSize: 12,
    },
    nextButton: {
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
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        fontSize: 16,
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
    },
    dropdownItemText: {
        fontSize: 16,
    },
    checkmark: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    editIconText: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: 'bold',
    },
    changePhotoText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
    },
});
