import type { CapacitorConfig } from "@capacitor/cli";

// App CLIENT « Wallio » — shell WebView distant.
// Distinct de Wallio Pro (../capacitor.config.ts, com.wallio.merchant).
// server.url = domaine RACINE (pas de chemin) : le fix nov16 impose racine + redirect
// inline côté web. Le web reconnaît ce shell via le User-Agent "WallioClient/1.0"
// et redirige vers /mes-cartes.
const config: CapacitorConfig = {
  appId: "com.wallio.client",
  appName: "Wallio",
  webDir: "public",
  server: {
    url: "https://app.walliocard.com",
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
    // Ajoute un marqueur à l'UA native (champ valide, contrairement à `userAgent`).
    // Le web détecte "WallioClient" et redirige vers /mes-cartes (layout.tsx).
    appendUserAgent: "WallioClient/1.0",
  },
  android: {
    backgroundColor: "#F7F7FA",
    appendUserAgent: "WallioClient/1.0",
  },
};

export default config;
