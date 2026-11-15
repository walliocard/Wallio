import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wallio.merchant",
  appName: "Wallio Pro",
  webDir: "out",
  server: {
    url: "https://app.walliocard.com/dashboard",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#FFFFFF",
      showSpinner: false,
      androidSplashResourceName: "splash",
      iosSplashResourceName: "Splash",
    },
    StatusBar: {
      style: "Default",
      backgroundColor: "#FFFFFF",
      overlaysWebView: true,
    },
  },
  ios: {
    contentInset: "never",
    scrollEnabled: true,
    backgroundColor: "#FFFFFF",
  },
  android: {
    backgroundColor: "#FFFFFF",
  },
};

export default config;
