import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

type Props = {
  uri: string;
};

/**
 * Displays an inline question image (diagram, abstract-reasoning pattern, etc.)
 * Tapping opens a full-screen modal for closer inspection.
 */
export function QuestionImage({ uri }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={styles.wrapper}
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Question diagram — tap to enlarge"
        accessibilityHint="Opens a full-screen view of the image"
      >
        {!loaded && (
          <View style={styles.placeholder}>
            <ActivityIndicator size="small" color="#1e4fd9" />
          </View>
        )}
        <Image
          source={{ uri }}
          style={[styles.image, !loaded && styles.hidden]}
          resizeMode="contain"
          onLoad={() => setLoaded(true)}
          accessibilityRole="image"
          accessibilityLabel="Question diagram"
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalBg} onPress={() => setOpen(false)}>
          <Image
            source={{ uri }}
            style={styles.modalImage}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Question diagram — full screen"
          />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 200,
  },
  hidden: {
    opacity: 0,
  },
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
});
