/** Map Supabase auth errors to user-friendly English messages */
export function mapAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'An account already exists with this email. Try logging in instead.';
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email before logging in. Check your inbox.';
  }
  if (m.includes('password') && m.includes('weak')) {
    return 'Password is too weak. Use a longer, more unique password.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Too many attempts. Please try again in a few minutes.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'No connection to server. Check your internet connection.';
  }
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) {
    return 'Google Sign-In is not yet enabled on Supabase. Run: npm run supabase:google';
  }
  if (m.includes('redirect_uri_mismatch')) {
    return 'Redirect URI mismatch. Run npm run supabase:google and update the Google Cloud OAuth client.';
  }

  return message;
}
