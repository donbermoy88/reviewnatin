/** Supabase returns this when sign-in is blocked pending email verification. */
export function isEmailNotConfirmedError(message: string): boolean {
  return message.toLowerCase().includes('email not confirmed');
}

/** Map Supabase auth errors to user-friendly Taglish messages. */
export function mapAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Mali ang email o password. Pakisubukan ulit.';
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'May account na gamit ang email na ito. Mag-log in na lang.';
  }
  if (m.includes('email not confirmed')) {
    return 'I-verify muna ang email bago mag-log in. Tingnan ang inbox mo.';
  }
  if (m.includes('token has expired') || m.includes('otp_expired')) {
    return 'Expired na ang verification code. Humingi ng bagong code.';
  }
  if (m.includes('invalid otp') || m.includes('invalid token')) {
    return 'Mali ang verification code. Pakicheck at subukan ulit.';
  }
  if (m.includes('password') && m.includes('weak')) {
    return 'Masyadong mahina ang password. Gumamit ng mas mahaba at unique na password.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Masyadong maraming attempt. Subukan ulit pagkalipas ng ilang minuto.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Walang koneksyon sa server. Pakicheck ang internet connection mo.';
  }
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) {
    return 'Hindi pa naka-enable ang Google Sign-In. Pakisubukan ulit mamaya.';
  }
  if (m.includes('redirect_uri_mismatch')) {
    return 'May problema sa Google Sign-In setup. Pakisubukan ulit mamaya.';
  }

  return message;
}
