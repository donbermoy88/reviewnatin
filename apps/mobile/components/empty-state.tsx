import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { createEmptyStateStyles } from '../lib/themed-styles';
import { PrimaryButton } from './primary-button';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createEmptyStateStyles(theme), [theme]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  );
}
