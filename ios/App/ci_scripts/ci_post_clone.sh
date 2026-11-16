#!/bin/sh
set -e

# Install Node.js 20 LTS — ignore error if already installed, then link
brew install node@20 2>/dev/null || true
brew link --force --overwrite node@20 2>/dev/null || true
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Log Node/npm versions for debugging
node --version
npm --version

# Install npm dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

# Sync Capacitor: generates config files + runs pod install
npx cap sync ios
