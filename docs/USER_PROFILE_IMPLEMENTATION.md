# User Profile Implementation Guide

## Features to Implement

1. User Profile Tab UI
2. User object on DB
3. Edit profile properties (name, major, etc.)
4. Resume upload + view
5. Basic onboarding flow

---

## 1. Database Setup

### Users Table

Create migration with fields:
- `id` (UUID, references auth.users)
- `name`, `email`, `role`, `major`
- `profile_picture_url`, `resume_url`
- `interests` (text array)
- `points_total`, `events_attended_count`
- `onboarding_completed` (boolean)
- `created_at`, `updated_at`

### RLS Policies
- Users can read/update their own profile
- Public profiles readable by all authenticated users

### Storage Buckets
- `profile-pictures` (public)
- `resumes` (private, use signed URLs)

---

## 2. File Structure

```
app/(tabs)/profile.tsx       # Profile tab screen
app/onboarding/index.tsx     # Onboarding flow screen

components/
├─ ProfileHeader.tsx         # Avatar + name display
├─ ProfileForm.tsx           # Edit form (name, major inputs)
├─ ResumeUploader.tsx        # Upload button + PDF viewer link
└─ InterestPicker.tsx        # Selectable interest chips

hooks/
├─ useProfile.ts             # Fetch/update user profile
├─ useResume.ts              # Resume upload + get signed URL
└─ useOnboarding.ts          # Onboarding step state + submit

store/
└─ user.store.ts             # Global user state (Zustand)

types/
└─ user.ts                   # User interface + available interests
```

---

## 3. Profile Tab UI

**Screen: `app/(tabs)/profile.tsx`**

Display:
- Profile picture (tappable to change)
- Name, major, role
- Points total + events attended count
- Interest tags
- Resume section (upload/view button)
- Edit profile button

Edit Mode:
- Text inputs for name, major
- Interest picker (multi-select chips)
- Save/cancel buttons

---

## 4. Edit Profile Flow

**Hook: `useProfile.ts`**

Responsibilities:
- `fetchProfile()` — get user from Supabase on mount
- `updateProfile(updates)` — PATCH to users table
- Track `saving` and `error` state

Editable fields:
- `name`
- `major`
- `interests` (array)
- `profile_picture_url` (via photo upload)

---

## 5. Resume Upload + View

**Hook: `useResume.ts`**

Upload flow:
1. Use `expo-document-picker` to select PDF
2. Upload to `resumes` bucket with path `{user_id}/{timestamp}.pdf`
3. Save file path to `users.resume_url`

View flow:
1. Generate signed URL from stored path
2. Open in browser or PDF viewer

---

## 6. Onboarding Flow

**Screen: `app/onboarding/index.tsx`**

Trigger: After sign up, check `onboarding_completed === false` → redirect to onboarding

### Steps

| Step | Content |
|------|---------|
| 1 | Enter name + major |
| 2 | Upload profile picture |
| 3 | Select interests (multi-select) |

**Hook: `useOnboarding.ts`**

Responsibilities:
- Track current step (0, 1, 2)
- Store form data across steps
- `completeOnboarding()` — save all data + set `onboarding_completed = true`
- Navigate to profile tab on success

---

## 7. Auth Integration

In `_layout.tsx` or auth callback:
1. Fetch user profile after login
2. If `onboarding_completed === false` → redirect to `/onboarding`
3. Otherwise → proceed to main app

---

## 8. Dependencies

```bash
npx expo install expo-document-picker expo-image-picker
```

---

## Implementation Order

1. Create users table migration + RLS
2. Create storage buckets
3. Add types (`User` interface)
4. Add Zustand store (`user.store.ts`)
5. Implement `useProfile` hook
6. Build profile tab UI (view mode)
7. Add edit mode to profile tab
8. Implement `useResume` hook + UI
9. Implement `useOnboarding` hook
10. Build onboarding screens
11. Wire auth redirect logic
