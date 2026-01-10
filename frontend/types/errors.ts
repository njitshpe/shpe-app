// Standardized, graceful, error handling types
// Provides consistent, user-friendly error responses across all services

// Eror response structure
export interface AppError {
  // User-friendly error message appropriate for display
  message: string;
  // Machine-readable error code for programmatic handling
  code: ErrorCode;
  // Optional field that caused the error (for form validation)
  field?: string;
  // Optional additional details (for logging/debugging)
  details?: string;
}

// Error codes for different types of failures
export type ErrorCode =
  // Validation errors
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORDS_DO_NOT_MATCH'
  | 'MISSING_REQUIRED_FIELD'
  | 'VALIDATION_ERROR'

  // Authentication errors
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'EMAIL_ALREADY_IN_USE'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED'

  // Network errors
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SERVER_ERROR'
  | 'OFFLINE_ERROR'
  | 'RATE_LIMIT_ERROR'

  // Database errors
  | 'DATABASE_ERROR'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'UPLOAD_ERROR'
  | 'DELETE_ERROR'

  // Permission errors
  | 'PERMISSION_DENIED'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_PERMISSION_DENIED'
  | 'NOTIFICATION_PERMISSION_DENIED'
  | 'NOTIFICATION_FAILED'

  // Logic errors
  | 'EVENT_NOT_FOUND'
  | 'ALREADY_CHECKED_IN'
  | 'CHECK_IN_CLOSED'
  | 'EVENT_FULL'

  // Rank errors
  | 'RANK_UPDATE_FAILED'
  | 'INVALID_ACTION_TYPE'
  | 'RULES_NOT_FOUND'

  // Admin event errors
  | 'EVENT_CREATE_FAILED'
  | 'EVENT_UPDATE_FAILED'
  | 'EVENT_DELETE_FAILED'
  | 'FORBIDDEN'

  // Configuration errors
  | 'CONFIGURATION_ERROR'
  | 'REQUEST_CANCELLED'

  // Unidentified errors
  | 'UNKNOWN_ERROR';

// Standard response with error handling
export interface ServiceResponse<T = void> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// Helper function to create standardized error objects
export function createError(
  message: string,
  code: ErrorCode,
  field?: string,
  details?: string
): AppError {
  return { message, code, field, details };
}

// Map Supabase error codes to user-friendly messages
export function mapSupabaseError(error: unknown): AppError {
  const err = error as any; // Cast once for property access
  // Handle network errors
  if (err.message?.includes('fetch') || err.message?.includes('network')) {
    return createError(
      'Unable to connect. Please check your internet connection.',
      'NETWORK_ERROR',
      undefined,
      err.message
    );
  }

  // Handle auth errors based on error code
  switch (err.code) {
    case 'invalid_credentials':
    case '400':
      return createError(
        'Invalid email or password. Please try again.',
        'INVALID_CREDENTIALS'
      );

    case 'user_not_found':
      return createError(
        'No account found with this email.',
        'USER_NOT_FOUND'
      );

    case 'email_exists':
    case '23505': // PostgreSQL unique violation
      return createError(
        'An account with this email already exists.',
        'EMAIL_ALREADY_IN_USE',
        'email'
      );

    case 'weak_password':
      return createError(
        'Password is too weak. Please use a stronger password.',
        'INVALID_PASSWORD',
        'password'
      );

    case 'over_request_rate_limit':
      return createError(
        'Too many attempts. Please wait a moment and try again.',
        'SERVER_ERROR'
      );

    default:
      // Generic error with details for debugging
      return createError(
        'An unexpected error occurred. Please try again.',
        'UNKNOWN_ERROR',
        undefined,
        err.message
      );
  }
}

// Validation helper functions
export const validators = {
  // Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isValidPassword(password: string): { valid: boolean; error?: AppError } {
    if (!password || password.length < 6) {
      return {
        valid: false,
        error: createError(
          'Password must be at least 6 characters long.',
          'PASSWORD_TOO_SHORT',
          'password'
        ),
      };
    }
    return { valid: true };
  },

  // Validate required field
  isRequired(value: string, fieldName: string): AppError | null {
    if (!value || value.trim().length === 0) {
      return createError(
        `${fieldName} is required.`,
        'MISSING_REQUIRED_FIELD',
        fieldName.toLowerCase()
      );
    }
    return null;
  },

  // Validate phone number (10 digits)
  isValidPhoneNumber(phone: string): boolean {
    // Allow (XXX) XXX-XXXX or XXXXXXXXXX
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  },

  // Validate URL
  isValidUrl(url: string): boolean {
    try {
      // Basic check for common URL patterns
      return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(url);
    } catch {
      return false;
    }
  },
};

// Network utilities

// Check if the device is online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/*
 * Helper function to handle Supabase query responses
 * Converts Supabase response format into standardized ServiceResponse
 * @param data: the data returned from Supabase query
 * @param error: the error returned from Supabase query
 * @returns ServiceResponse with success/error status
 */
export function handleSupabaseError<T>(
  data: T | null,
  error: unknown
): ServiceResponse<T> {
  if (error) {
    return { success: false, error: mapSupabaseError(error) };
  }
  return { success: true, data: data! };
}
