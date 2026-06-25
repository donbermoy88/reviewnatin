import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { ReportContentModal } from './report-content-modal';

type Props = {
  uri: string;
  postId: string;
  height?: number;
};

/** Tappable post image — opens a fullscreen modal, same pattern as components/question-image.tsx. */
export function PostImage({ uri, postId, height = 180 }: Props) {
  const { colors, radii } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Post image — tap to enlarge"
      >
        <Image
          source={{ uri }}
          style={{ width: '100%', height, borderRadius: radii.md, backgroundColor: colors.background }}
          resizeMode="cover"
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={styles.modalBg} onPress={() => setOpen(false)}>
          <Image
            source={{ uri }}
            style={styles.modalImage}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Post image — full screen"
          />
          <Pressable
            onPress={() => setReportVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Report this image"
            style={styles.reportButton}
          >
            <Ionicons name="flag-outline" size={20} color={colors.surface} />
          </Pressable>
        </Pressable>
      </Modal>

      <ReportContentModal
        visible={reportVisible}
        targetType="image"
        targetId={postId}
        onClose={() => setReportVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  reportButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
