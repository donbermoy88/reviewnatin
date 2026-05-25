/** Sign out and leave authenticated areas — gate refresh + login screen. */
export async function signOutAndRedirect(
  signOut: () => Promise<void>,
  refreshOnboarding: () => Promise<boolean>,
  router: { replace: (href: string) => void }
): Promise<void> {
  await signOut();
  await refreshOnboarding();
  router.replace('/(auth)/login');
}
