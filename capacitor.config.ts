import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tardea.app',
  appName: 'TARDEA.',
  webDir: 'public',
  server: {
    url: 'https://www.tardea.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
  },
}

export default config
