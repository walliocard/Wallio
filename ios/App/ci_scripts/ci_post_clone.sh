#!/bin/sh
set -e

cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"

# Install CocoaPods if not available
if ! command -v pod &> /dev/null; then
  gem install cocoapods --no-document
fi

pod install
