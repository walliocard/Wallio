#!/bin/sh
set -e

# Build number = timestamp Unix (toujours croissant, jamais en conflit)
BUILD_NUMBER=$(date +%s)
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
agvtool new-version -all $BUILD_NUMBER
echo "Build number set to $BUILD_NUMBER"
