# `/utils/` - Small Helper Functions

## Purpose
Pure utility functions with **no side effects**.

## Rules
- ✅ Pure functions (same input → same output)
- ✅ No side effects (no API calls, no state mutations)
- ✅ Fully testable
- ❌ No business logic (use `hooks/`)
- ❌ No device interactions (use `services/`)

## Planned Utility Files

```
utils/
├── date.utils.ts              # Date formatting, timezone handling
├── points.utils.ts            # Points calculation helpers
├── validation.utils.ts        # Form validation
├── format.utils.ts            # String formatting
├── constants.ts               # App constants
└── helpers.ts                 # Misc helpers
```

## Date Utils

```typescript
// utils/date.utils.ts

/**
 * Format date to readable string
 * @example formatDate(new Date()) => "Dec 24, 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format time to 12-hour format
 * @example formatTime(new Date()) => "2:30 PM"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format full date and time
 * @example formatDateTime(new Date()) => "Dec 24, 2025 at 2:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d < new Date()
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * Get relative time string
 * @example getRelativeTime(pastDate) => "2 hours ago"
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return formatDate(d)
}

/**
 * Calculate time until event
 * @example getTimeUntil(futureDate) => "in 2 hours"
 */
export function getTimeUntil(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  
  if (diff < 0) return 'started'
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 60) return `in ${minutes}m`
  if (hours < 24) return `in ${hours}h`
  return `in ${days}d`
}
```

## Points Utils

```typescript
// utils/points.utils.ts

export const POINTS_VALUES = {
  EVENT_ATTENDANCE: 10,
  FEEDBACK_SUBMISSION: 5,
  PHOTO_UPLOAD: 5,
  PHOTO_WITH_ALUMNI: 10, // 2x
  PHOTO_WITH_PROFESSIONAL: 15, // 3x
  PHOTO_WITH_MEMBER_OF_MONTH: 20, // 4x
} as const

/**
 * Calculate points for photo upload
 */
export function calculatePhotoPoints(
  hasAlumni: boolean = false,
  hasProfessional: boolean = false,
  hasMemberOfMonth: boolean = false
): number {
  let points = POINTS_VALUES.PHOTO_UPLOAD
  
  if (hasMemberOfMonth) {
    return POINTS_VALUES.PHOTO_WITH_MEMBER_OF_MONTH
  }
  
  if (hasProfessional) {
    return POINTS_VALUES.PHOTO_WITH_PROFESSIONAL
  }
  
  if (hasAlumni) {
    return POINTS_VALUES.PHOTO_WITH_ALUMNI
  }
  
  return points
}

/**
 * Format points for display
 * @example formatPoints(1234) => "1,234 pts"
 */
export function formatPoints(points: number): string {
  return `${points.toLocaleString()} pts`
}

/**
 * Get rank badge emoji based on rank
 */
export function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  if (rank <= 10) return '⭐'
  return '👤'
}

/**
 * Calculate percentile from rank and total users
 */
export function calculatePercentile(rank: number, totalUsers: number): number {
  return Math.round((1 - (rank - 1) / totalUsers) * 100)
}
```

## Validation Utils

```typescript
// utils/validation.utils.ts

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate NJIT email
 */
export function isNJITEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@njit.edu')
}

/**
 * Validate LinkedIn URL
 */
export function isValidLinkedInUrl(url: string): boolean {
  const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[\w-]+\/?$/
  return linkedInRegex.test(url)
}

/**
 * Validate phone number (US format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
  return phoneRegex.test(phone)
}

/**
 * Validate graduation year
 */
export function isValidGraduationYear(year: number): boolean {
  const currentYear = new Date().getFullYear()
  return year >= currentYear - 10 && year <= currentYear + 10
}

/**
 * Sanitize user input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return strongPasswordRegex.test(password)
}
```

## Format Utils

```typescript
// utils/format.utils.ts

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Convert to title case
 */
export function toTitleCase(text: string): string {
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  
  return phone
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}
```

## Constants

