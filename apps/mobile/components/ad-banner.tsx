import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../hooks/use-app-theme';
import { getAdMobConfig } from '../lib/ads/config';
import { resolveMonthlyPlusDisplay } from '../lib/subscription/pricing-display';
import { useEntitlements } from '../providers/entitlements-provider';

type Props = {
  onPress?: () => void;
};

function GoogleBannerAd({
  unitId,
  onFallback,
  monthlyPrice,
}: {
  unitId: string;
  onFallback: () => void;
  monthlyPrice: string;
}) {
  const theme = useAppTheme();
  const { spacing } = theme;
  const [failed, setFailed] = useState(false);
  const [BannerAd, setBannerAd] = useState<typeof import('react-native-google-mobile-ads').BannerAd | null>(null);
  const [bannerSize, setBannerSize] = useState<typeof import('react-native-google-mobile-ads').BannerAdSize | null>(null);

  useEffect(() => {
    void import('react-native-google-mobile-ads')
      .then((mod) => {
        setBannerAd(() => mod.BannerAd);
        setBannerSize(mod.BannerAdSize);
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <UpgradePrompt onPress={onFallback} monthlyPrice={monthlyPrice} />;
  if (!BannerAd || !bannerSize) return null;

  return (
    <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, alignItems: 'center' }}>
      <BannerAd
        unitId={unitId}
        size={bannerSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

function UpgradePrompt({ onPress, monthlyPrice }: { onPress: () => void; monthlyPrice: string }) {
  const theme = useAppTheme();
  const { colors, spacing, fonts } = theme;
  const adConfig = getAdMobConfig();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="View ReviewNatin Plus plans — no ads"
      style={{
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          backgroundColor: colors.accentLight,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
      >
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: colors.accentDark }}>FREE</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text }}>
          {adConfig.enabled ? 'Sponsored · Go ad-free with Plus' : 'Go ad-free with Plus'}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          From {monthlyPrice}/mo · best value 6 months
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary }}>View →</Text>
    </Pressable>
  );
}

/** Free-tier banner — Google BannerAd when configured, else Plus upgrade CTA. */
export function AdBanner({ onPress }: Props) {
  const router = useRouter();
  const adConfig = getAdMobConfig();
  const { isPremium, products, storePrices } = useEntitlements();
  const monthlyPrice = resolveMonthlyPlusDisplay(products, storePrices);

  // Defense-in-depth: never render a banner (ad or upgrade CTA) for a Plus
  // member, even if a call site forgets to gate on entitlement. Exam-pass
  // scoping stays at the call site since it is exam-specific.
  if (isPremium()) return null;

  const openSubscribe = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push('/subscribe');
  };

  if (adConfig.bannerUnitId) {
    return <GoogleBannerAd unitId={adConfig.bannerUnitId} onFallback={openSubscribe} monthlyPrice={monthlyPrice} />;
  }

  return <UpgradePrompt onPress={openSubscribe} monthlyPrice={monthlyPrice} />;
}
