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
      backgroundColor: "#F5F5F7",
      showSpinner: false,
      androidSplashResourceName: "splash",
      iosSplashResourceName: "Splash",
    },
    StatusBar: {
      style: "Default",
      backgroundColor: "#F5F5F7",
      overlaysWebView: false,
    },
  },
  ios: {
    contentInset: "always",
    scrollEnabled: true,
    backgroundColor: "#F5F5F7",
  },
  android: {
    backgroundColor: "#F5F5F7",
  },
};

export default config;
