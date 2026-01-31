assume a user completed onboarding and is a signed in user of this app. the user closes the app and initiates iit again the next day. when they do, they see the splash screen and then a solid black screen, there is a delay before the skeleton appears. what is happening when a user opens the app?
(no content)

Task:Explore app startup flow
IN
I need to understand what happens when a signed-in user opens this React Native/Expo app. Specifically:

1. Find the app entry point (App.tsx, index.js, or similar)
2. Find the navigation/routing setup - what screens are shown first?
3. Find any splash screen configuration
4. Find the authentication check flow - how does the app determine if a user is already signed in?
5. Find any loading states, skeleton screens, or intermediate screens shown during startup
6. Look for any async operations that happen before the main content is displayed (token validation, data fetching, etc.)

I want to understand the full sequence from app launch to the user seeing content, especially what could cause a black screen between the splash screen and skeleton/content appearing.
Bash
IN
find /home/jossue/dev/shpe-app -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | grep -E "(App|index|main|entry)" | head -20

OUT
/home/jossue/dev/shpe-app/frontend/services/index.ts
/home/jossue/dev/shpe-app/frontend/onboarding/index.ts
/home/jossue/dev/shpe-app/frontend/components/events/index.ts
/home/jossue/dev/shpe-app/frontend/components/settings/index.ts
/home/jossue/dev/shpe-app/frontend/components/shared/index.ts
/home/jossue/dev/shpe-app/frontend/components/committees/index.ts
/home/jossue/dev/shpe-app/frontend/components/ui/index.ts
/home/jossue/dev/shpe-app/frontend/components/feed/index.ts
/home/jossue/dev/shpe-app/frontend/components/calendar/index.ts
/home/jossue/dev/shpe-app/frontend/components/media/index.ts
/home/jossue/dev/shpe-app/frontend/components/auth/index.ts
/home/jossue/dev/shpe-app/frontend/components/profile/index.ts
/home/jossue/dev/shpe-app/frontend/components/leaderboard/index.ts
/home/jossue/dev/shpe-app/frontend/hooks/events/index.ts
/home/jossue/dev/shpe-app/frontend/hooks/committees/index.ts
/home/jossue/dev/shpe-app/frontend/hooks/feed/index.ts
/home/jossue/dev/shpe-app/frontend/hooks/calendar/index.ts
/home/jossue/dev/shpe-app/frontend/hooks/media/index.ts
/home/jossue/dev/shpe-app/frontend/hooks/profile/index.ts
/home/jossue/dev/shpe-app/frontend/hooks/leaderboard/index.ts
Bash
IN
ls -la /home/jossue/dev/shpe-app/ | head -30

OUT
total 40
drwxr-xr-x  9 jossue jossue 4096 Jan 22 05:19 .
drwxr-xr-x  8 jossue jossue 4096 Jan 29 16:09 ..
drwxr-xr-x  8 jossue jossue 4096 Jan 30 19:56 .git
drwxr-xr-x  2 jossue jossue 4096 Jan 22 05:19 .github
-rw-r--r--  1 jossue jossue  161 Jan 22 05:19 .gitignore
drwxr-xr-x  2 jossue jossue 4096 Jan 22 05:19 .vscode
drwxr-xr-x  2 jossue jossue 4096 Jan 22 05:19 docs
drwxr-xr-x 21 jossue jossue 4096 Jan 30 19:56 frontend
drwxr-xr-x 28 jossue jossue 4096 Jan  9 04:40 node_modules
drwxr-xr-x  6 jossue jossue 4096 Jan 22 05:19 supabase
Bash
IN
ls -la /home/jossue/dev/shpe-app/frontend/app/

OUT
<tool_use_error>Sibling tool call errored</tool_use_error>
Bash
IN
ls -la /home/jossue/dev/shpe-app/

OUT
total 40
drwxr-xr-x  9 jossue jossue 4096 Jan 22 05:19 .
drwxr-xr-x  8 jossue jossue 4096 Jan 29 16:09 ..
drwxr-xr-x  8 jossue jossue 4096 Jan 30 19:56 .git
drwxr-xr-x  2 jossue jossue 4096 Jan 22 05:19 .github
-rw-r--r--  1 jossue jossue  161 Jan 22 05:19 .gitignore
drwxr-xr-x  2 jossue jossue 4096 Jan 22 05:19 .vscode
drwxr-xr-x  2 jossue jossue 4096 Jan 22 05:19 docs
drwxr-xr-x 21 jossue jossue 4096 Jan 30 19:56 frontend
drwxr-xr-x 28 jossue jossue 4096 Jan  9 04:40 node_modules
drwxr-xr-x  6 jossue jossue 4096 Jan 22 05:19 supabase
Bash
IN
find /home/jossue/dev/shpe-app/frontend/app -name "_layout*" -type f

