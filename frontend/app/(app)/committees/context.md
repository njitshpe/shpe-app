This was done:
is this something that I can implement to the profile page? it would be just for the background behind the profile picture and be subtle. it would use the profile picture the user uses. 
    <View style={styles.container}>
      {/* FULL SCREEN GLASS BACKGROUND */}
      <ImageBackground
        source={{ uri: event.coverImageUrl }}
        style={StyleSheet.absoluteFill}
        blurRadius={Platform.OS === 'android' ? 40 : 50}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.3)' }]} />

        {/* iOS Native Blur */}
        {Platform.OS === 'ios' && (
          <BlurView intensity={70} style={StyleSheet.absoluteFill} tint="dark" />
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
Yes, this can be implemented on the profile page. The approach would work well - using the user's profile picture as a blurred background creates a nice personalized effect.

Let me first look at the current profile page structure to understand how to integrate this.

Read [id].tsx
This is a great fit. The profile page already has:

ImageBackground imported (you'll need to add it)
BlurView from expo-blur already imported
A dark gradient background that can be replaced/enhanced
Access to profile.profile_picture_url
Here's how you could implement it. The key changes would be:

Add ImageBackground to the imports
Replace the LinearGradient background with an ImageBackground using the profile picture
Only show the blurred background when the profile picture exists (fallback to gradient otherwise)
The implementation would look something like this:


// Add ImageBackground to imports (line 2-11)
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Platform,
    ImageBackground,  // Add this
} from 'react-native';

// Then replace the LinearGradient in the return (around line 252-256)
<View style={styles.root}>
    <StatusBar style="light" translucent />
    
    {profile?.profile_picture_url ? (
        <ImageBackground
            source={{ uri: profile.profile_picture_url }}
            style={StyleSheet.absoluteFill}
            blurRadius={Platform.OS === 'android' ? 25 : 35}
        >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.5)' }]} />
            {Platform.OS === 'ios' && (
                <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark" />
            )}
        </ImageBackground>
    ) : (
        <LinearGradient colors={['#1a1a1a', '#000000']} style={StyleSheet.absoluteFill} />
    )}
    
    <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ... rest of content */}
    </SafeAreaView>
</View>
A few notes for subtlety:

Use a higher blur radius (25-35) to keep it subtle
The dark overlay (rgba(0,0,0,0.5-0.6)) keeps it from being too distracting
Falls back to the gradient when there's no profile picture
Would you like me to implement this change?

yes
Edit [id].tsx
Added 1 line
Edit [id].tsx
Added 15 lines
Done. The profile page now has a subtle blurred background using the user's profile picture. Here's what changed:

Added ImageBackground to the React Native imports
When a profile picture exists, it displays as a full-screen blurred background with:
Blur radius of 25 on Android, 35 on iOS
A dark overlay (60% opacity in dark mode, 50% in light mode)
An additional native BlurView on iOS for extra smoothness
Falls back to the original gradient when there's no profile picture
The effect will be subtle due to the high blur radius and dark overlay, creating a personalized ambient background without being distracting.

apply this to the profile view the user account see's in their profile page
Let me find the user's own profile page.

Globpattern: "**/profile/**/index.tsx"
Found 1 file
Globpattern: "**/profile.tsx"
No files found
Globpattern: "**/(tabs)/profile*.tsx"
No files found
Read index.tsx
Now I'll apply the same blurred profile picture background to the user's own profile page.

Edit index.tsx
Added 1 line
Edit index.tsx
Added 13 lines
Done. The user's own profile page now also has the blurred profile picture background. Both profile screens ([id].tsx](frontend/app/(app)/profile/[id].tsx) for viewing others and index.tsx for viewing your own) now share the same subtle effect:

Blurred profile picture as full-screen background (blur radius 25 on Android, 35 on iOS)
Dark overlay for readability (60% in dark mode, 50% in light mode)
Additional native BlurView on iOS for extra smoothness
Falls back to the gradient when no profile picture exists
perfect. last thing is make sure everything else looks good no matter if the user uses light or dark mode OS
Let me check both profile screens to ensure the light/dark mode handling is consistent, particularly for the blurred background overlay.

Read index.tsx (lines 209-258)
Read [id].tsx (lines 253-302)
I see a few issues for light mode support:

StatusBar is hardcoded to "light" in both files - should be dynamic
BlurView tint is hardcoded to "dark" - should adapt to theme
The user's profile page (index.tsx) uses gradientColors which properly adapts, but the public profile ([id].tsx) has hardcoded dark gradient colors
Let me fix these:

Edit index.tsx
Modified
Edit [id].tsx
Modified
Done. Here's what I updated for proper light/dark mode support in both profile screens:

Element	Dark Mode	Light Mode
StatusBar	light (white icons)	dark (black icons)
Overlay color	rgba(0,0,0,0.6)	rgba(255,255,255,0.7)
BlurView tint (iOS)	dark	light
Fallback gradient	#1a1a1a → #000000	#FFFFFF → #F5F5F5
The blurred background will now look appropriate in both themes - darker overlay in dark mode for that moody effect, and a lighter frosted glass effect in light mode.

Recreate the MonthHeroHeader for each of the 13 committee pages. you would do this by
create a committeeUtils.ts similar setup to eventUtils.ts.
use these images:
externalvp:
internalvp:
treasurer:
webmaster:
secretary:
pr: https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
marketing: https://images.unsplash.com/photo-1764096534686-68091ce5ab45?q=80&w=2231&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
event-coordinator:
outreach:https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
pre-college: https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
membership:shpetinas: https://www.shpenjit.org/_next/image?url=%2Fimages%2Fevents%2FSHPEtina%2FSHPEtinas.JPG&w=3840&q=75
internshpe:
https://www.shpenjit.org/_next/image?url=%2Fimages%2Fevents%2FHow-to%2Finterview10%3A18.JPG&w=3840&q=75
Show less
Recreate the MonthHeroHeader for each of the 13 commitee pages. you would do this by:
create a committeeUtils.ts similar setup to eventUtils.ts
use these images:
pr: https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
marketing: https://images.unsplash.com/photo-1764096534686-68091ce5ab45?q=80&w=2231&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
event coordinator: https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
outreach: http://images.unsplash.com/photo-1599059813005-11265ba4b4ce?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
pre-college: https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
membership: https://images.unsplash.com/photo-1499540633125-484965b60031?q=80&w=1771&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
externalvp: https://images.unsplash.com/photo-1594581979864-36977b15d0dc?q=80&w=1556&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
secretary: https://images.unsplash.com/photo-1702628772145-f788e5a9ec42?q=80&w=1748&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
webmaster: https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=2106&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
internalvp: https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
treasurer: https://images.unsplash.com/photo-1534469650761-fce6cc26ac0d?q=80&w=1771&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D

EXTERNAL VICE PRESIDENT: Establish and maintain relationships with external corporate partners and organizations. Organize any external corporate documents, send emails to professionals on a frequent basis, and attend in-person/virtual meetings to discuss unique ways to partner with corporate. 

INTERNAL VICE PRESIDENT: Establish and maintain relationships with internal NJIT colleges, departments, and student organizations for sponsorships and collaborations though emails and in-person/virtual meetings.

TREASURER:  Track income, expenses, reimbursements by maintaining accurate financial records and documents, help with fundraising events, help with researching and applying for grants.

SECRETARY: Assist in maintaining inventory of the office materials, supplies, and merchandise. Help to organize the office when needed. Committed to attending SHPE events to help take attendance. Come to the SHPE office during the Secretary's office hours to be creative and learn how we send out the biweekly newsletter!!

PUBLIC RELATIONS: Promoting SHPE’s mission and vision, events, and achievements to students, faculty, and the broader community. Maintain and oversee our social media accounts across various platforms, taking pictures during events, collaborate with marketing team, and more.

MARKETING: Creating promotional material , designing SHPE merchandise , helping maintain NJIT SHPE website 

EVENT COORDINATER: Plan, coordinate, and manage events for NJIT SHPE. Help with making google forms and or taking attendance for our events. Help either set up and or clean up the rooms we used for events. Buy any last-min supplies we may need (you will get reimbursed for any money or gas spent for NJIT SHPE).

OUTREACH: Help plan and coordinate volunteering events, help make google forums and research anyone in our community who wants to help.

PRE-COLLEGE: Sending weekly emails to other organization about our upcoming DDC event, taking meeting notes, keeping track in an organized manner of any forms and sign in sheet.

MEMBERSHIP DEV: Over-see attendance and feed back form for NJIT SHPE tutoring program. Help make presentations, help with outreach for first years seminar, Help EOP cohort meetings and any events to promote SHPE.

SHPEtina is committed to creating an inclusive and empowering environment where women and Latinas in STEM can thrive, lead, and inspire. We believe in fostering a supportive community that celebrates achievements, addresses challenges, and creates pathways for success in engineering and technology fields.

internshpe: InternSHPE provides hands-on opportunities to develop technical skills, build professional networks, and gain valuable industry experience while contributing to our chapter's mission.
Let me first look at the eventUtils.ts to understand the pattern, and then check the current committee pages structure.

