# User Profile Implementation Guide

## Overview

Implements: Profile tab UI, User DB object, profile editing, resume upload, and onboarding flow.

---

## 1. Database Schema

### Migration: `create_users_table`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('undergrad_njit', 'undergrad_other', 'alumni_njit', 'alumni_other')),
  major TEXT,
  profile_picture_url TEXT,
  resume_url TEXT,
  interests TEXT[] DEFAULT '{}',
  points_total INTEGER DEFAULT 0,
  events_attended_count INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are readable" ON users
  FOR SELECT USING (true);
```

### Storage Buckets

```sql
-- Run via Supabase Dashboard or SQL
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-pictures', 'profile-pictures', true),
  ('resumes', 'resumes', false);
```

---

## 2. File Structure

```
app/
├─ (tabs)/
│   └─ profile.tsx          # Profile tab screen
├─ onboarding/
│   └─ index.tsx            # Onboarding flow
│
components/
├─ ProfileHeader.tsx        # Avatar + name display
├─ ProfileForm.tsx          # Edit form fields
├─ ResumeUploader.tsx       # Resume upload/view
├─ InterestPicker.tsx       # Interest selection chips
│
hooks/
├─ useProfile.ts            # Profile CRUD operations
├─ useProfilePhoto.ts       # Photo upload (exists)
├─ useResume.ts             # Resume upload/download
├─ useOnboarding.ts         # Onboarding state
│
store/
└─ user.store.ts            # User state (Zustand)
```

---

## 3. Types

```typescript
// types/user.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'undergrad_njit' | 'undergrad_other' | 'alumni_njit' | 'alumni_other';
  major?: string;
  profile_picture_url?: string;
  resume_url?: string;
  interests: string[];
  points_total: number;
  events_attended_count: number;
  onboarding_completed: boolean;
}

export interface UpdateProfilePayload {
  name?: string;
  major?: string;
  profile_picture_url?: string;
  resume_url?: string;
  interests?: string[];
}

export const AVAILABLE_INTERESTS = [
  'Software Engineering',
  'Data Science',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Research',
  'Entrepreneurship',
  'Networking',
  'Career Development',
  'Community Service',
] as const;
```

---

## 4. Zustand Store

```typescript
// store/user.store.ts

import { create } from 'zustand';
import { User } from '@/types/user';

interface UserStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
  setLoading: (loading) => set({ loading }),
}));
```

---

## 5. Core Hook: useProfile

```typescript
// hooks/useProfile.ts

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user.store';
import { User, UpdateProfilePayload } from '@/types/user';

export function useProfile() {
  const { user, setUser, updateUser, setLoading } = useUserStore();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchProfile() {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      setLoading(false);
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return null;
    }

    setUser(data);
    setLoading(false);
    return data;
  }

  async function updateProfile(updates: UpdateProfilePayload) {
    if (!user) return null;

    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return null;
    }

    updateUser(data);
    return data;
  }

  return { user, error, saving, fetchProfile, updateProfile };
}
```

---

## 6. Resume Hook

```typescript
// hooks/useResume.ts

import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user.store';

export function useResume() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickAndUploadResume() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) return null;

    const file = result.assets[0];
    setUploading(true);
    setError(null);

    try {
      const fileName = `${user?.id}/${Date.now()}.pdf`;
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, blob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      // Get signed URL (private bucket)
      const { data: { signedUrl } } = await supabase.storage
        .from('resumes')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ resume_url: fileName })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      updateUser({ resume_url: fileName });
      return signedUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function getResumeUrl() {
    if (!user?.resume_url) return null;

    const { data } = await supabase.storage
      .from('resumes')
      .createSignedUrl(user.resume_url, 60 * 60); // 1 hour

    return data?.signedUrl ?? null;
  }

  return { uploading, error, pickAndUploadResume, getResumeUrl };
}
```

---

## 7. Onboarding Hook

```typescript
// hooks/useOnboarding.ts

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user.store';
import { UpdateProfilePayload, AVAILABLE_INTERESTS } from '@/types/user';

interface OnboardingData {
  name: string;
  major: string;
  role: string;
  interests: string[];
  profile_picture_url?: string;
}