OUT
/home/jossue/dev/shpe-app/frontend/app/_layout.tsx
/home/jossue/dev/shpe-app/frontend/app/(app)/_layout.tsx
/home/jossue/dev/shpe-app/frontend/app/(app)/(tabs)/_layout.tsx
/home/jossue/dev/shpe-app/frontend/app/(app)/(tabs)/profile/_layout.tsx
/home/jossue/dev/shpe-app/frontend/app/(auth)/_layout.tsx
Bash
IN
find /home/jossue/dev/shpe-app/frontend -name "*AuthContext*" -o -name "*useAuth*" | grep -v node_modules

OUT
/home/jossue/dev/shpe-app/frontend/contexts/AuthContext.tsx
Bash
IN
find /home/jossue/dev/shpe-app/frontend -name "AnimatedSplash*" | grep -v node_modules

OUT
/home/jossue/dev/shpe-app/frontend/components/auth/AnimatedSplash.tsx
Read AnimatedSplash.tsx
Read _layout.tsx
Bash
IN
find /home/jossue/dev/shpe-app/frontend -name "*skeleton*" -o -name "*loader*" -o -name "*loading*" | grep -v node_modules | head -20

OUT
/home/jossue/dev/shpe-app/frontend/components/media/ResumeUploader.tsx
Bash
IN
find /home/jossue/dev/shpe-app/frontend/components -name "*Skeleton*" | grep -v node_modules

OUT
/home/jossue/dev/shpe-app/frontend/components/ui/Skeleton.tsx
/home/jossue/dev/shpe-app/frontend/components/ui/FeedSkeleton.tsx
/home/jossue/dev/shpe-app/frontend/components/home/HeroEventSkeleton.tsx
/home/jossue/dev/shpe-app/frontend/components/home/HomeScreenSkeleton.tsx
/home/jossue/dev/shpe-app/frontend/components/profile/ProfileSkeleton.tsx
Read package.json
Read index.tsx
Bash
IN
find /home/jossue/dev/shpe-app/frontend -name "supabase*" | grep -v node_modules

OUT
/home/jossue/dev/shpe-app/frontend/lib/supabase.ts
/home/jossue/dev/shpe-app/frontend/supabase
Read supabase.ts
Here's the full startup sequence for a signed-in, onboarded user:

