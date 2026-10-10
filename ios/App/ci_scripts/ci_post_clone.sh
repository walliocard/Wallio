#!/bin/sh
set -e

# Install Node.js (not available by default on Xcode Cloud)
brew install node

# Install npm dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

# Sync Capacitor: generates config files + runs pod install
npx cap sync ios