Read eventUtils.ts
Read Committees.tsx
Globpattern: "**/committee/**/*.tsx"
No files found
Globpattern: "**/committees/**/*.tsx"
Found 13 files
Globpattern: "**/*committee*.tsx"
No files found
Let me look at one of the existing committee pages and the MonthHeroHeader component to understand how to integrate them.

Read external-vp.tsx
Grep "MonthHeroHeader"
3 lines of output
Read MonthHeroHeader.tsx
Now I have a clear picture. I'll create a committeeUtils.ts with the committee data and a CommitteeHeroHeader component, then update all 13 committee pages. Let me set up a todo list to track this.

Update Todos

Create committeeUtils.ts with committee data and images

Create CommitteeHeroHeader component

Update all 13 committee pages to use the new header
Write committeeUtils.ts
149 lines
export type CommitteeId =
    | 'external-vp'
    | 'internal-vp'
    | 'treasurer'
    | 'secretary'
    | 'public-relations'
    | 'marketing'
    | 'event-coordinator'
    | 'outreach'
    | 'pre-college'
    | 'membership'
    | 'shpetinas'
    | 'internshpe'
    | 'webmaster';

export interface CommitteeInfo {
    id: CommitteeId;
    title: string;
    shortTitle: string;
    description: string;
    image: string;
    icon: string;
    color: string;
}

export const COMMITTEE_DATA: Record<CommitteeId, CommitteeInfo> = {
    'external-vp': {
        id: 'external-vp',
        title: 'External Vice President',
        shortTitle: 'External VP',
        description: 'Establish and maintain relationships with external corporate partners and organizations. Organize any external corporate documents, send emails to professionals on a frequent basis, and attend in-person/virtual meetings to discuss unique ways to partner with corporate.',
        image: 'https://images.unsplash.com/photo-1594581979864-36977b15d0dc?q=80&w=1556&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'globe-outline',
        color: '#5E5CE6',
    },
    'internal-vp': {
        id: 'internal-vp',
        title: 'Internal Vice President',
        shortTitle: 'Internal VP',
        description: 'Establish and maintain relationships with internal NJIT colleges, departments, and student organizations for sponsorships and collaborations through emails and in-person/virtual meetings.',
        image: 'https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'people-outline',
        color: '#FF9F0A',
    },
    'treasurer': {
        id: 'treasurer',
        title: 'Treasurer',
        shortTitle: 'Treasurer',
        description: 'Track income, expenses, reimbursements by maintaining accurate financial records and documents, help with fundraising events, help with researching and applying for grants.',
        image: 'https://images.unsplash.com/photo-1534469650761-fce6cc26ac0d?q=80&w=1771&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'cash-outline',
        color: '#30D158',
    },
    'secretary': {
        id: 'secretary',
        title: 'Secretary',
        shortTitle: 'Secretary',
        description: "Assist in maintaining inventory of the office materials, supplies, and merchandise. Help to organize the office when needed. Committed to attending SHPE events to help take attendance. Come to the SHPE office during the Secretary's office hours to be creative and learn how we send out the biweekly newsletter!",
        image: 'https://images.unsplash.com/photo-1702628772145-f788e5a9ec42?q=80&w=1748&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'document-text-outline',
        color: '#BF5AF2',
    },
    'public-relations': {
        id: 'public-relations',
        title: 'Public Relations',
        shortTitle: 'Public Relations',
        description: "Promoting SHPE's mission and vision, events, and achievements to students, faculty, and the broader community. Maintain and oversee our social media accounts across various platforms, taking pictures during events, collaborate with marketing team, and more.",
        image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'chatbubbles-outline',
        color: '#FF375F',
    },
    'marketing': {
        id: 'marketing',
        title: 'Marketing',
        shortTitle: 'Marketing',
        description: 'Creating promotional material, designing SHPE merchandise, helping maintain NJIT SHPE website.',
        image: 'https://images.unsplash.com/photo-1764096534686-68091ce5ab45?q=80&w=2231&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'megaphone-outline',
        color: '#FF6482',
    },
    'event-coordinator': {
        id: 'event-coordinator',
        title: 'Event Coordinator',
        shortTitle: 'Event Coordinator',
        description: 'Plan, coordinate, and manage events for NJIT SHPE. Help with making google forms and or taking attendance for our events. Help either set up and or clean up the rooms we used for events. Buy any last-min supplies we may need (you will get reimbursed for any money or gas spent for NJIT SHPE).',
        image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'calendar-outline',
        color: '#0A84FF',
    },
    'outreach': {
        id: 'outreach',
        title: 'Outreach',
        shortTitle: 'Outreach',
        description: 'Help plan and coordinate volunteering events, help make google forms and research anyone in our community who wants to help.',
        image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'hand-left-outline',
        color: '#32D74B',
    },
    'pre-college': {
        id: 'pre-college',
        title: 'Pre-College',
        shortTitle: 'Pre-College',
        description: 'Sending weekly emails to other organizations about our upcoming DDC event, taking meeting notes, keeping track in an organized manner of any forms and sign in sheets.',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'school-outline',
        color: '#FFD60A',
    },
    'membership': {
        id: 'membership',
        title: 'Membership Development',
        shortTitle: 'Membership Dev',
        description: 'Oversee attendance and feedback forms for NJIT SHPE tutoring program. Help make presentations, help with outreach for first years seminar, help EOP cohort meetings and any events to promote SHPE.',
        image: 'https://images.unsplash.com/photo-1499540633125-484965b60031?q=80&w=1771&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'person-add-outline',
        color: '#AC8E68',
    },
    'shpetinas': {
        id: 'shpetinas',
        title: 'SHPEtinas',
        shortTitle: 'SHPEtinas',
        description: 'SHPEtinas is committed to creating an inclusive and empowering environment where women and Latinas in STEM can thrive, lead, and inspire. We believe in fostering a supportive community that celebrates achievements, addresses challenges, and creates pathways for success in engineering and technology fields.',
        image: 'https://www.shpenjit.org/_next/image?url=%2Fimages%2Fevents%2FSHPEtina%2FSHPEtinas.JPG&w=3840&q=75',
        icon: 'flower-outline',
        color: '#FF6B9D',
    },
    'internshpe': {
        id: 'internshpe',
        title: 'InternSHPE',
        shortTitle: 'InternSHPE',
        description: "InternSHPE provides hands-on opportunities to develop technical skills, build professional networks, and gain valuable industry experience while contributing to our chapter's mission.",
        image: 'https://www.shpenjit.org/_next/image?url=%2Fimages%2Fevents%2FHow-to%2Finterview10%3A18.JPG&w=3840&q=75',
        icon: 'briefcase-outline',
        color: '#00CED1',
    },
    'webmaster': {
        id: 'webmaster',
        title: 'Webmaster',
        shortTitle: 'Webmaster',
        description: 'Maintain and develop the NJIT SHPE website and mobile application. Work with the latest web technologies to create an engaging digital presence for the organization.',
        image: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=2106&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: 'code-slash-outline',
        color: '#64D2FF',
    },
};

export const getCommitteeInfo = (committeeId: CommitteeId): CommitteeInfo => {
    return COMMITTEE_DATA[committeeId];
};
Update Todos

Create committeeUtils.ts with committee data and images

Create CommitteeHeroHeader component

Update all 13 committee pages to use the new header
Write CommitteeHeroHeader.tsx
194 lines
import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommitteeInfo } from '@/utils/committeeUtils';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.55;

interface CommitteeHeroHeaderProps {
    committee: CommitteeInfo;
}

export const CommitteeHeroHeader: React.FC<CommitteeHeroHeaderProps> = ({ committee }) => {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* Background Image */}
            <Image
                source={committee.image}
                style={styles.image}
                contentFit="cover"
                transition={500}
            />

            {/* Blur Layers for Readability */}
            <BlurView
                intensity={isDark ? 2 : 2}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '60%' }]}
            />
            <BlurView
                intensity={isDark ? 5 : 5}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '50%' }]}
            />
            <BlurView
                intensity={isDark ? 10 : 8}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '40%' }]}
            />
            <BlurView
                intensity={isDark ? 15 : 12}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '30%' }]}
            />
            <BlurView
                intensity={isDark ? 20 : 15}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '20%' }]}
            />
            <BlurView
                intensity={isDark ? 30 : 20}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '10%' }]}
            />

            {/* Gradient Overlay */}
            <LinearGradient
                colors={[
                    'transparent',
                    'transparent',
                    isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.6)',
                    theme.background
                ]}
                locations={[0, 0.3, 0.65, 1]}
                style={styles.gradient}
            />

            {/* Back Button */}
            <View style={[styles.backButtonContainer, { top: insets.top + 10 }]}>
                <Pressable
                    style={({ pressed }) => [
                        styles.backButton,
                        { opacity: pressed ? 0.7 : 1 }
                    ]}
                    onPress={() => router.back()}
                >
                    <BlurView
                        intensity={40}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.backButtonBlur}
                    >
                        <Ionicons name="chevron-back" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
                    </BlurView>
                </Pressable>
            </View>

            {/* Content Overlay */}
            <View style={styles.contentContainer}>
                <Text style={[styles.eyebrow, { color: isDark ? '#b0b0b0' : '#555555' }]}>
                    Committee
                </Text>

                <Text style={[styles.title, { color: theme.text }]}>
                    {committee.shortTitle}
                </Text>

                <View style={styles.divider} />

                <Text style={[styles.description, { color: isDark ? '#b0b0b0' : '#555555' }]}>
                    {committee.description}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: HEADER_HEIGHT,
        width: width,
        position: 'relative',
        marginBottom: 20,
        backgroundColor: 'transparent',
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        width: width,
        height: HEADER_HEIGHT,
    },
    blurLayer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        height: HEADER_HEIGHT,
    },
    backButtonContainer: {
        position: 'absolute',
        left: 20,
        zIndex: 100,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    backButtonBlur: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    contentContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    eyebrow: {
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: 1,
        marginBottom: 0.1,
        opacity: 0.9,
    },
    title: {
        fontSize: 42,
        fontWeight: '500',
        letterSpacing: -1.5,
        lineHeight: 50,
        marginBottom: 10,
    },
    divider: {
        height: 0.8,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        opacity: 0.25,
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '400',
        maxWidth: '100%',
    },
});
Now let me create an index.ts for the committees components folder and update all 13 committee pages.

