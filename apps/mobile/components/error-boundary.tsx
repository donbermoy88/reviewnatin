import { Component, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { colors as lightColors } from '@reviewnatin/shared';
import { darkColors } from '../constants/dark-theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

// This boundary wraps everything, including the providers that back useAppTheme
// (FontProvider/AuthProvider/PreferencesProvider) — if one of those throws, the
// boundary renders without them mounted. So the fallback can't call useAppTheme()
// and must pick colors directly. It prefers the user's saved in-app dark-mode
// toggle (persisted under 'reviewnatin:prefs') and only falls back to the OS
// setting when no preference has been saved yet.
function ErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const systemDark = useColorScheme() === 'dark';
  const [savedDark, setSavedDark] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem('reviewnatin:prefs');
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as { darkMode?: boolean };
        if (typeof parsed.darkMode === 'boolean') setSavedDark(parsed.darkMode);
      } catch {
        // Ignore — fall back to the system setting.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDark = savedDark ?? systemDark;
  const colors = isDark ? darkColors : lightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Something went wrong 😓</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>
        {error.message || 'This screen could not be loaded.'}
      </Text>
      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onRetry}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    Sentry.captureException(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ error: null })} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
