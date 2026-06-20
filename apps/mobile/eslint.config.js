import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  ...expoConfig,
  {
    ignores: ['node_modules/', 'dist/', '.expo/'],
  },
  {
    rules: {
      // Existing screens load data in useEffect — tighten incrementally
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      // Reanimated shared values are intentionally mutated via `.value` outside render
      'react-hooks/immutability': 'off',
    },
  },
]);
