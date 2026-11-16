#!/bin/sh
set -e

# Disable Homebrew auto-update to avoid stash/restore messages and speed up CI
export HOMEBREW_NO_AUTO_UPDATE=1

# Install Node.js 20 LTS
brew install node@20 2>/dev/null || true
brew link --force --overwrite node@20 2>/dev/null || true
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Debug: show environment
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo "Dir:  $CI_PRIMARY_REPOSITORY_PATH"

cd "$CI_PRIMARY_REPOSITORY_PATH"

# Install dependencies (npm install is more lenient than npm ci in CI environments)
npm install --legacy-peer-deps

# Sync Capacitor: generates config files + runs pod install
npx cap sync ios
