import { View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { Skeleton } from '../skeleton';

export function CommunityLoadingState() {
  const { spacing } = useAppTheme();

  return (
    <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={120} radius={14} />
      ))}
    </View>
  );
}
