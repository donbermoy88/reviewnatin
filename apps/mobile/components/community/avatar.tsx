import { Image, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';

type Props = { url: string | null; name: string; size?: number };

export function Avatar({ url, name, size = 40 }: Props) {
  const { colors, fonts } = useAppTheme();
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: size * 0.36, color: '#fff' }}>
        {name[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}
