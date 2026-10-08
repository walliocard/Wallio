#!/bin/sh
set -e

# Install npm dependencies (required by Capacitor Podfile)
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

# Install CocoaPods dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
pod install
