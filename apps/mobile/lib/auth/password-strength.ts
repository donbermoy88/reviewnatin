export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export type PasswordStrengthResult = {
  score: PasswordStrength;
  label: string;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
  };
};

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  let score: PasswordStrength = 'weak';
  let label = 'Mahina pa';

  if (passed >= 4) {
    score = 'strong';
    label = 'Malakas';
  } else if (passed >= 3) {
    score = 'good';
    label = 'Okay na';
  } else if (passed >= 2) {
    score = 'fair';
    label = 'Pwede pa';
  }

  return { score, label, checks };
}

export function validatePasswordStrength(password: string, isSignUp = false): string | null {
  if (!password) return 'Please enter your password.';
  if (isSignUp && password.length < 8) {
    return 'For sign-up, use at least 8 characters.';
  }
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (isSignUp) {
    const { checks } = evaluatePasswordStrength(password);
    if (!checks.hasUpper || !checks.hasLower || !checks.hasNumber) {
      return 'Use uppercase, lowercase, and a number for a stronger password.';
    }
  }
  return null;
}
