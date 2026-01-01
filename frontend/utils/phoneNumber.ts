/**
 * Formats a phone number as user types
 * Formats as (XXX) XXX-XXXX
 * @param value - Raw phone number string
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Strip all non-numeric characters
  const cleaned = ('' + value).replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }

  // Partial formatting as user types
  if (cleaned.length > 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length > 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length > 0) {
    return `(${cleaned}`;
  }

  return value;
}
