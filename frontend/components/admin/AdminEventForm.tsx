import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    ActionSheetIOS,
    Platform,
    Modal,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CreateEventData } from '@/services/adminEvents.service';
import { Ionicons } from '@expo/vector-icons';
import { PhotoHelper } from '@/services/photo.service';
import { storageService } from '@/services/storage.service';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AdminEventFormProps {
    initialData?: Partial<CreateEventData>;
    onSubmit: (data: CreateEventData) => Promise<boolean>;
    onCancel: () => void;
    mode: 'create' | 'edit';
}

// NJIT Buildings
const NJIT_BUILDINGS = [
    { name: 'GITC', fullName: 'Guttenberg Information Technologies Center', address: '218 Central Ave, Newark, NJ 07102' },
    { name: 'CC', fullName: 'Campus Center', address: '150 Bleeker St, Newark, NJ 07102' },
    { name: 'FMH', fullName: 'Faculty Memorial Hall', address: '141-153 Warren St, Newark, NJ 07103' },
    { name: 'TIER', fullName: 'Tiernan Hall', address: '161 Warren St, Newark, NJ 07103' },
    { name: 'CKB', fullName: 'Central King Building', address: '138 Warren St, Newark, NJ 07103' },
    { name: 'KUPF', fullName: 'Kupfrian Hall', address: '100 Summit St, Newark, NJ 07103' },
    { name: 'EBER', fullName: 'Eberhardt Hall', address: '323 Dr Martin Luther King Jr Blvd, Newark, NJ 07102' },
    { name: 'ECE', fullName: 'Electrical and Computer Engineering Center', address: 'Ece Bldg, Newark, NJ 07103' },
    { name: 'WEC', fullName: 'Wellness & Events Center', address: '100 Lock St, Newark, NJ 07103' },
    { name: 'Other', fullName: 'Other Location', address: '' },
];