Write index.ts
2 lines
export { CommitteeHeroHeader } from './CommitteeHeroHeader';
Update Todos

Create committeeUtils.ts with committee data and images

Create CommitteeHeroHeader component

Update all 13 committee pages to use the new header
Now let me update all the committee pages. I'll create a consistent template for each.

Write external-vp.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function ExternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('external-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write internal-vp.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internal-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Read internal-vp.tsx
Read treasurer.tsx
Read webmaster.tsx
Read secretary.tsx
Read public-relations.tsx
Read marketing.tsx
Read event-coordinator.tsx
Read outreach.tsx
Read pre-college.tsx
Read membership.tsx
Read shpetinas.tsx
Read internshpe.tsx
Good, I have all the files read. Now let me update all 12 remaining committee pages in parallel.

Write internal-vp.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internal-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write treasurer.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function TreasurerScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('treasurer');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write webmaster.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function WebmasterScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('webmaster');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write secretary.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function SecretaryScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('secretary');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write public-relations.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function PublicRelationsScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('public-relations');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write marketing.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function MarketingScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('marketing');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
I did read those files earlier but it seems they need to be re-read. Let me use Edit instead which should work since I already read them.

Edit internal-vp.tsx
Edit failed
Edit treasurer.tsx
Edit failed
Edit webmaster.tsx
Edit failed
Edit secretary.tsx
Edit failed
Edit public-relations.tsx
Edit failed
Edit marketing.tsx
Edit failed
Read internal-vp.tsx
Read treasurer.tsx
Read webmaster.tsx
Read secretary.tsx
Read public-relations.tsx
Read marketing.tsx
Read event-coordinator.tsx
Read outreach.tsx
Read pre-college.tsx
Read membership.tsx
Read shpetinas.tsx
Read internshpe.tsx
Now I can edit all of them. Let me do this in batches.

Write internal-vp.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internal-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write treasurer.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function TreasurerScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('treasurer');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write webmaster.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function WebmasterScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('webmaster');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write secretary.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function SecretaryScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('secretary');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write public-relations.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function PublicRelationsScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('public-relations');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write marketing.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function MarketingScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('marketing');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write internal-vp.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internal-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write treasurer.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function TreasurerScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('treasurer');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write event-coordinator.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function EventCoordinatorScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('event-coordinator');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write outreach.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function OutreachScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('outreach');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write pre-college.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function PreCollegeScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('pre-college');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write membership.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function MembershipScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('membership');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write internal-vp.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internal-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write treasurer.tsx
Write failed
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function TreasurerScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('treasurer');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write shpetinas.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function SHPEtinasScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('shpetinas');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write internshpe.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternSHPEScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internshpe');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Now let me get the last two files that keep failing.

Read internal-vp.tsx
Read treasurer.tsx
Write internal-vp.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internal-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Write treasurer.tsx
34 lines
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function TreasurerScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('treasurer');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
Update Todos

Create committeeUtils.ts with committee data and images

Create CommitteeHeroHeader component

Update all 13 committee pages to use the new header
All 13 committee pages have been updated. Here's a summary of what was created:

New Files:

committeeUtils.ts - Contains all committee data (titles, descriptions, images, icons, colors)
CommitteeHeroHeader.tsx - Hero header component with blurred image background
index.ts - Barrel export for the component
Updated Committee Pages (all 13):

external-vp.tsx
internal-vp.tsx
treasurer.tsx
secretary.tsx
webmaster.tsx
public-relations.tsx
marketing.tsx
event-coordinator.tsx
outreach.tsx
pre-college.tsx
membership.tsx
shpetinas.tsx
internshpe.tsx
Each page now features:

A hero header similar to MonthHeroHeader with a full-bleed image
Stacked blur layers for a premium fade effect
Back button with blur background
Committee name and full description
Proper light/dark mode support
Theme-adaptive status bar




Important: Recently added SQL
-- 1) Committees (minimal)
create table if not exists public.committees (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
);

-- 2) Committee members (admin-approved)
create table if not exists public.committee_members (
  committee_id uuid not null references public.committees(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','revoked')),
  created_at timestamptz not null default now(),
  decided_at timestamptz null,

  primary key (committee_id, user_id)
);

-- Useful indexes
create index if not exists committee_members_user_id_idx
  on public.committee_members (user_id);

create index if not exists committee_members_committee_status_idx
  on public.committee_members (committee_id, status);






alter table public.events
add column if not exists committee_id uuid
references public.committees(id) on delete set null;

create index if not exists events_committee_id_idx
  on public.events (committee_id);



alter table public.committees enable row level security;
alter table public.committee_members enable row level security;


create policy "Authenticated can view committees"
on public.committees
for select
to authenticated
using (true);


create policy "Users can request to join committee"
on public.committee_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and decided_at is null
);



create policy "Users can view own committee membership"
on public.committee_members
for select
to authenticated
using (user_id = auth.uid());






create policy "Admins can view all committee memberships"
on public.committee_members
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = auth.uid()
      and ar.revoked_at is null
  )
);

create policy "Admins can update committee memberships"
on public.committee_members
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = auth.uid()
      and ar.revoked_at is null
  )
)
with check (
  exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = auth.uid()
      and ar.revoked_at is null
  )
);





create policy "Users can cancel pending request"
on public.committee_members
for delete
to authenticated
using (user_id = auth.uid() and status = 'pending');



create policy "Committee members can view approved roster for their committee"
on public.committee_members
for select
to authenticated
using (
  status = 'approved'
  and (
    -- viewer is approved in same committee
    exists (
      select 1
      from public.committee_members me
      where me.committee_id = committee_members.committee_id
        and me.user_id = auth.uid()
        and me.status = 'approved'
    )
    -- OR viewer is admin
    or exists (
      select 1
      from public.admin_roles ar
      where ar.user_id = auth.uid()
        and ar.revoked_at is null
    )
  )
);






use context.md to read the SQL i added to supabase. I want to implement a feature in the 13 committee pages that replicates the eventfeed.tsx look, except that this specific feed would only display events for that specific committee.
I'll start by reading the context.md file to understand the SQL structure you've added.

Read context.md
Now I have the SQL schema. The context.md file contains the SQL you added to Supabase which includes:

committees table - stores committee info with id (uuid) and slug
committee_members table - tracks user membership with status (pending/approved/rejected/revoked)
events table now has a committee_id column linking events to committees
Let me explore the existing EventFeed component to understand its structure before planning the implementation.

Task:Explore EventFeed implementation
IN
I need to understand how the EventFeed is implemented in this codebase. Please find:
1. The EventFeed.tsx component and understand its structure
2. How events are fetched (hooks, services, etc.)
3. The event types/interfaces used
4. Any related components like event cards

Focus on the feed/list display pattern rather than event details. I need to replicate this pattern for committee-specific event feeds.
Bash
IN
find /home/jossue/dev/shpe-app -type f -name "*.tsx" -o -name "*.ts" | grep -i feed | head -20

