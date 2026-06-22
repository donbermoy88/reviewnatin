export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'Please enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export { validatePasswordStrength as validatePassword } from './password-strength';

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

export function normalizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validateDisplayName(name: string): string | null {
  const normalized = normalizeDisplayName(name);
  if (!normalized) return 'Please enter a display name.';
  if (normalized.length < 2) return 'Display name must be at least 2 characters.';
  if (normalized.length > 40) return 'Display name must be 40 characters or less.';
  if (!/^[\p{L}\p{N}._\-'\s]+$/u.test(normalized)) {
    return 'Only letters, numbers, spaces, and . _ - are allowed.';
  }
  return null;
}
