import { routeFromNativeIntentPath } from '../lib/deep-link-routes';

/**
 * Native cold-start URL normalization for Expo Router.
 *
 * Android launches `MainActivity` with raw URLs such as
 * `reviewnatin://subscribe`. Without this hook, Expo Router can try to match
 * the raw URL as a filesystem route before `DeepLinkHandler` mounts, causing
 * cold links to hang on the root spinner or show `Unmatched Route`.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return routeFromNativeIntentPath(path);
  } catch {
    return '/';
  }
}