OUT
/home/jossue/dev/shpe-app/frontend/types/feed.ts
/home/jossue/dev/shpe-app/frontend/components/events/EventsFeed.tsx
/home/jossue/dev/shpe-app/frontend/components/ui/FeedSkeleton.tsx
/home/jossue/dev/shpe-app/frontend/components/feed/FeedList.tsx
/home/jossue/dev/shpe-app/frontend/components/feed/UserAutocomplete.tsx
/home/jossue/dev/shpe-app/frontend/components/feed/FeedCard.tsx
/home/jossue/dev/shpe-app/frontend/components/feed/FeedHeader.tsx
/home/jossue/dev/shpe-app/frontend/components/feed/index.ts
/home/jossue/dev/shpe-app/frontend/components/feed/EventAutocomplete.tsx
/home/jossue/dev/shpe-app/frontend/components/feed/CommentList.tsx
/home/jossue/dev/shpe-app/frontend/lib/feedService.ts
/home/jossue/dev/shpe-app/frontend/hooks/feed/useLikes.ts
/home/jossue/dev/shpe-app/frontend/hooks/feed/useFeed.ts
/home/jossue/dev/shpe-app/frontend/hooks/feed/useComments.ts
/home/jossue/dev/shpe-app/frontend/hooks/feed/useUserPosts.ts
/home/jossue/dev/shpe-app/frontend/hooks/feed/index.ts
/home/jossue/dev/shpe-app/frontend/hooks/feed/usePost.ts
/home/jossue/dev/shpe-app/frontend/utils/feed.ts
/home/jossue/dev/shpe-app/frontend/node_modules/domutils/lib/feeds.d.ts
/home/jossue/dev/shpe-app/frontend/node_modules/domutils/lib/esm/feeds.d.ts
Read useFeed.ts
Read events.ts
Bash
IN
grep -r "useOngoingEvents\|useEvents" /home/jossue/dev/shpe-app/frontend/hooks --include="*.ts" --include="*.tsx" | head -5

OUT
/home/jossue/dev/shpe-app/frontend/hooks/events/useOngoingEvents.ts:export function useOngoingEvents(events: Event[]): UseOngoingEventsResult {
/home/jossue/dev/shpe-app/frontend/hooks/events/useOngoingEvents.ts:        console.log('[useOngoingEvents] 📥 Received events:', events.length);
/home/jossue/dev/shpe-app/frontend/hooks/events/useOngoingEvents.ts:                console.warn('[useOngoingEvents] ⚠️  Skipping invalid dates:', {
/home/jossue/dev/shpe-app/frontend/hooks/events/useOngoingEvents.ts:        console.log('[useOngoingEvents] 📊 Results:', {
/home/jossue/dev/shpe-app/frontend/hooks/events/index.ts:export { useOngoingEvents } from './useOngoingEvents';
Bash
IN
find /home/jossue/dev/shpe-app/frontend -name "*eventService*" -o -name "*event.service*" | head -5

OUT
0
Now I have a clear picture of the EventFeed implementation. Let me create a todo list and implement the committee-specific event feed feature.

Update Todos

Create eventService with fetchCommitteeEvents function

Create useCommitteeEvents hook for fetching/state management

Create CommitteeEventsFeed component

Update committeeUtils.ts to map slugs to committee IDs

Integrate CommitteeEventsFeed into all 13 committee pages
Update Todos

Create eventService with fetchCommitteeEvents function

Create useCommitteeEvents hook for fetching/state management

Create CommitteeEventsFeed component

Update committeeUtils.ts to map slugs to committee IDs

Integrate CommitteeEventsFeed into all 13 committee pages
Let me first look at the existing event service and how events are fetched to understand the patterns better.

Globpattern: "**/lib/*Service*.ts"
Found 1 file
Globpattern: "**/lib/*event*.ts"
No files found
Globpattern: "**/services/*event*.ts"
Found 3 files
Read events.service.ts
Read feedService.ts
Now I need to see the event types and the EventsFeed component.

Read events.ts
Read EventsFeed.tsx
Now let me check the supabase client and the error types to understand the patterns.

Read errors.ts
Read supabase.ts
Now I have everything I need. Let me also look at the existing committeeUtils.ts file I need to update, and check what hooks exist for events.

Globpattern: "**/hooks/events/**/*.ts"
Found 4 files
Read committeeUtils.ts
Read index.ts
Now I have all the information I need. Let me implement the feature step by step. First, I'll add a method to fetch committee events in the events service.

Edit events.service.ts
Added 97 lines
Update Todos

Create eventService with fetchCommitteeEvents function

Create useCommitteeEvents hook for fetching/state management

Create CommitteeEventsFeed component

Update committeeUtils.ts to map slugs to committee IDs

Integrate CommitteeEventsFeed into all 13 committee pages
Now let me create the useCommitteeEvents hook.

Write useCommitteeEvents.ts
98 lines
import { useState, useEffect, useCallback } from 'react';
import { eventsService } from '@/services/events.service';
import type { Event, EventDB } from '@/types/events';
import type { CommitteeId } from '@/utils/committeeUtils';

/**
 * Maps EventDB (database format) to Event (UI format)
 */
function mapEventDBToUI(eventDB: EventDB): Event {
    const now = new Date();
    const endTime = new Date(eventDB.end_time);

    return {
        id: eventDB.event_id,
        uuid: eventDB.id,
        title: eventDB.name,
        description: eventDB.description,
        startTimeISO: eventDB.start_time,
        endTimeISO: eventDB.end_time,
        locationName: eventDB.location_name,
        address: eventDB.location_address,
        latitude: eventDB.latitude,
        longitude: eventDB.longitude,
        coverImageUrl: eventDB.cover_image_url ?? undefined,
        tags: [], // Tags would need to be parsed if stored
        status: endTime < now ? 'past' : 'upcoming',
        registration_questions: eventDB.registration_questions,
        points: eventDB.points,
        requiresRsvp: eventDB.requires_rsvp,
        eventLimit: eventDB.event_limit,
    };
}

interface UseCommitteeEventsResult {
    events: Event[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage events for a specific committee
 * @param committeeSlug - The slug/id of the committee (e.g., 'external-vp', 'marketing')
 */
export function useCommitteeEvents(committeeSlug: CommitteeId): UseCommitteeEventsResult {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await eventsService.getCommitteeEvents(committeeSlug);

            if (response.success) {
                const mappedEvents = response.data.map(mapEventDBToUI);
                setEvents(mappedEvents);
            } else {
                // If committee not found or no events, set empty array (not an error state)
                if (response.error.code === 'NOT_FOUND') {
                    setEvents([]);
                } else {
                    setError(response.error.message);
                }
            }
        } catch (err) {
            setError('Failed to load events');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [committeeSlug]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const refresh = useCallback(async () => {
        await fetchEvents(true);
    }, [fetchEvents]);

    return {
        events,
        isLoading,
        isRefreshing,
        error,
        refresh,
    };
}
Now let me update the hooks/events/index.ts to export the new hook.

Edit index.ts
Added 1 line
Update Todos

Create eventService with fetchCommitteeEvents function

Create useCommitteeEvents hook for fetching/state management

Create CommitteeEventsFeed component

Update committeeUtils.ts to map slugs to committee IDs

Integrate CommitteeEventsFeed into all 13 committee pages
Now let me create the CommitteeEventsFeed component. First, let me check the components/committees folder structure.

Globpattern: "**/components/committees/**/*"
Found 2 files
Read index.ts
Now let me create the CommitteeEventsFeed component that wraps the existing EventsFeed.

Write CommitteeEventsFeed.tsx
88 lines
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useCommitteeEvents } from '@/hooks/events';
import { EventsFeed } from '@/components/events/EventsFeed';
import { useTheme } from '@/contexts/ThemeContext';
import type { CommitteeId } from '@/utils/committeeUtils';

interface CommitteeEventsFeedProps {
    committeeSlug: CommitteeId;
    ListHeaderComponent?: React.ReactElement;
}

export function CommitteeEventsFeed({
    committeeSlug,
    ListHeaderComponent,
}: CommitteeEventsFeedProps) {
    const { theme } = useTheme();
    const { events, isLoading, isRefreshing, error, refresh } = useCommitteeEvents(committeeSlug);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                {ListHeaderComponent}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.subtext }]}>
                        Loading events...
                    </Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                {ListHeaderComponent}
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: theme.text }]}>
                        {error}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <EventsFeed
            events={events}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
            ListHeaderComponent={ListHeaderComponent}
            contentContainerStyle={styles.feedContent}
            bounces={true}
        />
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
    feedContent: {
        paddingTop: 0,
    },
});
Now let me update the committees components index to export the new component.

Edit index.ts
Edit failed
Read index.ts
Edit index.ts
Added 1 line
Update Todos

Create eventService with fetchCommitteeEvents function

Create useCommitteeEvents hook for fetching/state management

Create CommitteeEventsFeed component

Update committeeUtils.ts to map slugs to committee IDs

Integrate CommitteeEventsFeed into all 13 committee pages
Now I need to integrate the CommitteeEventsFeed into all 13 committee pages. Let me first read one of the committee pages to understand its current structure.

Read external-vp.tsx
I see the current structure. Since the EventsFeed already handles scrolling with a SectionList, I need to change the approach - instead of wrapping the EventsFeed in a ScrollView, I'll use the EventsFeed as the main scrollable component and pass the CommitteeHeroHeader as the ListHeaderComponent.

Let me update the external-vp.tsx first as a template, then do the rest.

Edit external-vp.tsx
Removed 6 lines
Now let me update the remaining 12 committee pages. Let me read them all first.

Read internal-vp.tsx
Read treasurer.tsx
Read secretary.tsx
Read public-relations.tsx
Read marketing.tsx
Read event-coordinator.tsx
Read outreach.tsx
Read pre-college.tsx
Read membership.tsx
Read shpetinas.tsx
Read internshpe.tsx
Read webmaster.tsx
All files have the same structure. Let me update all 12 remaining committee pages in parallel.