```typescript
// utils/constants.ts

export const APP_NAME = 'SHPE NJIT'

export const APP_VERSION = '1.0.0'

export const SUPPORT_EMAIL = 'support@shpenjit.org'

export const SOCIAL_LINKS = {
  INSTAGRAM: 'https://instagram.com/shpenjit',
  LINKEDIN: 'https://linkedin.com/company/shpe-njit',
  WEBSITE: 'https://shpenjit.org',
} as const

export const MEMBER_TYPES = {
  UNDERGRAD_NJIT: 'undergrad_njit',
  UNDERGRAD_OTHER: 'undergrad_other',
  ALUMNI_NJIT: 'alumni_njit',
  ALUMNI_OTHER: 'alumni_other',
} as const

export const USER_ROLES = {
  MEMBER: 'member',
  ALUMNI: 'alumni',
  ADMIN: 'admin',
} as const

export const EVENT_TYPES = {
  GENERAL_MEETING: 'general_meeting',
  WORKSHOP: 'workshop',
  NETWORKING: 'networking',
  SOCIAL: 'social',
  PROFESSIONAL: 'professional',
} as const

export const FEED_ITEM_TYPES = {
  EVENT_HIGHLIGHT: 'event_highlight',
  ANNOUNCEMENT: 'announcement',
  MEMBER_SPOTLIGHT: 'member_spotlight',
  ACHIEVEMENT: 'achievement',
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@shpe/auth_token',
  USER_PREFERENCES: '@shpe/user_preferences',
  THEME: '@shpe/theme',
} as const

export const API_TIMEOUTS = {
  DEFAULT: 10000,
  UPLOAD: 30000,
  DOWNLOAD: 30000,
} as const

export const IMAGE_CONFIG = {
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  QUALITY: 0.7,
  MAX_SIZE_MB: 5,
} as const

export const PAGINATION = {
  EVENTS_PER_PAGE: 20,
  FEED_ITEMS_PER_PAGE: 10,
  RANKINGS_PER_PAGE: 50,
} as const
```

## Helpers

```typescript
// utils/helpers.ts

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0
}
```

## Usage Examples

```typescript
// In a component
import { formatDate, getRelativeTime } from '@/utils/date.utils'
import { formatPoints, getRankBadge } from '@/utils/points.utils'
import { truncate } from '@/utils/format.utils'

function EventCard({ event }) {
  return (
    <View>
      <Text>{truncate(event.title, 50)}</Text>
      <Text>{formatDate(event.date)}</Text>
      <Text>{formatPoints(event.points)}</Text>
    </View>
  )
}
```

## Best Practices

### 1. Pure Functions Only
```typescript
// Good: Pure function
export function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

// Bad: Side effects
export function formatDate(date: Date): string {
  console.log('Formatting date...') // ❌ Side effect
  return date.toLocaleDateString()
}
```

### 2. Single Responsibility
```typescript
// Good: Does one thing
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Bad: Does multiple things
export function validateAndFormatEmail(email: string): string {
  // Validation + formatting = too much
}
```

### 3. Type Safety
```typescript
// Good: Type-safe
export function formatPoints(points: number): string {
  return `${points.toLocaleString()} pts`
}

// Bad: No types
export function formatPoints(points) {
  return `${points.toLocaleString()} pts`
}
```

### 4. Document Complex Logic
```typescript
/**
 * Calculate percentile from rank and total users
 * @param rank - User's current rank (1-indexed)
 * @param totalUsers - Total number of users
 * @returns Percentile (0-100)
 */
export function calculatePercentile(rank: number, totalUsers: number): number {
  return Math.round((1 - (rank - 1) / totalUsers) * 100)
}
```

## What Goes Here
- Date/time formatting
- String manipulation
- Number formatting
- Validation functions
- Pure calculations
- Constants
- Type guards
- Array/object helpers

## What Does NOT Go Here
- API calls → Use `lib/` or `hooks/`
- Business logic → Use `hooks/`
- Device interactions → Use `services/`
- UI components → Use `components/`
- State management → Use `store/`
