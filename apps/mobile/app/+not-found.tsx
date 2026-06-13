import { Redirect, usePathname } from 'expo-router';

export default function NotFoundRoute() {
  const pathname = usePathname();

  if (pathname === '/tutor' || pathname === '/ai-tutor') {
    return <Redirect href="/subscribe" />;
  }

  return <Redirect href="/(tabs)" />;
}