App Startup Flow
1. Native Splash Screen
Configured in app.json with a black background (#000000) and white logo. This shows immediately while the JS bundle loads. It's kept visible via SplashScreen.preventAutoHideAsync() at _layout.tsx:25.

2. Provider Initialization
The root layout (_layout.tsx:319-346) mounts a deep provider tree:

GestureHandlerRootView → AnimatedSplash → ThemeProvider → ErrorBoundary → AuthProvider → BlockProvider → NotificationProvider → EventsProvider → AuthGuard → Slot

3. Auth Bootstrapping (the critical async work)
In AuthContext.tsx:71-127, the AuthProvider does:

Calls supabase.auth.getSession() to retrieve the persisted session from AsyncStorage
If a session exists and onboarding is complete, fetches the user profile via profileService.getProfile() with a 5-second timeout (line 87)
Sets isBootstrapping = false when done
4. The Black Screen Gap
This is where the black screen comes from. In index.tsx:10-15, the root index renders return null (nothing) while isLoading or isBootstrapping is true. At this point the native splash has already hidden (via the onLayoutRootView callback), but the animated splash and app content haven't rendered meaningful pixels yet — so the user sees the black background of the root view.

5. Animated Splash Plays
Once isBootstrapping becomes false, the AuthGuard (_layout.tsx:82-87) calls setReady(), which triggers the AnimatedSplash (AnimatedSplash.tsx) animation sequence — logo scale, glow, color transition, fade-out — taking roughly 1.4–2 seconds.

6. Routing to Home
The AuthGuard (_layout.tsx:109-210) evaluates the user's state and redirects to /home since they have a session + profile + completed onboarding.

7. Home Screen Skeleton → Content
The home screen (home/index.tsx:150-162) shows HomeScreenSkeleton while it fires 5 parallel API calls (events, user events, announcements, badge count, rank). Once those resolve, real content renders.

What Causes the Black Screen Delay
The black screen between the native splash and the skeleton is caused by two sequential async bottlenecks:

supabase.auth.getSession() — reads the session from AsyncStorage (disk I/O)
profileService.getProfile() — network request to fetch the user's profile, with up to a 5-second timeout
During this time, isBootstrapping is true, so index.tsx returns null, the animated splash is in its waiting phase (not yet animating), and the native splash has already been dismissed — leaving a black void.

The animated splash also has an 8-second safety timeout (AnimatedSplash.tsx:247) in case setReady() is never called, which means in the worst case the user could see black for up to 8 seconds.

You are a senior RN/Expo engineer. Fix the startup black screen by making AnimatedSplash own the native handoff and render a visible static frame while waiting. Do NOT add new components yet.

Scope:

_layout.tsx
AnimatedSplash.tsx
(Optional safety) index.tsx
Tasks:

In _layout.tsx, remove the early native splash hide. That means:

Delete onLayoutRootView and the SplashScreen.hideAsync() call.
Remove the onLayout prop from GestureHandlerRootView.
Keep SplashScreen.preventAutoHideAsync() at module scope as‑is.
In AnimatedSplash.tsx, ensure there is always a visible splash frame while the animation is “waiting.”

When phase === 'waiting', render a static black background + centered white logo (same asset as native).
This should be dependency‑free: no context/theme, no async logic. Just a simple View/Image.
The static frame should sit in the same overlay layer that the animation uses, so it covers the app until animation starts.
Ensure native splash is hidden only by AnimatedSplash (it already calls SplashScreen.hideAsync() in its prepareResources block). Do not introduce any additional hides elsewhere.

Optional safety: in index.tsx, replace return null during boot with a minimal <View style={{ flex: 1, backgroundColor: '#000' }} /> if you think it prevents edge flashes. Otherwise leave it.
(no content)

Let me read all three files first.

Read _layout.tsx
Read AnimatedSplash.tsx
Read index.tsx
Now I have a clear picture of the problem and the fix. Let me set up the task list and implement.

Update Todos

Remove onLayoutRootView and early native splash hide from _layout.tsx

Add static waiting frame to AnimatedSplash overlay

Replace return null in index.tsx with black View safety fallback
Update Todos

Remove onLayoutRootView and early native splash hide from _layout.tsx

Add static waiting frame to AnimatedSplash overlay

Replace return null in index.tsx with black View safety fallback
Root cause: onLayoutRootView in _layout.tsx calls SplashScreen.hideAsync() the moment GestureHandlerRootView lays out — before AnimatedSplash has loaded its assets and entered the animating phase. Meanwhile the overlay's logo has logoScale=0 and whiteLogoOpacity=0 during waiting, so the user sees a bare black void until prepareResources finishes.

The fix: let AnimatedSplash be the sole owner of hiding the native splash, and give it a visible static frame for the waiting phase.

1. _layout.tsx — remove the early native splash hide
Edit _layout.tsx
Modified
Edit _layout.tsx
Removed 4 lines
Update Todos

Remove onLayoutRootView and early native splash hide from _layout.tsx

Add static waiting frame to AnimatedSplash overlay

Replace return null in index.tsx with black View safety fallback
2. AnimatedSplash.tsx — add a static waiting frame
During waiting, the animated logo has logoScale=0 and whiteLogoOpacity=0, so it's invisible. I'll add a dependency-free static View+Image that matches the native splash exactly, rendered in the same overlay layer.

Edit AnimatedSplash.tsx
Added 8 lines
Now add the styles for the waiting frame.

Edit AnimatedSplash.tsx
Added 2 lines
Update Todos

Remove onLayoutRootView and early native splash hide from _layout.tsx

Add static waiting frame to AnimatedSplash overlay

Replace return null in index.tsx with black View safety fallback
3. index.tsx — safety fallback
Replace return null with a black View to prevent any edge-case flash if the overlay hasn't painted yet.

Edit index.tsx
Added 1 line
Edit index.tsx
Added 1 line
Update Todos

Remove onLayoutRootView and early native splash hide from _layout.tsx

Add static waiting frame to AnimatedSplash overlay

Replace return null in index.tsx with black View safety fallback
Let me verify the final state of all three files.

Read _layout.tsx (lines 2-6)
Read _layout.tsx (lines 314-343)
Read AnimatedSplash.tsx (lines 286-325)
Read index.tsx
All three files look correct. Here's a summary of what changed and why:

Summary of changes
What caused the black screen
onLayoutRootView in _layout.tsx called SplashScreen.hideAsync() the moment GestureHandlerRootView laid out — before AnimatedSplash had loaded assets and started animating. The native splash disappeared, but the animated overlay's logo had logoScale=0 and whiteLogoOpacity=0 during the waiting phase, leaving a bare black void until prepareResources completed (deferred behind InteractionManager.runAfterInteractions).

_layout.tsx
Removed the onLayoutRootView callback and its SplashScreen.hideAsync() call
Removed the onLayout prop from GestureHandlerRootView
Removed unused useCallback import
SplashScreen.preventAutoHideAsync() at module scope stays as-is
The native splash is now hidden only by AnimatedSplash (in its prepareResources finally block at AnimatedSplash.tsx:265, or the skip path at line 254).

AnimatedSplash.tsx
Added a static waiting frame (lines 299-303) inside the existing overlay: when phase === 'waiting', a plain View + Image renders black background + centered white logo at LOGO_SIZE_INITIAL (120px, same as native splash)
This frame is dependency-free — no context, no themes, no shared values — so it paints on the very first render
It sits in the overlay layer (zIndex: 9999) and naturally disappears when phase transitions to animating
Added waitingFrame and waitingLogo styles (lines 325-326)
index.tsx (safety)
Replaced return null with <View style={{ flex: 1, backgroundColor: '#000' }} /> during bootstrap — prevents any edge-case flash if the overlay hasn't painted yet
Resulting startup sequence
Native splash (OS-level) → stays up
AnimatedSplash mounts, renders static waiting frame (black + white logo) immediately
prepareResources loads logo assets + sound → calls SplashScreen.hideAsync() → seamless handoff to the identical-looking static frame
Phase transitions to animating → waiting frame unmounts, animated sequence plays
Auth bootstrapping completes → setReady() → splash fades out → app content visible
You are a senior React Native engineer. Implement a cache‑first, stale‑while‑revalidate bootstrap in AuthContext.tsx without breaking existing routing logic.

Scope: AuthContext.tsx only.

Goal:

Unblock UI as soon as a valid session exists, using cached profile if available.
Revalidate profile in the background and persist it.
Avoid race conditions with onAuthStateChange.
Requirements:

Parallel read on bootstrap

Use Promise.all to load both:
supabase.auth.getSession() (note shape: { data: { session }, error })
AsyncStorage.getItem('user_profile:<userId?>') (or current key if already standardized)
If you don’t yet know userId, read a generic user_profile key first, then prefer the per‑user key once you have the session.
Optimistic unblock

If data.session exists:
setSession(session) immediately.
If cached profile exists, setProfile(parsedProfile) immediately.
Set isBootstrapping = false immediately (do not wait for network).
If no session, set isBootstrapping = false and exit.
Background revalidation

After bootstrapping is false, call profileService.getProfile(session.user.id) in the background.
On success: update state + AsyncStorage.setItem with the fresh profile.
On failure: log quietly and keep cached profile.
Cache safety

Wrap JSON.parse in try/catch; on failure, clear the bad cache key.
Prefer user‑scoped cache key user_profile:<userId> to avoid cross‑account leakage.
Auth state change integration

If onAuthStateChange exists, ensure bootstrap doesn’t fight it.
Use a didBootstrapRef or isBootstrapping guard so you don’t double‑set state or override a newer session.
Login / logout flows

When a session is established, fetch and persist the profile (same cache key).
On logout, remove the cached profile key(s).
Constraints:

Keep existing types/interfaces.
Do not change AuthGuard logic or routing rules.
(no content)

Let me read the current AuthContext to understand the full implementation before making changes.

Read AuthContext.tsx
Let me check the profileService interface and existing AsyncStorage usage for the cache key pattern.

Grep "getProfile" (in /home/jossue/dev/shpe-app/frontend/services/profile.service.ts)
19 lines of output
Grep "user_profile|userProfile|cached.*profile" (in /home/jossue/dev/shpe-app/frontend)
129 lines of output
Now I have a full understanding of the file. Let me plan and implement the cache-first bootstrap.

Update Todos

Add AsyncStorage import to AuthContext.tsx

Add profile cache helpers (read/write/clear)

Replace bootstrap useEffect with cache-first parallel flow

Update signOut to clear cached profile

Update loadProfile to persist to cache
Step 1: Add AsyncStorage import
Edit AuthContext.tsx
Added 1 line
Update Todos

Add AsyncStorage import to AuthContext.tsx

Add profile cache helpers (read/write/clear)

Replace bootstrap useEffect with cache-first parallel flow

Update signOut to clear cached profile

Update loadProfile to persist to cache
Step 2: Add cache helpers after withTimeout
Edit AuthContext.tsx
Added 41 lines
Update Todos

Add AsyncStorage import to AuthContext.tsx

Add profile cache helpers (read/write/clear)

Replace bootstrap useEffect with cache-first parallel flow

Update signOut to clear cached profile

Update loadProfile to persist to cache
Step 3: Replace the bootstrap useEffect
This is the largest change — replacing the entire useEffect block (old lines 71-192) with the cache-first, stale-while-revalidate flow.

Edit AuthContext.tsx
Added 61 lines
Update Todos

Add AsyncStorage import to AuthContext.tsx

Add profile cache helpers (read/write/clear)

Replace bootstrap useEffect with cache-first parallel flow

Update signOut to clear cached profile

Update loadProfile to persist to cache
Step 4: Update signOut to clear cache
Edit AuthContext.tsx
Added 2 lines
Update Todos

Add AsyncStorage import to AuthContext.tsx

Add profile cache helpers (read/write/clear)

Replace bootstrap useEffect with cache-first parallel flow

Update signOut to clear cached profile

Update loadProfile to persist to cache
Step 5: Update loadProfile to persist to cache
Edit AuthContext.tsx
Added 1 line
Update Todos

Add AsyncStorage import to AuthContext.tsx

Add profile cache helpers (read/write/clear)

Replace bootstrap useEffect with cache-first parallel flow

Update signOut to clear cached profile

Update loadProfile to persist to cache
Let me verify the final file is coherent.

Read AuthContext.tsx
The file is clean and coherent. Here's a summary of what changed in AuthContext.tsx:

Summary of changes
New: Profile cache layer (lines 58-97)
Three stateless helpers outside the component — zero coupling to React state:

Helper	Purpose
readCachedProfile(userId)	Reads user_profile:<userId> from AsyncStorage. Wraps JSON.parse in try/catch; on corrupt JSON, clears the key and returns null.
writeCachedProfile(userId, profile)	Writes profile JSON + stores cached_user_id in parallel via Promise.all.
clearCachedProfile(userId?)	Removes both cached_user_id and user_profile:<userId> via multiRemove.
Keys are user-scoped (user_profile:<userId>) to prevent cross-account leakage. A separate cached_user_id key lets us do a parallel read before we know the session's userId.

Rewritten: Bootstrap useEffect (lines 113-295)
Before: getSession() → blocking profileService.getProfile() with 5s timeout → set isBootstrapping = false. The entire chain was sequential and the UI was locked the whole time.

After — three paths:

Cache hit (returning user, cached profile matches session userId):

Promise.all([getSession(), AsyncStorage.getItem('cached_user_id')]) runs in parallel
If cachedUserId === session.user.id, reads cached profile (fast local I/O)
Sets profile, isLoading=false, isBootstrapping=false immediately — UI unblocks
Fires profileService.getProfile() in background (no timeout, fire-and-forget)
On success: updates state + writes fresh data to cache
On failure: keeps cached profile silently
Cache miss (first launch, new user, or stale cache):

Falls through to the original blocking withTimeout(getProfile(), 5000) path
On success: writes profile to cache for next launch
Behavior is identical to the old code
No session / onboarding not complete:

Sets isBootstrapping=false immediately, no profile work
Race condition guard: A bootstrapDoneRef (closure-scoped) gates onAuthStateChange. While bootstrap is in-flight, all auth state events (including INITIAL_SESSION) are skipped — bootstrap owns the initial state. After bootstrapDoneRef.current = true, the listener resumes normally.

A cancelled flag prevents stale state updates if the component unmounts mid-bootstrap.

Updated: onAuthStateChange handler (lines 219-289)
Skips events while bootstrapDoneRef.current === false
On successful profile fetch: now calls writeCachedProfile() to keep cache fresh
On SIGNED_OUT or null session: calls clearCachedProfile() to wipe stale data
Updated: signOut (lines 571-575)
Captures currentUserIdRef.current before sign-out, then calls clearCachedProfile(userId) after. This is belt-and-suspenders alongside the SIGNED_OUT handler — both are idempotent.

Updated: loadProfile (lines 663-665)
Now calls writeCachedProfile(userId, result.data) on success, so profiles fetched via the explicit loadProfile() call (e.g., after onboarding) are also persisted for next launch.

What's unchanged
All types/interfaces (AuthContextType, etc.)
All auth methods (signIn, signUp, signInWithGoogle, signInWithApple, resetPassword, updatePassword)
updateUserMetadata, context value shape, useAuth hook
No changes to _layout.tsx AuthGuard or routing rules
Quick sanity review of the AuthContext changes:

Looks solid overall. A few specific checks/concerns:

bootstrapDoneRef: you create it inside the useEffect and use it in the auth listener. That’s fine because the listener is created in the same effect closure. Just ensure you don’t recreate multiple listeners (you don’t).
Cache‑hit path unblocks only when onboardingCompleted === true. That preserves prior behavior but still blocks if onboarding isn’t complete. If the goal is “always unblock,” you may want to allow cached profile even during onboarding (optional).
Cache‑miss path still blocks on the 5s timeout. That’s consistent with your “old path” but partially undercuts the new goal. If you want truly non‑blocking startup, you should set isBootstrapping=false even on cache miss and let the UI show skeletons while profile loads.
clearCachedProfile uses multiRemove and handles missing userId safely. Good.
signOut clears cache and the SIGNED_OUT event clears too. Idempotent, fine.
In the catch of bootstrap, you set bootstrapDoneRef.current = true (good). But note: if getSession() throws and onAuthStateChange fires later, you’ll still accept it.
Background revalidation in cache‑hit does not set profileLoading true; that’s good (won’t block UI), but ensure UI doesn’t rely on profileLoading for spinners.
Good review. Let me address the two substantive points you raised.

Update Todos

Fix cache-miss path: unblock UI immediately, let skeleton handle loading

Verify profileLoading is not misused for the background revalidation path
Let me first check how the home screen and other consumers use profileLoading to understand the downstream impact before making changes.

Grep "profileLoading" (in /home/jossue/dev/shpe-app/frontend)
9 lines of output
Read index.tsx (lines 41-60)
Read index.tsx (lines 40-59)
Read index.tsx (lines 146-170)
Read index.tsx (lines 226-240)
The downstream consumers are already skeleton-ready:

home/index.tsx:152: showFullSkeleton = loading || profileLoading → shows HomeScreenSkeleton
profile/index.tsx:231: profileLoading ? <ProfileSkeleton /> : <ScrollView ...>
So the fix is safe — on cache miss, I can set isBootstrapping=false immediately and let the UI route to /home where profileLoading=true drives the skeleton. The profile fetch continues in the background.

The background revalidation (cache-hit) path already correctly does NOT set profileLoading, so no skeleton flash during refresh. Confirmed correct.

Read AuthContext.tsx (lines 166-205)
Edit AuthContext.tsx
Added 8 lines
Let me verify the control flow around the edit is correct — the return exits bootstrap() so the bottom unblock code only runs for the no-session path.

Read AuthContext.tsx (lines 131-220)
Control flow is correct. All three paths through the if (session?.user?.id && onboardingCompleted) block now work the same way:

Path	Unblocks UI	Profile fetch	profileLoading
Cache hit (line 141)	Immediately + return	Background, no timeout	false (no skeleton)
Cache miss (line 168)	Immediately + return	Background, 5s timeout	true → skeleton → false
No session / no onboarding (line 204)	Falls through to line 209	None	false
Update Todos

Fix cache-miss path: unblock UI immediately, let skeleton handle loading

Verify profileLoading is not misused for the background revalidation path
Both points addressed:

Cache-miss path no longer blocks — isBootstrapping=false fires immediately, profileLoading=true drives skeletons in both home (line 152) and profile (line 231) while the fetch runs in the background. When it resolves, profileLoading flips to false and real content renders.

Background revalidation (cache-hit) confirmed safe — it never touches profileLoading, so there's no skeleton flash. The profile screen's guard at line 47 (if (!profile && !profileLoading) loadProfile(...)) also won't fire because profile is already set from cache.