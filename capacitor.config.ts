import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The iOS app loads the live KopyCat site and adds native features
 * (NFC, QR, Contacts, share sheet, Sign in with Apple) in the shell.
 * The website at https://www.kopycat.app keeps deploying on its own.
 * `server.url` is how this server-rendered app stays in sync with production.
 */
const config: CapacitorConfig = {
  appId: "app.kopycat",
  appName: "KopyCat",
  webDir: "native/www",
  server: {
    url: "https://www.kopycat.app/dashboard",
    cleartext: false,
    allowNavigation: ["www.kopycat.app", "kopycat.app"],
    errorPath: "offline.html",
  },
  ios: {
    contentInset: "never",
    backgroundColor: "#f5f0e6",
    limitsNavigationsToAppBoundDomains: true,
    appendUserAgent: "KopyCatIOS",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#f5f0e6",
      showSpinner: false,
      launchFadeOutDuration: 200,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#f5f0e6",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "body",
    },
  },
};

export default config;
