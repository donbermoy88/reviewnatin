import { WebView } from '@expo/dom-webview';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { getTurnstileSiteKey } from '../lib/auth/turnstile-config';

type Props = {
  onToken: (token: string | null) => void;
  /** Increment to reload the widget (e.g. after a failed signup). */
  resetKey?: number;
};

function buildTurnstileHtml(siteKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad" async defer></script>
  <style>
    html, body { margin: 0; padding: 0; background: transparent; }
    #turnstile { display: flex; justify-content: center; min-height: 65px; }
  </style>
</head>
<body>
  <div id="turnstile"></div>
  <script>
    function post(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    function onTurnstileLoad() {
      turnstile.render('#turnstile', {
        sitekey: ${JSON.stringify(siteKey)},
        callback: function(token) { post({ type: 'token', token: token }); },
        'error-callback': function() { post({ type: 'error' }); },
        'expired-callback': function() { post({ type: 'expired' }); },
      });
    }
  </script>
</body>
</html>`;
}

export function TurnstileCaptcha({ onToken, resetKey = 0 }: Props) {
  const siteKey = getTurnstileSiteKey();
  const source = useMemo(() => {
    if (!siteKey) return null;
    const html = buildTurnstileHtml(siteKey);
    return { uri: `data:text/html;charset=utf-8,${encodeURIComponent(html)}` };
  }, [siteKey, resetKey]);

  if (!source) return null;

  return (
    <View style={styles.container} accessibilityLabel="Security verification">
      <WebView
        key={resetKey}
        source={source}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as {
              type?: string;
              token?: string;
            };
            if (payload.type === 'token' && payload.token) {
              onToken(payload.token);
              return;
            }
            if (payload.type === 'expired' || payload.type === 'error') {
              onToken(null);
            }
          } catch {
            onToken(null);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    marginVertical: 8,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    minHeight: 72,
    backgroundColor: 'transparent',
  },
});
