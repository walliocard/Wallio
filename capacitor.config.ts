import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wallio.merchant",
  appName: "Wallio Pro",
  webDir: "out",
  server: {
    url: "https://app.walliocard.com/native-launch",
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
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
  android: {
    backgroundColor: "#F7F7FA",
  },
};

export default config;
