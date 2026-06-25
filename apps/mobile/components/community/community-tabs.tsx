import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import type { CommunityScope } from '../../lib/api/community';

const TABS: { scope: CommunityScope; label: string }[] = [
  { scope: 'all', label: 'All Posts' },
  { scope: 'mine', label: 'My Posts' },
  { scope: 'saved', label: 'Saved' },
];

type Props = {
  scope: CommunityScope;
  onChange: (scope: CommunityScope) => void;
};

export function CommunityTabs({ scope, onChange }: Props) {
  const { colors, fonts, spacing } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', gap: spacing.lg }}>
      {TABS.map((tab) => {
        const active = tab.scope === scope;
        return (
          <Pressable
            key={tab.scope}
            onPress={() => onChange(tab.scope)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{
              paddingVertical: 6,
              borderBottomWidth: 2,
              borderBottomColor: active ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: active ? fonts.bodyBold : fonts.bodyMedium,
                fontSize: 13,
                color: active ? colors.primary : colors.textMuted,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
