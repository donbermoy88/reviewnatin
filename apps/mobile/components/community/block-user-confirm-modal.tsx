import { useState } from 'react';
import { Alert } from 'react-native';
import { toggleCommunityUserBlock } from '../../lib/api/community';
import { AppSheet } from '../app-sheet';

type Props = {
  visible: boolean;
  userId: string;
  displayName: string;
  onClose: () => void;
  onBlocked: () => void;
};

export function BlockUserConfirmModal({ visible, userId, displayName, onClose, onBlocked }: Props) {
  const [blocking, setBlocking] = useState(false);

  const close = () => {
    if (blocking) return;
    onClose();
  };

  const confirm = async () => {
    if (blocking) return;
    setBlocking(true);
    try {
      await toggleCommunityUserBlock(userId);
      onClose();
      onBlocked();
    } catch {
      Alert.alert('Could not block', 'Please try again.');
    } finally {
      setBlocking(false);
    }
  };

  return (
    <AppSheet
      visible={visible}
      title={`Block ${displayName}?`}
      subtitle="They won't see your posts, and you won't see theirs. You can unblock anytime from Safety Settings."
      onClose={close}
      actions={[
        { label: blocking ? 'Blocking…' : 'Block', destructive: true, onPress: () => void confirm() },
        { label: 'Cancel', variant: 'outline', onPress: close },
      ]}
    />
  );
}
