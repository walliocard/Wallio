#!/bin/sh
set -e

# Install Node.js 20 LTS (matches local dev environment — avoids npm 11 lockfile strictness)
brew install node@20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"

# Install npm dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

# Sync Capacitor: generates config files + runs pod install
npx cap sync ios

# Build number = CI run + 71 pour rester au-dessus des anciens builds TestFlight
BUILD_NUMBER=$((CI_BUILD_NUMBER + 71))
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
agvtool new-version -all $BUILD_NUMBER
