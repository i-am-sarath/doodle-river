import type { CapacitorConfig } from '@capacitor/cli';

// The appId can never change after you publish on the stores. Decide it now.
const config: CapacitorConfig = {
  appId: 'com.sarathramesh.doodleriver',
  appName: 'Doodle River',
  webDir: 'dist/mobile',
  backgroundColor: '#4cb8f0',
  android: { allowMixedContent: false },
  ios: { contentInset: 'never' },
};

export default config;
