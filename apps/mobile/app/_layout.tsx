import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../providers/auth-provider';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ title: 'Simulan', headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: 'Mag-login' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="practice/quiz" options={{ title: 'Practice Quiz' }} />
        <Stack.Screen name="practice/result" options={{ title: 'Resulta', headerBackVisible: false }} />
      </Stack>
    </AuthProvider>
  );
}
