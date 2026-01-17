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
    Platform,
    Modal,
    AlertButton,
    KeyboardAvoidingView,
    Switch,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CreateEventData, EventQuestion, QuestionType } from '@/services/adminEvents.service';
import { Ionicons } from '@expo/vector-icons';
import { PhotoHelper } from '@/services/photo.service';
import { storageService } from '@/services/storage.service';
import * as ImagePicker from 'expo-image-picker';

interface AdminEventFormProps {
    initialData?: Partial<CreateEventData>;
    onSubmit: (data: CreateEventData) => Promise<boolean>;
    onCancel: () => void;
    mode: 'create' | 'edit';
}

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

const QUESTION_TYPES: { type: QuestionType; label: string }[] = [
    { type: 'short_text', label: 'Short Answer' },
    { type: 'long_text', label: 'Long Answer' },
    { type: 'single_choice', label: 'Single Choice' },
    { type: 'multi_select', label: 'Multi Select' },
    { type: 'phone', label: 'Phone Number' },
    { type: 'ucid', label: 'UCID' },
    { type: 'file', label: 'File' },
];

export function AdminEventForm({ initialData, onSubmit, onCancel, mode }: AdminEventFormProps) {
    const { theme, isDark } = useTheme();
    const [loading, setLoading] = useState(false);

    // --- Form State ---
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [locationName, setLocationName] = useState(initialData?.location_name || '');
    const [location, setLocation] = useState(initialData?.location_address || '');
    const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || '');
    const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // --- RSVP & Questions State ---
    const [requiresRSVP, setRequiresRSVP] = useState(initialData?.requires_rsvp || false);
    const [questions, setQuestions] = useState<EventQuestion[]>(initialData?.registration_questions || []);

    // --- Building/Location State ---
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [roomNumber, setRoomNumber] = useState('');

    // --- Date/Time State ---
    const [startDate, setStartDate] = useState(initialData?.start_time ? new Date(initialData.start_time) : new Date());
    const [endDate, setEndDate] = useState(initialData?.end_time ? new Date(initialData.end_time) : new Date(Date.now() + 2 * 60 * 60 * 1000));
    const [showDateTimeModal, setShowDateTimeModal] = useState(false);
    const [editingField, setEditingField] = useState<'start' | 'end' | null>(null);
    const [tempDate, setTempDate] = useState(new Date());

    // Dynamic styles based on theme
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

    // --- QUESTION BUILDER LOGIC ---

    const addNewQuestionCard = () => {
        const newQ: EventQuestion = {
            id: Date.now().toString(),
            type: 'short_text',
            prompt: '',
            required: false,
            options: [],
        };
        setQuestions([...questions, newQ]);
    };

    const updateQuestionField = (id: string, field: keyof EventQuestion, value: any) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    // Options Logic
    const addOptionToQuestion = (qId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                return { ...q, options: [...(q.options || []), ''] };
            }
            return q;
        }));
    };

    const updateOptionText = (qId: string, index: number, text: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                const newOptions = [...(q.options || [])];
                newOptions[index] = text;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const removeOption = (qId: string, index: number) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                const newOptions = [...(q.options || [])];
                newOptions.splice(index, 1);
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    // --- Validation & Submit ---
    const validateForm = (): string | null => {
        if (!name.trim()) return 'Event name is required';
        if (!locationName.trim()) return 'Location name is required';
        if (endDate <= startDate) return 'End time must be after start time';
        
        if (requiresRSVP) {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.prompt.trim()) return `Question ${i + 1} is missing a prompt.`;
                if ((q.type === 'single_choice' || q.type === 'multi_select') && (!q.options || q.options.length === 0)) {
                    return `Question ${i + 1} needs at least one option.`;
                }
            }
        }
        return null;
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

            // CLEAN THE OPTIONS
            const cleanedQuestions = questions.map(q => ({
                ...q,
                options: q.options?.filter(o => o.trim() !== '') || []
            }));

            const eventData: CreateEventData = {
                name: name.trim(),
                description: description.trim() || undefined,
                location_name: locationName.trim(),
                location_address: location.trim() || undefined,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                cover_image_url: posterUrl || undefined,
                requires_rsvp: requiresRSVP,
                registration_questions: requiresRSVP ? cleanedQuestions : [],
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

    // --- Helpers ---
    const handleImagePick = async () => {
        const result = await PhotoHelper.pickFromLibrary({ allowsEditing: false, quality: 0.8 });
        if(result) setSelectedImage({ uri: result, width: 0, height: 0, assetId: null });
    };

    const handleBuildingChange = (buildingName: string) => {
        setSelectedBuilding(buildingName);
        const building = NJIT_BUILDINGS.find(b => b.name === buildingName);
        if (building && building.name !== 'Other') setLocation(building.address);
        else setLocation('');
        if (roomNumber) setLocationName(buildingName === 'Other' ? roomNumber : `${buildingName} ${roomNumber}`);
        else setLocationName(buildingName === 'Other' ? '' : buildingName);
    };

    const handleRoomNumberChange = (room: string) => {
        setRoomNumber(room);
        if (selectedBuilding) setLocationName(selectedBuilding === 'Other' ? room : `${selectedBuilding} ${room}`);
        else setLocationName(room);
    };

    const openDateTimePicker = (field: 'start' | 'end') => {
        setEditingField(field);
        setTempDate(field === 'start' ? startDate : endDate);
        setShowDateTimeModal(true);
    };

    return (
        <>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={[styles.container, dynamicStyles.container]} keyboardShouldPersistTaps="handled">
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, dynamicStyles.text]}>{mode === 'create' ? 'Create Event' : 'Edit Event'}</Text>
                            <TouchableOpacity onPress={onCancel} disabled={loading}>
                                <Ionicons name="close" size={28} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.form}>
                            {/* Poster Upload */}
                            <View style={styles.field}>
                                <Text style={[styles.label, dynamicStyles.text]}>Event Poster</Text>
                                {(selectedImage || coverImageUrl) && (
                                    <View style={styles.posterPreview}>
                                        <Image source={{ uri: selectedImage?.uri || coverImageUrl }} style={styles.posterImage} resizeMode="contain" />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => { setSelectedImage(null); setCoverImageUrl(''); }}
                                            disabled={loading}
                                        >
                                            <Ionicons name="close-circle" size={32} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <TouchableOpacity style={[styles.uploadButton, dynamicStyles.card]} onPress={handleImagePick} disabled={loading || uploadingImage}>
                                    <Ionicons name="image-outline" size={24} color={theme.primary} />
                                    <Text style={[styles.uploadButtonText, dynamicStyles.text]}>
                                        {selectedImage || coverImageUrl ? 'Change Poster' : 'Upload Poster'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Name & Description */}
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

                            {/* Location */}
                            <View style={styles.field}>
                                <Text style={[styles.label, dynamicStyles.text]}>Building *</Text>
                                <TouchableOpacity
                                    style={[styles.dateTimeButtonFull, dynamicStyles.input]}
                                    onPress={() => {
                                        Alert.alert(
                                            'Select Building', '',
                                            NJIT_BUILDINGS.map<AlertButton>(building => ({
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

                            <View style={styles.field}>
                                <Text style={[styles.label, dynamicStyles.text]}>{selectedBuilding === 'Other' ? 'Location Name *' : 'Room Number'}</Text>
                                <TextInput
                                    style={[styles.input, dynamicStyles.input]}
                                    value={roomNumber}
                                    onChangeText={handleRoomNumberChange}
                                    placeholder={selectedBuilding === 'Other' ? 'e.g., Off-campus venue' : 'e.g., 1100'}
                                    placeholderTextColor={theme.subtext}
                                    editable={!loading}
                                />
                            </View>

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
                            </View>

                            {/* Dates */}
                            <View style={styles.row}>
                                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                                    <Text style={[styles.label, dynamicStyles.text]}>Starts</Text>
                                    <TouchableOpacity style={[styles.dateTimeButtonFull, dynamicStyles.input]} onPress={() => openDateTimePicker('start')}>
                                        <Text style={[styles.dateTimeButtonText, dynamicStyles.text]}>
                                            {startDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={[styles.label, dynamicStyles.text]}>Ends</Text>
                                    <TouchableOpacity style={[styles.dateTimeButtonFull, dynamicStyles.input]} onPress={() => openDateTimePicker('end')}>
                                        <Text style={[styles.dateTimeButtonText, dynamicStyles.text]}>
                                            {endDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* --- RSVP & QUESTIONS --- */}
                            <View style={styles.separator} />
                            <View style={styles.rsvpHeader}>
                                <Text style={[styles.sectionTitle, dynamicStyles.text]}>Registration</Text>
                                <View style={styles.switchRow}>
                                    <Text style={[styles.label, dynamicStyles.text, { marginBottom: 0 }]}>Require RSVP?</Text>
                                    <Switch
                                        value={requiresRSVP}
                                        onValueChange={setRequiresRSVP}
                                        trackColor={{ false: '#767577', true: theme.primary }}
                                        thumbColor={'#f4f3f4'}
                                    />
                                </View>
                            </View>

                            {requiresRSVP && (
                                <View style={styles.questionsSection}>
                                    <Text style={[styles.subtext, dynamicStyles.subtext, { marginBottom: 15 }]}>
                                        Customize the questions users must answer to register.
                                    </Text>

                                    {questions.map((q, index) => (
                                        <View key={q.id} style={[styles.questionCard, dynamicStyles.card]}>
                                            <View style={styles.questionCardHeader}>
                                                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                                                <TouchableOpacity onPress={() => removeQuestion(q.id)}>
                                                    <Ionicons name="trash-outline" size={20} color="#FF453A" />
                                                </TouchableOpacity>
                                            </View>

                                            {/* Prompt Input */}
                                            <TextInput
                                                style={[styles.input, dynamicStyles.input, { marginBottom: 15 }]}
                                                placeholder="What do you want to ask?"
                                                placeholderTextColor={theme.subtext}
                                                value={q.prompt}
                                                onChangeText={(text) => updateQuestionField(q.id, 'prompt', text)}
                                            />

                                            {/* Type Selector (Wrapped) */}
                                            <View style={styles.typeContainer}>
                                                {QUESTION_TYPES.map((t) => (
                                                    <TouchableOpacity
                                                        key={t.type}
                                                        style={[
                                                            styles.typeChip,
                                                            q.type === t.type ? { backgroundColor: theme.primary } : { backgroundColor: isDark ? '#333' : '#eee' }
                                                        ]}
                                                        onPress={() => updateQuestionField(q.id, 'type', t.type)}
                                                    >
                                                        <Text style={[
                                                            styles.typeChipText,
                                                            q.type === t.type ? { color: '#fff' } : { color: theme.text }
                                                        ]}>
                                                            {t.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {/* Options Builder */}
                                            {(q.type === 'single_choice' || q.type === 'multi_select') && (
                                                <View style={styles.optionsContainer}>
                                                    <Text style={[styles.label, dynamicStyles.subtext, { fontSize: 12 }]}>Options:</Text>
                                                    {q.options?.map((opt, optIndex) => (
                                                        <View key={optIndex} style={styles.optionRow}>
                                                            <Ionicons name={q.type === 'single_choice' ? "radio-button-off" : "square-outline"} size={16} color={theme.subtext} />
                                                            <TextInput
                                                                style={[styles.optionInput, dynamicStyles.input]}
                                                                placeholder={`Option ${optIndex + 1}`}
                                                                placeholderTextColor={theme.subtext}
                                                                value={opt}
                                                                onChangeText={(text) => updateOptionText(q.id, optIndex, text)}
                                                            />
                                                            <TouchableOpacity onPress={() => removeOption(q.id, optIndex)}>
                                                                <Ionicons name="close" size={18} color={theme.subtext} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ))}
                                                    <TouchableOpacity style={styles.addOptionBtn} onPress={() => addOptionToQuestion(q.id)}>
                                                        <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>+ Add Option</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {/* Required Toggle */}
                                            <TouchableOpacity 
                                                style={styles.requiredToggle}
                                                onPress={() => updateQuestionField(q.id, 'required', !q.required)}
                                            >
                                                <Ionicons name={q.required ? "checkbox" : "square-outline"} size={20} color={theme.primary} />
                                                <Text style={[styles.requiredText, dynamicStyles.text]}>Required Question</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        style={[styles.addQuestionButton, { borderColor: theme.primary, borderStyle: 'dashed', borderWidth: 1 }]}
                                        onPress={addNewQuestionCard}
                                    >
                                        <Ionicons name="add" size={20} color={theme.primary} />
                                        <Text style={[styles.addQuestionText, { color: theme.primary }]}>Add Question</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.actions}>
                                <TouchableOpacity style={[styles.button, dynamicStyles.cancelButton]} onPress={onCancel} disabled={loading}>
                                    <Text style={[styles.buttonText, dynamicStyles.text]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.submitButton, dynamicStyles.button]} onPress={handleSubmit} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{mode === 'create' ? 'Create Event' : 'Save Changes'}</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Date Time Modal */}
            <Modal visible={showDateTimeModal} transparent animationType="fade" onRequestClose={() => setShowDateTimeModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, dynamicStyles.card]}>
                        <Text style={[styles.modalTitle, dynamicStyles.text]}>{editingField === 'start' ? 'Start Time' : 'End Time'}</Text>
                        <TouchableOpacity 
                            style={[styles.button, dynamicStyles.button, { marginTop: 20 }]} 
                            onPress={() => {
                                if (editingField === 'start') setStartDate(new Date(startDate.getTime() + 3600000));
                                setShowDateTimeModal(false);
                            }}
                        >
                            <Text style={styles.submitButtonText}>Done</Text>
                        </TouchableOpacity>
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
        paddingBottom: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    form: {
        gap: 16,
    },
    field: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtext: {
        fontSize: 13,
        opacity: 0.7,
    },
    input: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    uploadButton: {
        height: 120,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    posterPreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
        position: 'relative',
    },
    posterImage: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    dateTimeButtonFull: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    dateTimeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateTimeButtonText: {
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 10,
        opacity: 0.3,
    },
    rsvpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    questionsSection: {
        gap: 15,
    },
    questionCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    questionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    questionNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        opacity: 0.5,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    typeChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    optionsContainer: {
        marginTop: 5,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: '#eee',
        marginBottom: 10,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    optionInput: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 14,
        height: 40,
    },
    addOptionBtn: {
        marginTop: 4,
    },
    requiredToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        gap: 8,
    },
    requiredText: {
        fontSize: 14,
    },
    addQuestionButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    addQuestionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {},
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        padding: 20,
        borderRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});