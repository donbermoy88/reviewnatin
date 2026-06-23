import { InteractionManager } from 'react-native';

/** Run non-critical work after the first paint / navigation transition. */
export function runAfterInteractions(task: () => void | Promise<void>): { cancel: () => void } {
  const handle = InteractionManager.runAfterInteractions(() => {
    void task();
  });
  return { cancel: () => handle.cancel() };
}
