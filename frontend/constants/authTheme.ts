/**
 * Auth Theme Helpers
 * Centralized color palettes and gradients for authentication screens
 */

export interface AuthPalette {
  text: string;
  subtext: string;
  muted: string;
  logoBg: string;
  logoBorder: string;
  logoInner: string;
  logoDiamond: string;
  checkboxBorder: string;
  checkboxActive: string;
  divider: string;
  socialBg: string;
  socialBorder: string;
  link: string;
}

export interface AuthInputPalette {
  label: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  placeholder: string;
  inputFocusBorder: string;
}

/**
 * Returns the background gradient colors for auth screens
 */
export const getAuthBackgroundColors = (isDark: boolean): string[] => {
  return isDark
    ? ['#001e55', '#001339', '#00030a']
    : ['#F7FAFF', '#E9F0FF', '#DDE8FF'];
};

/**
 * Returns the color palette for auth screens (login, signup)
 */
export const getAuthPalette = (isDark: boolean): AuthPalette => {
  return isDark
    ? {
        text: '#F5F8FF',
        subtext: 'rgba(229, 239, 255, 0.85)',
        muted: 'rgba(229, 239, 255, 0.7)',
        logoBg: 'rgba(255, 255, 255, 0.12)',
        logoBorder: 'rgba(255, 255, 255, 0.25)',
        logoInner: 'rgba(255, 255, 255, 0.18)',
        logoDiamond: '#FFFFFF',
        checkboxBorder: 'rgba(191, 215, 255, 0.55)',
        checkboxActive: '#FFFFFF',
        divider: 'rgba(255, 255, 255, 0.16)',
        socialBg: 'rgba(255, 255, 255, 0.12)',
        socialBorder: 'rgba(255, 255, 255, 0.2)',
        link: '#CFE0FF',
      }
    : {
        text: '#0B1630',
        subtext: 'rgba(22, 39, 74, 0.75)',
        muted: 'rgba(22, 39, 74, 0.6)',
        logoBg: 'rgba(11, 22, 48, 0.08)',
        logoBorder: 'rgba(11, 22, 48, 0.18)',
        logoInner: 'rgba(11, 22, 48, 0.12)',
        logoDiamond: '#0B1630',
        checkboxBorder: 'rgba(11, 22, 48, 0.35)',
        checkboxActive: '#0B1630',
        divider: 'rgba(11, 22, 48, 0.15)',
        socialBg: 'rgba(255, 255, 255, 0.7)',
        socialBorder: 'rgba(11, 22, 48, 0.12)',
        link: '#2D4E9D',
      };
};

/**
 * Returns the color palette for AuthInput component
 */
export const getAuthInputPalette = (isDark: boolean): AuthInputPalette => {
  return isDark
    ? {
        label: 'rgba(229, 239, 255, 0.85)',
        inputBg: 'rgba(255, 255, 255, 0.08)',
        inputBorder: 'rgba(255, 255, 255, 0.18)',
        inputText: '#F5F8FF',
        placeholder: 'rgba(229, 239, 255, 0.5)',
        inputFocusBorder: 'rgba(255, 255, 255, 0.35)',
      }
    : {
        label: 'rgba(22, 39, 74, 0.75)',
        inputBg: 'rgba(255, 255, 255, 0.6)',
        inputBorder: 'rgba(11, 22, 48, 0.2)',
        inputText: '#0B1630',
        placeholder: 'rgba(22, 39, 74, 0.4)',
        inputFocusBorder: 'rgba(11, 22, 48, 0.4)',
      };
};
