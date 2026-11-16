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
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#F7F7FA",
      showSpinner: false,
      androidSplashResourceName: "splash",
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#F7F7FA",
      overlaysWebView: true,
    },
  },
  ios: {
    contentInset: "never",
    scrollEnabled: true,
    backgroundColor: "#F7F7FA",
  },
  android: {
    backgroundColor: "#F7F7FA",
  },
};

export default config;
