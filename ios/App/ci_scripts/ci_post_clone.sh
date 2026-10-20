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
