import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SvgUri } from 'react-native-svg';

type Props = {
  uri: string;
};

/**
 * Displays an inline question image (diagram, abstract-reasoning pattern, etc.)
 * Tapping opens a full-screen modal for closer inspection.
 * Supports both raster images (PNG/JPEG) and SVG files.
 */
export function QuestionImage({ uri }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const isSvg = uri.toLowerCase().includes('.svg') || uri.toLowerCase().includes('svg');

  return (
    <>
      <Pressable
        style={styles.wrapper}
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Question diagram — tap to enlarge"
        accessibilityHint="Opens a full-screen view of the image"
      >
        {isSvg ? (
          <SvgUri
            uri={uri}
            width="100%"
            height={220}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        ) : (
          <>
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
          </>
        )}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalBg} onPress={() => setOpen(false)}>
          {isSvg ? (
            <SvgUri
              uri={uri}
              width="100%"
              height="80%"
            />
          ) : (
            <Image
              source={{ uri }}
              style={styles.modalImage}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Question diagram — full screen"
            />
          )}
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
    backgroundColor: '#f0f4ff',
    minHeight: 180,
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
    height: 220,
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
