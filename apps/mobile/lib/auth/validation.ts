export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'Ilagay ang email mo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Hindi valid ang email address.';
  }
  return null;
}

export function validatePassword(password: string, isSignUp = false): string | null {
  if (!password) return 'Ilagay ang password mo.';
  if (password.length < 6) return 'Dapat at least 6 characters ang password.';
  if (isSignUp && password.length < 8) {
    return 'Para sa sign-up, gamitin ang at least 8 characters.';
  }
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Hindi mag-match ang password at confirmation.';
  return null;
}

export function normalizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validateDisplayName(name: string): string | null {
  const normalized = normalizeDisplayName(name);
  if (!normalized) return 'Ilagay ang display name mo.';
  if (normalized.length < 2) return 'Dapat at least 2 characters ang display name.';
  if (normalized.length > 40) return 'Maximum 40 characters lang ang display name.';
  if (!/^[\p{L}\p{N}._\-'\s]+$/u.test(normalized)) {
    return 'Letters, numbers, spaces, at . _ - lang ang allowed.';
  }
  return null;
}
