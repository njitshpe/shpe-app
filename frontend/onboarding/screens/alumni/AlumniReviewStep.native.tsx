import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '@/constants/colors';

export interface FormData {
  firstName: string;
  lastName: string;
  major: string;
  degreeType: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  company: string;
  jobTitle: string;
  linkedinUrl: string;
  professionalBio: string;
  industry: string;
  mentorshipAvailable: boolean;
  mentorshipWays: string[];
}

interface AlumniReviewStepProps {
  data: FormData;
  onNext: () => void;
}

const MENTORSHIP_WAY_LABELS: Record<string, string> = {
  'resume-reviews': '📄 Resume Reviews',
  'mock-interviews': '🎤 Mock Interviews',
  'coffee-chats': '☕ Coffee Chats',
  'company-tours': '🏢 Company Tours',
};

export default function AlumniReviewStep({ data, onNext }: AlumniReviewStepProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outerContainer}>
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

            {/* Name & Professional Role - EMPHASIZED */}
            <View style={styles.identitySection}>
              <Text style={[styles.fullName, { color: theme.text }]}>
                {data.firstName} {data.lastName}
              </Text>
              {/* Emphasize Job Title at Company */}
              <Text style={[styles.professionalRole, { color: SHPE_COLORS.accentBlueBright }]}>
                {data.jobTitle} at {data.company}
              </Text>
              {/* Mentor Badge */}
              {data.mentorshipAvailable && (
                <View style={[styles.mentorBadge, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.15)' }]}>
                  <Text style={styles.mentorBadgeText}>🌟 Active Mentor</Text>
                </View>
              )}
              {/* De-emphasize education */}
              <Text style={[styles.education, { color: theme.subtext }]}>
                {data.degreeType} {data.major} • Class of {data.graduationYear}
              </Text>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Expertise Tags (Industry) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Expertise</Text>
              <View style={styles.interestsContainer}>
                <View style={[styles.interestChip, { backgroundColor: isDark ? 'rgba(92, 141, 255, 0.2)' : 'rgba(92, 141, 255, 0.12)' }]}>
                  <Text style={[styles.interestText, { color: SHPE_COLORS.accentBlueBright }]}>
                    {data.industry}
                  </Text>
                </View>
              </View>
            </View>

            {/* Mentorship Areas - Replaces Student Interests */}
            {data.mentorshipAvailable && data.mentorshipWays && data.mentorshipWays.length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Mentorship Areas</Text>
                  <View style={styles.interestsContainer}>
                    {data.mentorshipWays.map((wayId) => (
                      <View key={wayId} style={[styles.interestChip, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 215, 0, 0.15)' }]}>
                        <Text style={[styles.interestText, { color: '#B8860B' }]}>
                          {MENTORSHIP_WAY_LABELS[wayId] || wayId}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Professional Bio (if provided) */}
            {data.professionalBio && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Professional Bio</Text>
                  <Text style={[styles.bioPreview, { color: theme.subtext }]}>
                    {data.professionalBio}
                  </Text>
                </View>
              </>
            )}

            {/* LinkedIn (if provided) */}
            {data.linkedinUrl && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Professional Links</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailIcon}>🔗</Text>
                    <Text style={[styles.detail, { color: theme.subtext }]} numberOfLines={1}>
                      LinkedIn connected
                    </Text>
                  </View>
                </View>
              </>
            )}
          </LinearGradient>
        </MotiView>

        <Text style={[styles.helperText, { color: theme.subtext }]}>
          You can update this information anytime in your profile settings.
        </Text>
      </ScrollView>
      </MotiView>

      {/* Fixed Navigation Button - Outside MotiView */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || SPACING.md }]}>
        <TouchableOpacity onPress={onNext} activeOpacity={0.8} style={styles.buttonWrapper}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
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
    paddingBottom: SPACING.md,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    backgroundColor: 'transparent',
  },
  buttonWrapper: {
    width: '100%',
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
  professionalRole: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  mentorBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  mentorBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B8860B',
  },
  education: {
    fontSize: 14,
    fontWeight: '500',
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
  },
  // Buttons
  confirmButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 52,
    alignItems: 'center',
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
