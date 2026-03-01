import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jagokasir.app',
  appName: 'JagoKasir',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
