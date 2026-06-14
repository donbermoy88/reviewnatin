const { withXcodeProject } = require('@expo/config-plugins');

const ALWAYS_RUN_SCRIPT_NAMES = new Set([
  '[Expo Dev Launcher] Strip Local Network Keys for Release',
  '[CP-User] [RNGoogleMobileAds] Configuration',
]);

function unquote(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/^"|"$/g, '');
}

module.exports = function withXcodeRunScriptPolicies(config) {
  return withXcodeProject(config, (configWithProject) => {
    const phases =
      configWithProject.modResults.hash.project.objects.PBXShellScriptBuildPhase ?? {};

    for (const phase of Object.values(phases)) {
      if (!phase || typeof phase !== 'object') continue;
      const name = unquote(phase.name);
      if (ALWAYS_RUN_SCRIPT_NAMES.has(name)) {
        phase.alwaysOutOfDate = '1';
      }
    }

    return configWithProject;
  });
};