export function AdminEventForm({ initialData, onSubmit, onCancel, mode }: AdminEventFormProps) {
    const { theme, isDark } = useTheme();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [locationName, setLocationName] = useState(initialData?.location_name || '');
    const [location, setLocation] = useState(initialData?.location || '');
    const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || '');
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Building selector state
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [roomNumber, setRoomNumber] = useState('');

    // Date/Time picker state
    const [startDate, setStartDate] = useState(initialData?.start_time ? new Date(initialData.start_time) : new Date());
    const [endDate, setEndDate] = useState(initialData?.end_time ? new Date(initialData.end_time) : new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours later
    const [showDateTimeModal, setShowDateTimeModal] = useState(false);
    const [editingField, setEditingField] = useState<'start' | 'end' | null>(null);
    const [tempDate, setTempDate] = useState(new Date());
    const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        card: { backgroundColor: theme.card, borderColor: theme.border },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        input: {
            backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5',
            color: theme.text,
            borderColor: theme.border,
        },
        button: { backgroundColor: theme.primary },
        cancelButton: { backgroundColor: isDark ? '#333' : '#E5E5E5' },
    };

    const validateForm = (): string | null => {
        if (!name.trim()) return 'Event name is required';
        if (!locationName.trim()) return 'Location name is required';

        // Validate dates
        if (endDate <= startDate) return 'End time must be after start time';

        return null;
    };

    const handleImagePick = async () => {
        const options = Platform.OS === 'ios'
            ? ['Take Photo', 'Choose from Library', 'Cancel']
            : ['Take Photo', 'Choose from Library'];

        const showPicker = () => {
            if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options,
                        cancelButtonIndex: 2,
                    },
                    async (buttonIndex) => {
                        if (buttonIndex === 0) {
                            const uri = await PhotoHelper.takePhoto({ allowsEditing: false, quality: 1 });
                            if (uri) handleImageSelected(uri);
                        } else if (buttonIndex === 1) {
                            const uri = await PhotoHelper.pickFromLibrary({ allowsEditing: false, quality: 1 });
                            if (uri) handleImageSelected(uri);
                        }
                    }
                );
            } else {
                // Android: Show simple alert
                Alert.alert(
                    'Select Image',
                    'Choose an option',
                    [
                        {
                            text: 'Take Photo', onPress: async () => {
                                const uri = await PhotoHelper.takePhoto({ allowsEditing: false, quality: 1 });
                                if (uri) handleImageSelected(uri);
                            }
                        },
                        {
                            text: 'Choose from Library', onPress: async () => {
                                const uri = await PhotoHelper.pickFromLibrary({ allowsEditing: false, quality: 1 });
                                if (uri) handleImageSelected(uri);
                            }
                        },
                        { text: 'Cancel', style: 'cancel' },
                    ]
                );
            }
        };

        showPicker();
    };

    const handleImageSelected = async (uri: string) => {
        setSelectedImage({
            uri,
            width: 0,
            height: 0,
            assetId: null,
        });
    };

    const handleBuildingChange = (buildingName: string) => {
        setSelectedBuilding(buildingName);
        const building = NJIT_BUILDINGS.find(b => b.name === buildingName);

        if (building && building.name !== 'Other') {
            // Auto-fill address for NJIT buildings
            setLocation(building.address);
        } else {
            // Clear address for "Other" to allow manual input
            setLocation('');
        }

        // Update location name with building + room
        if (roomNumber) {
            setLocationName(buildingName === 'Other' ? roomNumber : `${buildingName} ${roomNumber}`);
        } else {
            setLocationName(buildingName === 'Other' ? '' : buildingName);
        }
    };

    const handleRoomNumberChange = (room: string) => {
        setRoomNumber(room);

        // Update location name with building + room
        if (selectedBuilding) {
            setLocationName(selectedBuilding === 'Other' ? room : `${selectedBuilding} ${room}`);
        } else {
            setLocationName(room);
        }
    };


    const openDateTimePicker = (field: 'start' | 'end') => {
        setEditingField(field);
        setTempDate(field === 'start' ? startDate : endDate);
        setPickerMode('date');
        setShowDateTimeModal(true);
    };

    const handleDateTimeConfirm = () => {
        if (editingField === 'start') {
            setStartDate(tempDate);
        } else if (editingField === 'end') {
            setEndDate(tempDate);
        }
        setShowDateTimeModal(false);
        setEditingField(null);
    };

    const handleDateTimeCancel = () => {
        setShowDateTimeModal(false);
        setEditingField(null);
    };

    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setLoading(true);
        try {
            let posterUrl = coverImageUrl;

            // Upload image if one was selected
            if (selectedImage) {
                setUploadingImage(true);
                const tempEventId = `temp-${Date.now()}`;
                const uploadResult = await storageService.uploadEventPoster(tempEventId, selectedImage);
                setUploadingImage(false);

                if (!uploadResult.success || !uploadResult.data) {
                    Alert.alert('Upload Error', 'Failed to upload poster image');
                    setLoading(false);
                    return;
                }

                posterUrl = uploadResult.data.url;
            }

            const eventData: CreateEventData = {
                name: name.trim(),
                description: description.trim() || undefined,
                location_name: locationName.trim(),
                location: location.trim() || undefined,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                cover_image_url: posterUrl || undefined,
            };

            const success = await onSubmit(eventData);
            if (success) {
                Alert.alert(
                    'Success',
                    `Event ${mode === 'create' ? 'created' : 'updated'} successfully!`,
                    [{ text: 'OK', onPress: onCancel }]
                );
            } else {
                Alert.alert('Error', `Failed to ${mode} event. Please try again.`);
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <ScrollView style={[styles.container, dynamicStyles.container]}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, dynamicStyles.text]}>
                            {mode === 'create' ? 'Create Event' : 'Edit Event'}
                        </Text>
                        <TouchableOpacity onPress={onCancel} disabled={loading}>
                            <Ionicons name="close" size={28} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        {/* Event Name */}
                        <View style={styles.field}>
                            <Text style={[styles.label, dynamicStyles.text]}>Event Name *</Text>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g., General Meeting"
                                placeholderTextColor={theme.subtext}
                                editable={!loading}
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.field}>
                            <Text style={[styles.label, dynamicStyles.text]}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, dynamicStyles.input]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Event description..."
                                placeholderTextColor={theme.subtext}
                                multiline
                                numberOfLines={4}
                                editable={!loading}
                            />
                        </View>

                        {/* Event Poster */}
                        <View style={styles.field}>
                            <Text style={[styles.label, dynamicStyles.text]}>Event Poster</Text>

                            {(selectedImage || coverImageUrl) && (
                                <View style={styles.posterPreview}>
                                    <Image
                                        source={{ uri: selectedImage?.uri || coverImageUrl }}
                                        style={styles.posterImage}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => {
                                            setSelectedImage(null);
                                            setCoverImageUrl('');
                                        }}
                                        disabled={loading}
                                    >
                                        <Ionicons name="close-circle" size={32} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.uploadButton, dynamicStyles.card]}
                                onPress={handleImagePick}
                                disabled={loading || uploadingImage}
                            >
                                <Ionicons name="image-outline" size={24} color={theme.primary} />
                                <Text style={[styles.uploadButtonText, dynamicStyles.text]}>
                                    {selectedImage || coverImageUrl ? 'Change Poster' : 'Upload Poster'}
                                </Text>
                            </TouchableOpacity>
                            <Text style={[styles.hint, dynamicStyles.subtext]}>
                                Recommended: Portrait format (e.g., 1080x1920px or 9:16 ratio)
                            </Text>
                        </View>

                        {/* Building Selection */}
                        <View style={styles.field}>
                            <Text style={[styles.label, dynamicStyles.text]}>Building *</Text>
                            <TouchableOpacity
                                style={[styles.dateTimeButtonFull, dynamicStyles.input]}
                                onPress={() => {
                                    Alert.alert(
                                        'Select Building',
                                        '',
                                        NJIT_BUILDINGS.map(building => ({
                                            text: `${building.name} - ${building.fullName}`,
                                            onPress: () => handleBuildingChange(building.name)
                                        })).concat([{ text: 'Cancel', style: 'cancel' }])
                                    );
                                }}
                                disabled={loading}
                            >
                                <View style={styles.dateTimeContent}>
                                    <Ionicons name="business-outline" size={20} color={theme.primary} />
                                    <Text style={[styles.dateTimeButtonText, dynamicStyles.text]}>
                                        {selectedBuilding ? NJIT_BUILDINGS.find(b => b.name === selectedBuilding)?.fullName || selectedBuilding : 'Select a building...'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>

                        {/* Room Number */}
                        <View style={styles.field}>
                            <Text style={[styles.label, dynamicStyles.text]}>
                                {selectedBuilding === 'Other' ? 'Location Name *' : 'Room Number'}
                            </Text>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                value={roomNumber}
                                onChangeText={handleRoomNumberChange}
                                placeholder={selectedBuilding === 'Other' ? 'e.g., Off-campus venue' : 'e.g., 1100'}
                                placeholderTextColor={theme.subtext}
                                editable={!loading}
                            />
                        </View>

                        {/* Full Address */}
                        <View style={styles.field}>
                            <Text style={[styles.label, dynamicStyles.text]}>Full Address</Text>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                value={location}
                                onChangeText={setLocation}
                                placeholder="e.g., 323 Dr Martin Luther King Jr Blvd, Newark, NJ"
                                placeholderTextColor={theme.subtext}
                                editable={!loading && selectedBuilding === 'Other'}
                            />
                            {selectedBuilding && selectedBuilding !== 'Other' && (
                                <Text style={[styles.hint, dynamicStyles.subtext]}>
                                    Auto-filled based on building selection
                                </Text>
                            )}
                        </View>

                        {/* Start Date & Time */}
                        <View style={styles.field}>
                            <Text style={[styles.label, dynamicStyles.text]}>Start Date & Time *</Text>
                            <TouchableOpacity
                                style={[styles.dateTimeButtonFull, dynamicStyles.input]}
                                onPress={() => openDateTimePicker('start')}
                                disabled={loading}
                            >
                                <View style={styles.dateTimeContent}>
                                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                    <Text style={[styles.dateTimeButtonText, dynamicStyles.text]}>
                                        {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>

                        {/* End Date & Time */}
                        <View style={styles.field}>
                            <Text style={[styles.label, dynamicStyles.text]}>End Date & Time *</Text>
                            <TouchableOpacity
                                style={[styles.dateTimeButtonFull, dynamicStyles.input]}
                                onPress={() => openDateTimePicker('end')}
                                disabled={loading}
                            >
                                <View style={styles.dateTimeContent}>
                                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                    <Text style={[styles.dateTimeButtonText, dynamicStyles.text]}>
                                        {endDate.toLocaleDateString()} at {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>

                    </View>

                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, dynamicStyles.cancelButton]}
                        onPress={onCancel}
                        disabled={loading}
                    >
                        <Text style={[styles.buttonText, dynamicStyles.text]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, dynamicStyles.button]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {mode === 'create' ? 'Create Event' : 'Save Changes'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Date/Time Picker Modal */}
            <Modal
                visible={showDateTimeModal}
                transparent
                animationType="slide"
                onRequestClose={handleDateTimeCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, dynamicStyles.card]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, dynamicStyles.text]}>
                                {editingField === 'start' ? 'Start' : 'End'} Date & Time
                            </Text>
                            <TouchableOpacity onPress={handleDateTimeCancel}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Mode Toggle */}
                        <View style={styles.modeToggle}>
                            <TouchableOpacity
                                style={[
                                    styles.modeButton,
                                    pickerMode === 'date' && styles.modeButtonActive,
                                    pickerMode === 'date' && { backgroundColor: theme.primary },
                                ]}
                                onPress={() => setPickerMode('date')}
                            >
                                <Text
                                    style={[
                                        styles.modeButtonText,
                                        pickerMode === 'date' && styles.modeButtonTextActive,
                                    ]}
                                >
                                    Date
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modeButton,
                                    pickerMode === 'time' && styles.modeButtonActive,
                                    pickerMode === 'time' && { backgroundColor: theme.primary },
                                ]}
                                onPress={() => setPickerMode('time')}
                            >
                                <Text
                                    style={[
                                        styles.modeButtonText,
                                        pickerMode === 'time' && styles.modeButtonTextActive,
                                    ]}
                                >
                                    Time
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Date/Time Picker */}
                        <View style={styles.pickerWrapper}>
                            <DateTimePicker
                                value={tempDate}
                                mode={pickerMode}
                                display="spinner"
                                onChange={(event, date) => {
                                    if (date) setTempDate(date);
                                }}
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel, dynamicStyles.card]}
                                onPress={handleDateTimeCancel}
                            >
                                <Text style={[styles.modalButtonText, dynamicStyles.text]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: theme.primary }]}
                                onPress={handleDateTimeConfirm}
                            >
                                <Text style={styles.modalButtonTextConfirm}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    form: {
        gap: 20,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: 12,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
        marginBottom: 40,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        flex: 2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    posterPreview: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    posterImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 16,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    dateTimeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateTimeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    dateTimeButtonFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    dateTimeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    dateTimeButtonText: {
        fontSize: 16,
        flex: 1,
    },
    pickerContainer: {
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    modeToggle: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    modeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    modeButtonActive: {
        // backgroundColor set dynamically
    },
    modeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    modeButtonTextActive: {
        color: '#fff',
    },
    pickerWrapper: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonCancel: {
        borderWidth: 1,
    },
    modalButtonConfirm: {
        // backgroundColor set dynamically
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonTextConfirm: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
