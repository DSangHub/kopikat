import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.kopycat',
  appName: 'KopyCat',
  webDir: 'out',
  server: {
    url: 'https://kopycat.app',
    cleartext: false,
  },
};

export default config;
