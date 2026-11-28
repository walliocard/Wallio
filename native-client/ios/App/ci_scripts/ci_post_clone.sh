#!/bin/sh
set -e

# Xcode Cloud — post-clone pour l'app CLIENT « Wallio » (native-client/).
# Distinct du script de Wallio Pro (../../../ios/App/ci_scripts).

# Désactive l'auto-update Homebrew (plus rapide, pas de messages stash/restore)
export HOMEBREW_NO_AUTO_UPDATE=1

# Node.js 20 LTS (le CLI Capacitor 7.6.9 tourne sur Node 20 ; le CLI 8 exigerait Node 22)
brew install node@20 2>/dev/null || true
brew link --force --overwrite node@20 2>/dev/null || true
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo "Dir:  $CI_PRIMARY_REPOSITORY_PATH"

# Le projet client vit dans le sous-dossier native-client/ du repo
cd "$CI_PRIMARY_REPOSITORY_PATH/native-client"

# Dépendances du sous-projet client (npm install plus tolérant que npm ci en CI)
npm install --legacy-peer-deps

# Sync Capacitor : régénère la config + pod install
npx cap sync ios
