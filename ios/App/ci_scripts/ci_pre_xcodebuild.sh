#!/bin/sh
set -e

# Set build number juste avant la compilation pour eviter que Xcode Cloud override
# Formule : CI_BUILD_NUMBER + 96 (dernier build reussi = 96, offset pour rester au-dessus)
BUILD_NUMBER=$((CI_BUILD_NUMBER + 96))
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
agvtool new-version -all $BUILD_NUMBER
echo "Build number set to $BUILD_NUMBER"