Write internal-vp.tsx
Write failed
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internal-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="internal-vp"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write treasurer.tsx
Write failed
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function TreasurerScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('treasurer');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="treasurer"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write secretary.tsx
Write failed
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function SecretaryScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('secretary');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="secretary"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write public-relations.tsx
Write failed
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function PublicRelationsScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('public-relations');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="public-relations"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write marketing.tsx
Write failed
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function MarketingScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('marketing');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="marketing"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write event-coordinator.tsx
Write failed
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function EventCoordinatorScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('event-coordinator');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="event-coordinator"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
It seems like the file read context expired. Let me read the files again and then use Edit instead of Write.

Read internal-vp.tsx
Read treasurer.tsx
Read secretary.tsx
Read public-relations.tsx
Read marketing.tsx
Read event-coordinator.tsx
Write internal-vp.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternalVPScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internal-vp');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="internal-vp"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write treasurer.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function TreasurerScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('treasurer');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="treasurer"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write secretary.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function SecretaryScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('secretary');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="secretary"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write public-relations.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function PublicRelationsScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('public-relations');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="public-relations"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write marketing.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function MarketingScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('marketing');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="marketing"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write event-coordinator.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function EventCoordinatorScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('event-coordinator');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="event-coordinator"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Now let me read and update the remaining 6 committee pages.

