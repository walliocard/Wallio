#!/bin/sh
set -e

# Install Node.js (not available by default on Xcode Cloud)
brew install node

# Install npm dependencies (required by Capacitor Podfile)
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

# Install CocoaPods dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
pod install