export function useOnboarding() {
  const updateUser = useUserStore((s) => s.updateUser);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    major: '',
    role: 'undergrad_njit',
    interests: [],
  });

  function updateData(updates: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...updates }));
  }

  function nextStep() {
    setStep((prev) => prev + 1);
  }

  function prevStep() {
    setStep((prev) => Math.max(0, prev - 1));
  }

  async function completeOnboarding() {
    setSaving(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return false;

    const { error } = await supabase
      .from('users')
      .update({
        name: data.name,
        major: data.major,
        role: data.role,
        interests: data.interests,
        profile_picture_url: data.profile_picture_url,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id);

    setSaving(false);

    if (error) return false;

    updateUser({ ...data, onboarding_completed: true });
    return true;
  }

  return {
    step,
    data,
    saving,
    updateData,
    nextStep,
    prevStep,
    completeOnboarding,
    AVAILABLE_INTERESTS,
  };
}
```

---

## 8. Profile Screen (Minimal)

```typescript
// app/(tabs)/profile.tsx

import { View, Text, Pressable, Image, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { useResume } from '@/hooks/useResume';

export default function ProfileScreen() {
  const { user, fetchProfile, updateProfile, saving } = useProfile();
  const { uploadProfilePhoto, uploading: uploadingPhoto } = useProfilePhoto();
  const { pickAndUploadResume, getResumeUrl, uploading: uploadingResume } = useResume();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!user) return <Text>Loading...</Text>;

  return (
    <ScrollView>
      {/* Profile Picture */}
      <Pressable onPress={() => uploadProfilePhoto('gallery')}>
        <Image
          source={{ uri: user.profile_picture_url || 'https://placeholder.com/150' }}
          style={{ width: 120, height: 120, borderRadius: 60 }}
        />
        <Text>Change Photo</Text>
      </Pressable>

      {/* User Info */}
      <Text>{user.name}</Text>
      <Text>{user.major}</Text>
      <Text>{user.role}</Text>

      {/* Stats */}
      <View>
        <Text>Points: {user.points_total}</Text>
        <Text>Events: {user.events_attended_count}</Text>
      </View>

      {/* Interests */}
      <View>
        {user.interests.map((i) => <Text key={i}>{i}</Text>)}
      </View>

      {/* Resume */}
      <Pressable onPress={pickAndUploadResume}>
        <Text>{user.resume_url ? 'Update Resume' : 'Upload Resume'}</Text>
      </Pressable>

      {/* Edit Button */}
      <Pressable onPress={() => setEditing(true)}>
        <Text>Edit Profile</Text>
      </Pressable>
    </ScrollView>
  );
}
```

---

## 9. Onboarding Screen (Minimal)

```typescript
// app/onboarding/index.tsx

import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';

export default function OnboardingScreen() {
  const router = useRouter();
  const { step, data, updateData, nextStep, prevStep, completeOnboarding, saving, AVAILABLE_INTERESTS } = useOnboarding();
  const { uploadProfilePhoto } = useProfilePhoto();

  async function handleComplete() {
    const success = await completeOnboarding();
    if (success) router.replace('/(tabs)/profile');
  }

  // Step 0: Name & Major
  if (step === 0) {
    return (
      <View>
        <Text>What's your name?</Text>
        <TextInput
          value={data.name}
          onChangeText={(name) => updateData({ name })}
        />
        <Text>What's your major?</Text>
        <TextInput
          value={data.major}
          onChangeText={(major) => updateData({ major })}
        />
        <Pressable onPress={nextStep}><Text>Next</Text></Pressable>
      </View>
    );
  }

  // Step 1: Profile Photo
  if (step === 1) {
    return (
      <View>
        <Text>Add a profile photo</Text>
        <Pressable onPress={async () => {
          const url = await uploadProfilePhoto('gallery');
          if (url) updateData({ profile_picture_url: url });
        }}>
          <Text>Choose Photo</Text>
        </Pressable>
        <Pressable onPress={prevStep}><Text>Back</Text></Pressable>
        <Pressable onPress={nextStep}><Text>Next</Text></Pressable>
      </View>
    );
  }

  // Step 2: Interests
  if (step === 2) {
    return (
      <View>
        <Text>Select your interests</Text>
        {AVAILABLE_INTERESTS.map((interest) => (
          <Pressable
            key={interest}
            onPress={() => {
              const interests = data.interests.includes(interest)
                ? data.interests.filter((i) => i !== interest)
                : [...data.interests, interest];
              updateData({ interests });
            }}
          >
            <Text>{data.interests.includes(interest) ? '✓ ' : ''}{interest}</Text>
          </Pressable>
        ))}
        <Pressable onPress={prevStep}><Text>Back</Text></Pressable>
        <Pressable onPress={handleComplete} disabled={saving}>
          <Text>{saving ? 'Saving...' : 'Complete'}</Text>
        </Pressable>
      </View>
    );
  }

  return null;
}
```

---

## 10. Auth Integration (Trigger Onboarding)

```typescript
// In your auth callback or _layout.tsx

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';

export function useAuthRedirect() {
  const router = useRouter();
  const { user, fetchProfile } = useProfile();

  useEffect(() => {
    async function checkOnboarding() {
      const profile = await fetchProfile();

      if (profile && !profile.onboarding_completed) {
        router.replace('/onboarding');
      }
    }

    checkOnboarding();
  }, []);
}
```

---

## 11. Dependencies to Install

```bash
npx expo install expo-document-picker expo-image-picker
```

---

## Quick Reference

| Feature | Hook | Screen |
|---------|------|--------|
| View/Edit Profile | `useProfile` | `profile.tsx` |
| Profile Photo | `useProfilePhoto` | `profile.tsx`, `onboarding/` |
| Resume Upload | `useResume` | `profile.tsx` |
| Onboarding | `useOnboarding` | `onboarding/index.tsx` |

---

## Implementation Order

1. **DB**: Create users table migration
2. **Storage**: Create buckets
3. **Types**: Add `types/user.ts`
4. **Store**: Add `user.store.ts`
5. **Hooks**: `useProfile` → `useResume` → `useOnboarding`
6. **Screens**: Profile tab → Onboarding flow
7. **Auth**: Wire onboarding redirect
