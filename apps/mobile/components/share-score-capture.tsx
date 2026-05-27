import { useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { View } from 'react-native';
import { canUseViewShot } from '../lib/share/score-share';

type ViewShotHandle = { capture?: () => Promise<string> };

type ViewShotProps = {
  ref: React.RefObject<ViewShotHandle | null>;
  options: { format: 'png' | 'jpg' | 'webm' | 'raw'; quality: number };
  children: ReactNode;
};

type Props = {
  children: ReactNode;
  onReady: (capture: () => Promise<string | undefined>) => void;
};

/**
 * Mounts react-native-view-shot only when the native module exists.
 * Avoids TurboModule crash on sim builds that haven't linked RNViewShot.
 */
export function ShareScoreCapture({ children, onReady }: Props) {
  const ref = useRef<ViewShotHandle | null>(null);
  const onReadyRef = useRef(onReady);
  useLayoutEffect(() => {
    onReadyRef.current = onReady;
  });
  const [ViewShot, setViewShot] = useState<ComponentType<ViewShotProps> | null>(null);

  useEffect(() => {
    if (!canUseViewShot()) return;
    void import('react-native-view-shot').then((mod) => {
      setViewShot(() => mod.default as ComponentType<ViewShotProps>);
    });
  }, []);

  useEffect(() => {
    if (!ViewShot) return;
    onReadyRef.current(async () => ref.current?.capture?.());
  }, [ViewShot]);

  if (!ViewShot) {
    return <View collapsable={false}>{children}</View>;
  }

  const Shot = ViewShot;
  return (
    <Shot ref={ref} options={{ format: 'png', quality: 1 }}>
      {children}
    </Shot>
  );
}