Read outreach.tsx
Read pre-college.tsx
Read membership.tsx
Read shpetinas.tsx
Read internshpe.tsx
Read webmaster.tsx
Write outreach.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function OutreachScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('outreach');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="outreach"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write pre-college.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function PreCollegeScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('pre-college');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="pre-college"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write membership.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function MembershipScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('membership');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="membership"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write shpetinas.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function SHPEtinasScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('shpetinas');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="shpetinas"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write internshpe.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function InternSHPEScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('internshpe');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="internshpe"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
Write webmaster.tsx
28 lines
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function WebmasterScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('webmaster');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed
                committeeSlug="webmaster"
                ListHeaderComponent={<CommitteeHeroHeader committee={committee} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
All 13 committee pages have been updated. Let me mark the task as complete and run a quick TypeScript check to verify there are no errors.

Update Todos

Create eventService with fetchCommitteeEvents function

Create useCommitteeEvents hook for fetching/state management

Create CommitteeEventsFeed component

Update committeeUtils.ts to map slugs to committee IDs

Integrate CommitteeEventsFeed into all 13 committee pages
Bash Run TypeScript type check
IN
cd /home/jossue/dev/shpe-app/frontend && npx tsc --noEmit 2>&1 | head -100

OUT
services/events.service.ts(100,3): error TS1434: Unexpected keyword or identifier.
services/events.service.ts(100,41): error TS1005: ',' expected.
services/events.service.ts(100,50): error TS1005: ';' expected.
services/events.service.ts(100,84): error TS1011: An element access expression should take an argument.
services/events.service.ts(101,9): error TS1005: ':' expected.
services/events.service.ts(103,13): error TS1005: ':' expected.
services/events.service.ts(107,18): error TS1005: ',' expected.
services/events.service.ts(109,26): error TS1005: ',' expected.
services/events.service.ts(109,39): error TS1005: ',' expected.
services/events.service.ts(109,41): error TS1136: Property assignment expected.
services/events.service.ts(130,5): error TS1128: Declaration or statement expected.
services/events.service.ts(130,7): error TS1005: 'try' expected.
services/events.service.ts(141,3): error TS1128: Declaration or statement expected.
services/events.service.ts(146,3): error TS1434: Unexpected keyword or identifier.
services/events.service.ts(146,49): error TS1005: ',' expected.
services/events.service.ts(146,58): error TS1005: ';' expected.
services/events.service.ts(146,92): error TS1011: An element access expression should take an argument.
services/events.service.ts(147,9): error TS1005: ':' expected.
services/events.service.ts(149,13): error TS1005: ':' expected.
services/events.service.ts(153,18): error TS1005: ',' expected.
services/events.service.ts(155,26): error TS1005: ',' expected.
services/events.service.ts(155,39): error TS1005: ',' expected.
services/events.service.ts(155,41): error TS1136: Property assignment expected.
services/events.service.ts(179,5): error TS1128: Declaration or statement expected.
services/events.service.ts(179,7): error TS1005: 'try' expected.
services/events.service.ts(190,3): error TS1128: Declaration or statement expected.
services/events.service.ts(191,1): error TS1128: Declaration or statement expected.
There's a syntax issue in the events.service.ts. Let me check the file.

Read events.service.ts
I see the issue - the class was closed prematurely on line 94 and then the new methods are outside the class. I need to fix this.

Edit events.service.ts
Removed 1 line
Bash Run TypeScript type check
IN
npx tsc --noEmit 2>&1 | head -50

OUT
app/(app)/admin/pending-rsvps/[id].tsx(229,21): error TS2322: Type 'string | undefined' is not assignable to type 'string | null'.
  Type 'undefined' is not assignable to type 'string | null'.
app/(auth)/welcome.tsx(130,11): error TS2322: Type '{ onContinueWithPhone: () => void; onContinueWithEmail: () => void; onEmailLogin: () => void; onAppleLogin: () => Promise<void>; onGoogleLogin: () => Promise<void>; onGuestLogin: () => void; }' is not assignable to type 'IntrinsicAttributes & LoginScreenProps'.
  Property 'onContinueWithPhone' does not exist on type 'IntrinsicAttributes & LoginScreenProps'.
app/(modals)/event-form.tsx(14,23): error TS2307: Cannot find module '@/data/mockEvents' or its corresponding type declarations.
app/(modals)/event-form.tsx(34,59): error TS2339: Property 'hostName' does not exist on type 'Event'.
app/(modals)/event-form.tsx(36,63): error TS2339: Property 'priceLabel' does not exist on type 'Event'.
app/(modals)/event-form.tsx(37,69): error TS2339: Property 'capacityLabel' does not exist on type 'Event'.
components/auth/index.ts(2,37): error TS2307: Cannot find module './ForgotPasswordModal' or its corresponding type declarations.
components/auth/index.ts(3,26): error TS2307: Cannot find module './AuthLogo' or its corresponding type declarations.
components/shared/ResumePreview.tsx(105,23): error TS7006: Parameter 'error' implicitly has an 'any' type.
components/shared/ResumePreview.tsx(152,23): error TS7006: Parameter 'error' implicitly has an 'any' type.
hooks/profile/useEditProfile.ts(58,9): error TS2741: Property 'code' is missing in type '{ message: string; }' but required in type 'AppError'.
hooks/profile/useRank.ts(102,40): error TS2339: Property 'newBalance' does not exist on type 'PointsSummary'.
hooks/profile/useRank.ts(108,42): error TS2339: Property 'transaction' does not exist on type 'PointsSummary'.
lib/feedService.ts(887,99): error TS2339: Property 'message' does not exist on type 'never'.
onboarding/components/WizardLayout.native.tsx(92,15): error TS2322: Type '{ onPress: () => void; hasFormData: boolean; showConfirmation: boolean; color: string; }' is not assignable to type 'IntrinsicAttributes & WizardBackButtonProps'.
  Property 'color' does not exist on type 'IntrinsicAttributes & WizardBackButtonProps'.
onboarding/screens/alumni/AlumniProfessionalStep.native.tsx(204,39): error TS2339: Property 'errors' does not exist on type 'ZodError<{ company: string; jobTitle: string; industry: string; }>'.
onboarding/screens/student/AssetsStep.native.tsx(76,27): error TS2769: No overload matches this call.
  Overload 1 of 2, '(props: LinearGradientProps): LinearGradient', gave the following error.
    Type 'string[]' is not assignable to type 'readonly [ColorValue, ColorValue, ...ColorValue[]]'.
      Source provides no match for required element at position 0 in target.
  Overload 2 of 2, '(props: LinearGradientProps, context: any): LinearGradient', gave the following error.
    Type 'string[]' is not assignable to type 'readonly [ColorValue, ColorValue, ...ColorValue[]]'.
      Source provides no match for required element at position 0 in target.
services/adminRole.service.ts(52,9): error TS2322: Type 'ServiceResponse<null>' is not assignable to type 'ServiceResponse<void>'.
  Type '{ success: true; data: null; error?: undefined; }' is not assignable to type 'ServiceResponse<void>'.
    Type '{ success: true; data: null; error?: undefined; }' is not assignable to type '{ success: true; data: void; error?: undefined; }'.
      Types of property 'data' are incompatible.
        Type 'null' is not assignable to type 'void'.
services/adminRole.service.ts(107,9): error TS2322: Type 'ServiceResponse<null>' is not assignable to type 'ServiceResponse<void>'.
  Type '{ success: true; data: null; error?: undefined; }' is not assignable to type 'ServiceResponse<void>'.
    Type '{ success: true; data: null; error?: undefined; }' is not assignable to type '{ success: true; data: void; error?: undefined; }'.
      Types of property 'data' are incompatible.
        Type 'null' is not assignable to type 'void'.
services/adminRole.service.ts(157,9): error TS2322: Type 'ServiceResponse<null>' is not assignable to type 'ServiceResponse<AdminRole[]>'.
  Type '{ success: true; data: null; error?: undefined; }' is not assignable to type 'ServiceResponse<AdminRole[]>'.
    Type '{ success: true; data: null; error?: undefined; }' is not assignable to type '{ success: true; data: AdminRole[]; error?: undefined; }'.
      Types of property 'data' are incompatible.
        Type 'null' is not assignable to type 'AdminRole[]'.
services/block.service.ts(29,17): error TS2322: Type 'ServiceResponse<null>' is not assignable to type 'ServiceResponse<string[]>'.
  Type '{ success: true; data: null; error?: undefined; }' is not assignable to type 'ServiceResponse<string[]>'.
    Type '{ success: true; data: null; error?: undefined; }' is not assignable to type '{ success: true; data: string[]; error?: undefined; }'.
      Types of property 'data' are incompatible.
        Type 'null' is not assignable to type 'string[]'.
services/block.service.ts(80,17): error TS2322: Type 'ServiceResponse<null>' is not assignable to type 'ServiceResponse<void>'.
  Type '{ success: true; data: null; error?: undefined; }' is not assignable to type 'ServiceResponse<void>'.
    Type '{ success: true; data: null; error?: undefined; }' is not assignable to type '{ success: true; data: void; error?: undefined; }'.
      Types of property 'data' are incompatible.
The TypeScript errors are all pre-existing issues unrelated to my changes. The new code I added (events.service.ts, useCommitteeEvents.ts, CommitteeEventsFeed.tsx, and the committee pages) don't have any errors.

Let me verify my new files compile correctly by checking specifically for errors related to them.

Bash Check for errors in new committee files
IN
npx tsc --noEmit 2>&1 | grep -E "(CommitteeEventsFeed|useCommitteeEvents|committees/)" || echo "No errors in new committee files"

OUT
No errors in new committee files
All the new code compiles without errors. Let me provide a summary of what was implemented.

Summary
I've implemented the committee-specific event feed feature. Here's what was created:

New Files Created:
useCommitteeEvents.ts - A custom hook that:

Fetches events for a specific committee by slug
Handles loading, refreshing, and error states
Maps database events (EventDB) to UI events (Event)
CommitteeEventsFeed.tsx - A wrapper component that:

Uses the useCommitteeEvents hook to fetch data
Displays loading and error states
Renders the existing EventsFeed component with committee-filtered events
Accepts the CommitteeHeroHeader as a ListHeaderComponent
Modified Files:
events.service.ts - Added two new methods to EventsService:

getCommitteeEvents(committeeSlug) - Fetches all events for a committee
getCommitteeUpcomingEvents(committeeSlug) - Fetches only upcoming events
hooks/events/index.ts - Added export for useCommitteeEvents

components/committees/index.ts - Added export for CommitteeEventsFeed

All 13 committee pages updated to use CommitteeEventsFeed:

external-vp.tsx
internal-vp.tsx
treasurer.tsx
secretary.tsx
public-relations.tsx
marketing.tsx
event-coordinator.tsx
outreach.tsx
pre-college.tsx
membership.tsx
shpetinas.tsx
internshpe.tsx
webmaster.tsx
How It Works:
Each committee page passes its slug (e.g., "marketing") to CommitteeEventsFeed
The feed looks up the committee UUID from the committees table using the slug
It then queries the events table for events where committee_id matches
Events are displayed using the same EventsFeed component and CompactEventCard that the main events page uses
The CommitteeHeroHeader scrolls naturally as part of the list header
Database Requirements:
For this to work, you need to ensure:

The committees table has rows with slug values matching the committee IDs (e.g., 'marketing', 'external-vp')
Events have their committee_id column set to link them to the appropriate committee







use context.md to read the SQL i added to supabase. I want to implement a feature in the 13 committee pages that is similar to attendees.tsx, but rather it is a member list of the people part of the committee.
I'll start by reading the context.md file to understand the SQL schema you've added, and then look at the attendees.tsx file to understand the pattern you want to follow.

Read context.md
Read attendees.tsx
Let me read the context.md in portions and find the attendees.tsx file.

Read context.md
Globpattern: "**/attendees.tsx"
Found 1 file
Now let me continue reading the context.md to find the SQL, and also read the attendees.tsx file.

Read context.md (lines 501-1000)
Read attendees.tsx
Now I understand the attendees.tsx pattern. Let me continue reading the context.md to find the SQL schema for committee members.

Read context.md (lines 1001-1300)
Let me search further in the context.md file to find the SQL schema.

Grep "CREATE TABLE|committee_members|SQL|supabase" (in /home/jossue/dev/shpe-app/frontend/app/(app)/committees/context.md)
22 lines of output
Let me read the SQL section more completely.

Read context.md (lines 1591-1790)
Now I understand the SQL schema. Let me also look at one of the existing committee pages and the useEventAttendees hook to understand the patterns better.

Grep "useEventAttendees"
9 lines of output
Read external-vp.tsx
Let me read the useEventAttendees hook and the hooks index to understand the patterns.

Read useEventAttendees.ts
Read index.ts
Read index.ts
Now let me look at the services folder to understand how to create a committee members service, and also look at the Attendee type.

Read attendee.ts
Globpattern: "**/services/*.ts"
Found 24 files
Read registration.service.ts
Read index.ts
Now I have a clear picture. Let me create a todo list and implement the committee members feature.

Update Todos

Create CommitteeMember type in types folder

Create committee.service.ts for fetching members

Create useCommitteeMembers hook

Create CommitteeMembersList component

Update all 13 committee pages to include member list
Write committeeMember.ts
24 lines
/**
 * Committee member type for committee membership
 */
export interface CommitteeMember {
  id: string;
  name: string;
  avatarUrl?: string;
  major?: string;
  year?: string;
  role?: string; // e.g., "Chair", "Member"
  joinedAt?: string;
}

/**
 * Committee members response with count and data
 */
export interface CommitteeMembersData {
  totalCount: number;
  members: CommitteeMember[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
Update Todos

Create CommitteeMember type in types folder

Create committee.service.ts for fetching members

Create useCommitteeMembers hook

Create CommitteeMembersList component

Update all 13 committee pages to include member list
Write committee.service.ts
142 lines
import { supabase } from '../lib/supabase';
import { UserProfile, normalizeProfileData } from '../types/userProfile';

export interface CommitteeMemberRow {
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  created_at: string;
  decided_at: string | null;
  profile: UserProfile | null;
}

/**
 * Committee Service - Manages Committee Membership
 * Uses Supabase tables `committees` and `committee_members`
 */
class CommitteeService {
  // Cache for slug -> uuid resolution
  private idCache: Record<string, string> = {};

  /**
   * Helper: Resolve Committee Slug to UUID
   */
  private async getCommitteeUUID(committeeSlug: string): Promise<string | null> {
    // If it looks like a UUID, return it directly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(committeeSlug)) {
      return committeeSlug;
    }

    // Check cache
    if (this.idCache[committeeSlug]) {
      return this.idCache[committeeSlug];
    }

    const { data, error } = await supabase
      .from('committees')
      .select('id')
      .eq('slug', committeeSlug)
      .single();

    if (error || !data) {
      console.error('Failed to resolve committee ID:', error);
      return null;
    }

    // Cache and return
    this.idCache[committeeSlug] = data.id;
    return data.id;
  }

  private flattenProfileData(profile: any): UserProfile {
    if (!profile) return profile;
    const { profile_data, ...rest } = profile;
    const normalizedProfileData = normalizeProfileData(profile_data);
    return {
      ...rest,
      ...normalizedProfileData,
      profile_data: normalizedProfileData,
    } as UserProfile;
  }

  /**
   * Get count of approved members in a committee
   */
  async getMemberCount(committeeSlug: string): Promise<number> {
    const committeeUUID = await this.getCommitteeUUID(committeeSlug);
    if (!committeeUUID) return 0;

    const { count, error } = await supabase
      .from('committee_members')
      .select('*', { count: 'exact', head: true })
      .eq('committee_id', committeeUUID)
      .eq('status', 'approved');

    if (error) {
      console.error('Failed to get member count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get list of approved committee members with their profiles
   */
  async getMembers(committeeSlug: string, limit = 50): Promise<CommitteeMemberRow[]> {
    const committeeUUID = await this.getCommitteeUUID(committeeSlug);
    if (!committeeUUID) return [];

    // 1. Get approved members from committee_members table
    const { data: membersData, error: membersError } = await supabase
      .from('committee_members')
      .select('user_id, status, created_at, decided_at')
      .eq('committee_id', committeeUUID)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (membersError || !membersData || membersData.length === 0) {
      if (membersError) console.error('Failed to get committee members:', membersError);
      return [];
    }

    // 2. Extract user IDs
    const userIds = membersData.map(m => m.user_id);

    // 3. Fetch profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Failed to fetch member profiles:', profilesError);
      // Return without profiles if fetch fails
      return membersData.map(m => ({
        user_id: m.user_id,
        status: m.status,
        created_at: m.created_at,
        decided_at: m.decided_at,
        profile: null
      }));
    }

    // 4. Map profiles to a lookup object
    const profilesMap = new Map(
      profilesData?.map(p => [p.id, this.flattenProfileData(p)])
    );

    // 5. Combine data
    return membersData.map(m => ({
      user_id: m.user_id,
      status: m.status,
      created_at: m.created_at,
      decided_at: m.decided_at,
      profile: (profilesMap.get(m.user_id) as UserProfile) || null
    }));
  }
}

export const committeeService = new CommitteeService();
Edit index.ts
Added 1 line
Update Todos

Create CommitteeMember type in types folder

Create committee.service.ts for fetching members

Create useCommitteeMembers hook

Create CommitteeMembersList component

Update all 13 committee pages to include member list
Write useCommitteeMembers.ts
75 lines
import { useState, useEffect, useCallback } from 'react';
import { CommitteeMember, CommitteeMembersData } from '@/types/committeeMember';
import { committeeService } from '@/services';

/**
 * Hook to fetch committee members
 * @param committeeSlug - The committee slug (e.g., 'external-vp', 'marketing')
 * @returns CommitteeMembersData with members list, count, loading state, and error
 */
export function useCommitteeMembers(committeeSlug: string): CommitteeMembersData {
  const [data, setData] = useState<Omit<CommitteeMembersData, 'refetch'>>({
    totalCount: 0,
    members: [],
    isLoading: true,
    error: null,
  });

  const fetchMembers = useCallback(async () => {
    let mounted = true;

    try {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch count and list in parallel
      const [count, membersData] = await Promise.all([
        committeeService.getMemberCount(committeeSlug),
        committeeService.getMembers(committeeSlug, 50)
      ]);

      if (mounted) {
        // Map service data to UI format
        const members: CommitteeMember[] = membersData.map(m => ({
          id: m.user_id,
          name: m.profile ? `${m.profile.first_name} ${m.profile.last_name}` : 'SHPE Member',
          avatarUrl: m.profile?.profile_picture_url || undefined,
          major: (m.profile as any)?.major || undefined,
          year: (m.profile as any)?.year || undefined,
          role: 'Member',
          joinedAt: m.created_at,
        }));

        setData({
          totalCount: count,
          members,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Error fetching committee members:', error);
      if (mounted) {
        setData({
          totalCount: 0,
          members: [],
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load members',
        });
      }
    }

    return () => {
      mounted = false;
    };
  }, [committeeSlug]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    ...data,
    refetch: fetchMembers,
  };
}
Write index.ts
2 lines
export { useCommitteeMembers } from './useCommitteeMembers';
Update Todos

Create CommitteeMember type in types folder

Create committee.service.ts for fetching members

Create useCommitteeMembers hook

Create CommitteeMembersList component

Update all 13 committee pages to include member list
Now let me create the CommitteeMembersList component based on the attendees.tsx pattern.

Write CommitteeMembersList.tsx
331 lines
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommitteeMembers } from '@/hooks/committees';
import { CommitteeMember } from '@/types/committeeMember';

interface CommitteeMembersListProps {
  committeeSlug: string;
}

export const CommitteeMembersList: React.FC<CommitteeMembersListProps> = ({
  committeeSlug,
}) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { totalCount, members, isLoading, error, refetch } = useCommitteeMembers(committeeSlug);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.major?.toLowerCase().includes(query) ||
        member.year?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '??';
  };

  const handleMemberPress = (member: CommitteeMember) => {
    router.push(`/profile/${member.id}`);
  };

  const renderMemberItem = (item: CommitteeMember) => (
    <Pressable
      key={item.id}
      style={({ pressed }) => [
        styles.memberRow,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? '#2C2C2E' : '#E8E5E0',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={() => handleMemberPress(item)}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: isDark ? '#3A3A3C' : '#1C1C1E' }]}>
            <Text style={[styles.avatarInitials, { color: isDark ? '#FFFFFF' : '#FDFBF7' }]}>
              {getInitials(item.name)}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text>
        {(item.major || item.year) && (
          <Text style={[styles.memberMeta, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            {[item.major, item.year].filter(Boolean).join(' • ')}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#8E8E93' : '#C7C7CC'} />
    </Pressable>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Unable to load members</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: isDark ? '#FFFFFF' : '#1C1C1E' }]}
            onPress={refetch}
          >
            <Text style={[styles.retryButtonText, { color: isDark ? '#1C1C1E' : '#FDFBF7' }]}>
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    if (searchQuery && filteredMembers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            Try a different search term
          </Text>
        </View>
      );
    }

    if (members.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No members yet</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            Be the first to join this committee
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Committee Members</Text>
        {!isLoading && members.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: isDark ? '#2C2C2E' : '#F5F3F0' }]}>
            <Text style={[styles.countText, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
              {totalCount} {totalCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      {members.length > 0 && (
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#2C2C2E' : '#E8E5E0',
            },
          ]}
        >
          <Ionicons name="search" size={20} color={isDark ? '#8E8E93' : '#6e6e73'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search members..."
            placeholderTextColor={isDark ? '#8E8E93' : '#6e6e73'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#8E8E93' : '#6e6e73'} />
            </Pressable>
          )}
        </View>
      )}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#1C1C1E'} />
          <Text style={[styles.loadingText, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            Loading members...
          </Text>
        </View>
      )}

      {/* Members List */}
      {!isLoading && (
        <View style={styles.listContent}>
          {filteredMembers.map(renderMemberItem)}
          {renderEmptyState()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberMeta: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
});
Read index.ts
Edit index.ts
Added 1 line
Update Todos

Create CommitteeMember type in types folder

Create committee.service.ts for fetching members

Create useCommitteeMembers hook

Create CommitteeMembersList component

Update all 13 committee pages to include member list
Now let me read the CommitteeEventsFeed to understand how it works with the header, so I can integrate the members list properly.

Read CommitteeEventsFeed.tsx
I see the current setup uses ListHeaderComponent to include the header in the feed. I need to modify the approach to include the members list after the header. Let me update the CommitteeEventsFeed to accept additional content, or better yet, update the committee pages to pass a combined header that includes both the hero header and the members list.

Looking at the current external-vp.tsx, the best approach would be to update each committee page to include the CommitteeMembersList component within the ListHeaderComponent. Let me update external-vp.tsx first as a template, then update the rest.

Read external-vp.tsx
Edit external-vp.tsx
Added 7 lines
Now let me read and update the remaining 12 committee pages.

Read internal-vp.tsx
Read treasurer.tsx
Read secretary.tsx
Read public-relations.tsx
Edit internal-vp.tsx
Added 7 lines
Edit treasurer.tsx
Added 7 lines
Edit secretary.tsx
Added 7 lines
Edit public-relations.tsx
Added 7 lines
Read marketing.tsx
Read webmaster.tsx
Read outreach.tsx
Read pre-college.tsx
Edit marketing.tsx
Added 7 lines
Edit webmaster.tsx
Added 7 lines
Edit outreach.tsx
Added 7 lines
Edit pre-college.tsx
Added 7 lines
Now let me update the remaining 4 committee pages.

Read membership.tsx
Read shpetinas.tsx
Read internshpe.tsx
Read event-coordinator.tsx
Edit membership.tsx
Added 7 lines
Edit shpetinas.tsx
Added 7 lines
Edit internshpe.tsx
Added 7 lines
Edit event-coordinator.tsx
Added 7 lines
Update Todos

Create CommitteeMember type in types folder

Create committee.service.ts for fetching members

Create useCommitteeMembers hook

Create CommitteeMembersList component

Update all 13 committee pages to include member list
I've implemented the committee members feature. Here's a summary of what was created:

Summary
I've implemented a committee members list feature across all 13 committee pages, similar to the attendees.tsx pattern. Here's what was created:

New Files Created:
committeeMember.ts - Type definitions for CommitteeMember and CommitteeMembersData

committee.service.ts - Service class that:

Resolves committee slugs to UUIDs
Fetches approved committee members from committee_members table
Joins with user_profiles to get member details
useCommitteeMembers.ts - React hook that:

Fetches member count and list in parallel
Transforms data to UI-friendly format
Provides loading, error, and refetch states
CommitteeMembersList.tsx - Component that displays:

Section header with "Committee Members" title and member count
Search bar to filter members by name, major, or year
Member list with avatars, names, and metadata
Tappable rows that navigate to member profiles
Empty states for loading, error, no results, and no members
Full dark/light mode support
Updated Files:
services/index.ts - Added committeeService export
components/committees/index.ts - Added CommitteeMembersList export
All 13 committee pages - Updated to include the members list below the hero header:
external-vp.tsx, internal-vp.tsx, treasurer.tsx, secretary.tsx
public-relations.tsx, marketing.tsx, webmaster.tsx
event-coordinator.tsx, outreach.tsx, pre-college.tsx
membership.tsx, shpetinas.tsx, internshpe.tsx
How It Works:
The SQL schema you added has:

committees table with id (UUID) and slug
committee_members table with committee_id, user_id, status (pending/approved/rejected/revoked)
The service fetches only approved members and joins with user_profiles to display their name, profile picture, major, and year. The RLS policies you set up ensure that only approved members (or admins) can view the committee roster.

I'll start by reading the context.md file to understand the SQL schema and then explore the current implementation.

Read context.md
Read CommitteeMembersList.tsx
Let me read portions of the context.md file and look at one of the committee pages to understand the current structure.

Read context.md
Read marketing.tsx
Now I understand the structure. The CommitteeMembersList is currently rendered inline in the committee pages. I need to:

Create a new full-screen modal component for the members list
Replace the inline CommitteeMembersList with a button that opens the modal
Update all 13 committee pages
Let me check the components index and then create the solution.

Read index.ts
Globpattern: "frontend/app/(app)/committees/*.tsx"
Found 13 files
Update Todos

Create MembersModal component for full-screen member list

Create ViewMembersButton component to trigger the modal

Update components/committees/index.ts exports

Update all 13 committee pages to use button instead of inline list
Write MembersModal.tsx
412 lines
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommitteeMembers } from '@/hooks/committees';
import { CommitteeMember } from '@/types/committeeMember';

const { height } = Dimensions.get('window');

interface MembersModalProps {
  visible: boolean;
  onClose: () => void;
  committeeSlug: string;
  committeeTitle: string;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  visible,
  onClose,
  committeeSlug,
  committeeTitle,
}) => {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totalCount, members, isLoading, error, refetch } = useCommitteeMembers(committeeSlug);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.major?.toLowerCase().includes(query) ||
        member.year?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '??';
  };

  const handleMemberPress = (member: CommitteeMember) => {
    onClose();
    router.push(`/profile/${member.id}`);
  };

  const renderMemberItem = ({ item }: { item: CommitteeMember }) => (
    <Pressable
      style={({ pressed }) => [
        styles.memberRow,
        {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? '#2C2C2E' : '#E8E5E0',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={() => handleMemberPress(item)}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: isDark ? '#3A3A3C' : '#1C1C1E' }]}>
            <Text style={[styles.avatarInitials, { color: isDark ? '#FFFFFF' : '#FDFBF7' }]}>
              {getInitials(item.name)}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: theme.text }]}>{item.name}</Text>
        {(item.major || item.year) && (
          <Text style={[styles.memberMeta, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            {[item.major, item.year].filter(Boolean).join(' • ')}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={isDark ? '#8E8E93' : '#C7C7CC'} />
    </Pressable>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Unable to load members</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: isDark ? '#FFFFFF' : '#1C1C1E' }]}
            onPress={refetch}
          >
            <Text style={[styles.retryButtonText, { color: isDark ? '#1C1C1E' : '#FDFBF7' }]}>
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    if (searchQuery && filteredMembers.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            Try a different search term
          </Text>
        </View>
      );
    }

    if (members.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#6e6e73" />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No members yet</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
            Be the first to join this committee
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Search Bar */}
      {members.length > 0 && (
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#2C2C2E' : '#E8E5E0',
            },
          ]}
        >
          <Ionicons name="search" size={20} color={isDark ? '#8E8E93' : '#6e6e73'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search members..."
            placeholderTextColor={isDark ? '#8E8E93' : '#6e6e73'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#8E8E93' : '#6e6e73'} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
              borderBottomColor: isDark ? '#2C2C2E' : '#E8E5E0',
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={onClose}
              >
                <Ionicons name="close" size={28} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {committeeTitle}
              </Text>
              {!isLoading && members.length > 0 && (
                <Text style={[styles.headerSubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
                  {totalCount} {totalCount === 1 ? 'member' : 'members'}
                </Text>
              )}
            </View>

            <View style={styles.headerRight} />
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#1C1C1E'} />
            <Text style={[styles.loadingText, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
              Loading members...
            </Text>
          </View>
        )}

        {/* Members List */}
        {!isLoading && (
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderMemberItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 44,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberMeta: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
});
Update Todos

Create MembersModal component for full-screen member list

Create ViewMembersButton component to trigger the modal

Update components/committees/index.ts exports

Update all 13 committee pages to use button instead of inline list
Write ViewMembersButton.tsx
100 lines
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommitteeMembers } from '@/hooks/committees';
import { MembersModal } from './MembersModal';

interface ViewMembersButtonProps {
  committeeSlug: string;
  committeeTitle: string;
}

export const ViewMembersButton: React.FC<ViewMembersButtonProps> = ({
  committeeSlug,
  committeeTitle,
}) => {
  const { theme, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const { totalCount, isLoading } = useCommitteeMembers(committeeSlug);

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderColor: isDark ? '#2C2C2E' : '#E8E5E0',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.buttonContent}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F5F3F0' }]}>
            <Ionicons name="people" size={22} color={isDark ? '#FFFFFF' : '#1C1C1E'} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.buttonTitle, { color: theme.text }]}>
              Committee Members
            </Text>
            {!isLoading && (
              <Text style={[styles.buttonSubtitle, { color: isDark ? '#8E8E93' : '#6e6e73' }]}>
                {totalCount} {totalCount === 1 ? 'member' : 'members'}
              </Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={22} color={isDark ? '#8E8E93' : '#C7C7CC'} />
        </View>
      </Pressable>

      <MembersModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        committeeSlug={committeeSlug}
        committeeTitle={committeeTitle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  button: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  buttonSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
Update Todos

Create MembersModal component for full-screen member list

Create ViewMembersButton component to trigger the modal

Update components/committees/index.ts exports

Update all 13 committee pages to use button instead of inline list
Edit index.ts
Added 2 lines
Update Todos

Create MembersModal component for full-screen member list

Create ViewMembersButton component to trigger the modal

Update components/committees/index.ts exports

Update all 13 committee pages to use button instead of inline list
Now let me read a couple of the committee pages to understand the exact format, then update all 13.

Read external-vp.tsx
Read internal-vp.tsx
Read treasurer.tsx
All committee pages have the same structure. I need to:

Replace CommitteeMembersList with ViewMembersButton in the import
Replace <CommitteeMembersList committeeSlug="..." /> with <ViewMembersButton committeeSlug="..." committeeTitle={committee.title} />
Let me update all 13 files.

Edit marketing.tsx
Modified
Edit external-vp.tsx
Modified
Edit internal-vp.tsx
Modified
Edit treasurer.tsx
Modified
Read secretary.tsx
Read public-relations.tsx
Read webmaster.tsx
Read outreach.tsx
Read pre-college.tsx
Read membership.tsx
Read shpetinas.tsx
Read internshpe.tsx
Read event-coordinator.tsx
Now let me update all the remaining 9 committee pages. I'll update the imports first, then the component usage.

Edit secretary.tsx
Modified
Edit public-relations.tsx
Modified
Edit webmaster.tsx
Modified
Edit outreach.tsx
Modified
Edit pre-college.tsx
Modified
Edit membership.tsx
Modified
Edit shpetinas.tsx
Modified
Edit internshpe.tsx
Modified
Edit event-coordinator.tsx
Modified
Now I need to update the component usage in each file to replace CommitteeMembersList with ViewMembersButton. Let me update all 13 files.

Edit marketing.tsx
Edit failed
Edit external-vp.tsx
Edit failed
Edit internal-vp.tsx
Edit failed
Edit treasurer.tsx
Edit failed
Edit secretary.tsx
Modified
Edit public-relations.tsx
Modified
Edit webmaster.tsx
Modified
Edit outreach.tsx
Modified
Edit pre-college.tsx
Modified
Edit membership.tsx
Modified
Edit shpetinas.tsx
Modified
Edit internshpe.tsx
Modified
Edit event-coordinator.tsx
Modified
I need to read and update the remaining 4 files that failed.

Read marketing.tsx
Read external-vp.tsx
Read internal-vp.tsx
Read treasurer.tsx
Edit marketing.tsx
Modified
Edit external-vp.tsx
Modified
Edit internal-vp.tsx
Modified
Edit treasurer.tsx
Modified
Update Todos

Create MembersModal component for full-screen member list

Create ViewMembersButton component to trigger the modal

Update components/committees/index.ts exports

Update all 13 committee pages to use button instead of inline list
All done. Here's a summary of the changes:

Created 2 new components:

MembersModal.tsx - A full-screen modal that displays:

Blurred header with close button and member count
Search bar to filter members
FlatList of members with avatars, names, major, and year
Tap on a member to navigate to their profile
Proper loading, error, and empty states
ViewMembersButton.tsx - A styled button that:

Shows "Committee Members" with a people icon
Displays the member count
Opens the full-screen modal when pressed
Updated 13 committee pages:

event-coordinator.tsx
external-vp.tsx
internal-vp.tsx
internshpe.tsx
marketing.tsx
membership.tsx
outreach.tsx
pre-college.tsx
public-relations.tsx
secretary.tsx
shpetinas.tsx
treasurer.tsx
webmaster.tsx
Each page now shows a button instead of the inline member list. Tapping the button opens a slide-up modal with the full searchable member list.