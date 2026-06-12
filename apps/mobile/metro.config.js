// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// ---------------------------------------------------------------------------
// Hermes production-bundle fix (TestFlight / App Store builds).
//
// @supabase/supabase-js's ESM entry (dist/index.mjs) does an OPTIONAL tracing
// import — `import("@opentelemetry/api")` — that returns null when OTel isn't
// installed. We don't install OpenTelemetry, so Metro keeps the raw `import()`
// in the bundle and Hermes fails to compile it ("Invalid expression
// encountered"), breaking `eas build --profile production` and every store build.
//
// The package's CommonJS entry (dist/index.cjs) loads the same optional tracing
// via `require(...)` instead, which Hermes compiles fine. Force Metro to resolve
// supabase-js to its CJS entry. Targeted to one package; no node_modules edits.
// ---------------------------------------------------------------------------
const supabaseCjs = require.resolve('@supabase/supabase-js/dist/index.cjs', {
  paths: [__dirname],
});

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@supabase/supabase-js') {
    return { type: 'sourceFile', filePath: supabaseCjs };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
