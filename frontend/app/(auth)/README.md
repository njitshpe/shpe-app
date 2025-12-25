# /app/auth/ - Authentication Routes

**Purpose**: Login and authentication screens

**Contents**:
- `login.tsx` - OAuth login screen (Google, LinkedIn, etc.)

**Features**:
- OAuth provider selection
- OAuth flow initiation
- Redirect handling
- Error states for failed auth

**Rules**:
- Navigation and UI only
- Business logic in `/hooks/useAuth.ts`
- Auth client calls via `/lib/auth.ts`
