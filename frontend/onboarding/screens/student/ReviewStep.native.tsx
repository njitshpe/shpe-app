import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/colors';
import ResumePreview from '@/components/shared/ResumePreview';

export interface FormData {
  firstName: string;
  lastName: string;
  major: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  interests: string[];
  resumeFile: DocumentPicker.DocumentPickerAsset | null;
  linkedinUrl: string;
  portfolioUrl: string;
  bio: string;
  phoneNumber: string;
}

interface ReviewStepProps {
  data: FormData;
  onNext: () => void;
}

const INTEREST_LABELS: Record<string, string> = {
  'internships': 'Internships 💼',
  'scholarships': 'Scholarships 🎓',
  'resume-help': 'Resume Help 📄',
  'mental-health': 'Mental Health 💙',
  'networking': 'Networking 🤝',
  'leadership': 'Leadership 🌟',
  'career-fairs': 'Career Fairs 🧭',
  'community-service': 'Community Service 🤲',
};

export default function ReviewStep({ data, onNext }: ReviewStepProps) {
  const { theme, isDark } = useTheme();

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <MotiView
      from={{ translateX: 50, opacity: 0 }}
      animate={{ translateX: 0, opacity: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Almost there!</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Review your information before we launch 🚀
          </Text>
        </View>

        {/* Hero ID Badge Card */}
        <MotiView
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <LinearGradient
            colors={isDark ? GRADIENTS.darkCard : GRADIENTS.lightCard}
            style={[styles.heroCard, { borderColor: SHPE_COLORS.accentBlueBright }]}
          >
            {/* Profile Photo with Gradient Ring */}
            <View style={styles.photoContainer}>
              <LinearGradient
                colors={GRADIENTS.accentButton}
                style={styles.photoRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {data.profilePhoto ? (
                  <Image source={{ uri: data.profilePhoto.uri }} style={styles.profileImage} />
                ) : (
                  <View
                    style={[
                      styles.placeholderImage,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(11, 22, 48, 0.08)' },
                    ]}
                  >
                    <Text style={[styles.placeholderText, { color: isDark ? '#F5F8FF' : '#0B1630' }]}>
                      {data.firstName?.charAt(0)}{data.lastName?.charAt(0)}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Name & Class Year */}
            <View style={styles.identitySection}>
              <Text style={[styles.fullName, { color: theme.text }]}>
                {data.firstName} {data.lastName}
              </Text>
              <Text style={[styles.major, { color: theme.subtext }]}>
                {data.major}
              </Text>
              <Text style={[styles.classYear, { color: SHPE_COLORS.accentBlueBright }]}>
                Class of {data.graduationYear}
              </Text>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Interests Pills */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Interests</Text>
              <View style={styles.interestsContainer}>
                {data.interests.map((id) => (
                  <View key={id} style={[styles.interestChip, { backgroundColor: isDark ? 'rgba(92, 141, 255, 0.2)' : 'rgba(92, 141, 255, 0.12)' }]}>
                    <Text style={[styles.interestText, { color: SHPE_COLORS.accentBlueBright }]}>
                      {INTEREST_LABELS[id] || id}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Additional Info */}
            {(data.resumeFile || data.linkedinUrl || data.bio || data.phoneNumber) && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Additional Info</Text>
                  {(data.linkedinUrl || data.portfolioUrl) && (
                    <View style={styles.linksRow}>
                      {data.linkedinUrl && (
                        <View style={[styles.linkChip, { backgroundColor: isDark ? 'rgba(14, 118, 168, 0.2)' : 'rgba(14, 118, 168, 0.12)' }]}>
                          <Text style={[styles.linkChipText, { color: '#0E76A8' }]}>LinkedIn 🔗</Text>
                        </View>
                      )}
                      {data.portfolioUrl && (
                        <View style={[styles.linkChip, { backgroundColor: isDark ? 'rgba(92, 141, 255, 0.2)' : 'rgba(92, 141, 255, 0.12)' }]}>
                          <Text style={[styles.linkChipText, { color: SHPE_COLORS.accentBlueBright }]}>Portfolio 🌐</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {data.resumeFile && (
                    <View style={styles.resumePreview}>
                      <Text style={[styles.sectionSubtitle, { color: theme.subtext }]}>Resume Preview</Text>
                      <ResumePreview file={data.resumeFile} />
                    </View>
                  )}
                  {data.phoneNumber && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailIcon}>📱</Text>
                      <Text style={[styles.detail, { color: theme.subtext }]}>
                        {formatPhoneDisplay(data.phoneNumber)}
                      </Text>
                    </View>
                  )}
                  {data.bio && (
                    <Text style={[styles.bioPreview, { color: theme.subtext }]} numberOfLines={2}>
                      {data.bio}
                    </Text>
                  )}
                </View>
              </>
            )}
          </LinearGradient>
        </MotiView>

        {/* Navigation Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={onNext} activeOpacity={0.8}>
            <LinearGradient
              colors={GRADIENTS.accentButton}
              style={styles.confirmButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.confirmButtonText}>Confirm & Launch 🚀</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={[styles.helperText, { color: theme.subtext }]}>
          You can update this information anytime in your profile settings.
        </Text>
      </ScrollView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.title,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  // Hero digital ID badge card
  heroCard: {
    borderWidth: 2,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  // Profile photo with gradient ring
  photoContainer: {
    marginBottom: SPACING.lg,
  },
  photoRing: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.full,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 112,
    height: 112,
    borderRadius: RADIUS.full,
  },
  placeholderImage: {
    width: 112,
    height: 112,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 36,
    fontWeight: '700',
  },
  // Identity section
  identitySection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fullName: {
    ...TYPOGRAPHY.headline,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  major: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: SPACING.xs / 2,
    textAlign: 'center',
  },
  classYear: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: SPACING.md,
  },
  section: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resumePreview: {
    marginBottom: SPACING.md,
  },
  // Interest chips (small pills)
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  interestChip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '600',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  linkChip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  linkChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Additional info rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  detail: {
    fontSize: 14,
    flex: 1,
  },
  bioPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  confirmButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
    ...SHADOWS.accentGlow,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
