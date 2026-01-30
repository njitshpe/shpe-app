# /app/ - Expo Router (Navigation Only)

**Purpose**: File-based routing using Expo Router. Routes handle navigation and auth gating ONLY.

**Rules**:
- ❌ No Supabase calls
- ❌ No business logic
- ✅ Auth gating only
- ✅ Navigation structure

**Structure**:
```
app/
├── (auth)/
│   └── login.tsx              # OAuth login screen
├── (tabs)/
│   ├── calendar.tsx           # Events calendar view
│   ├── feed.tsx               # Social feed with highlights
│   ├── profile.tsx            # User profile
│   └── admin.tsx              # Admin analytics (role-gated)
├── event/
│   └── [id].tsx               # Single event detail page
└── _layout.tsx                # Root layout with auth provider
```

**Responsibilities**:
- Define navigation structure
- Auth gating for protected routes
- Root layout with auth provider
- NO business logic or Supabase calls
