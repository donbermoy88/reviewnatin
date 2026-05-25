/** Map Supabase auth errors to user-friendly Taglish messages */
export function mapAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Mali ang email o password. Subukan ulit.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'May account na sa email na ito. Mag-login na lang.';
  }
  if (m.includes('email not confirmed')) {
    return 'I-confirm muna ang email mo bago mag-login. Check ang inbox mo.';
  }
  if (m.includes('password') && m.includes('weak')) {
    return 'Mahina ang password. Gumamit ng mas mahaba at unique na password.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Masyadong maraming attempts. Subukan ulit after a few minutes.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Walang connection sa server. Check ang internet mo.';
  }
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) {
    return 'Google Sign-In hindi pa naka-enable sa Supabase. Run: npm run supabase:google';
  }
  if (m.includes('redirect_uri_mismatch')) {
    return 'Mali ang redirect URI. Run npm run supabase:google at i-update ang Google Cloud OAuth client.';
  }

  return message;
}
