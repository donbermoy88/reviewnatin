import { useRouter } from 'expo-router';
import { AppSheet } from '../app-sheet';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Shown before posting/commenting when the user hasn't accepted the current
 *  Community Guidelines version yet. */
export function CommunityGuidelinesModal({ visible, onClose }: Props) {
  const router = useRouter();

  return (
    <AppSheet
      visible={visible}
      title="Community Guidelines"
      subtitle="Before posting, please review and accept our Community Guidelines."
      onClose={onClose}
      actions={[
        {
          label: 'View Guidelines',
          onPress: () => {
            onClose();
            router.push('/community/guidelines');
          },
        },
        { label: 'Cancel', variant: 'outline', onPress: onClose },
      ]}
    />
  );
}
