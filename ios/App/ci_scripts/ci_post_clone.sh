#!/bin/sh
set -e

# Install Node.js
brew install node

# Install npm dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

# Sync Capacitor (runs pod install)
npx cap sync ios

# Import distribution certificate
KEYCHAIN_NAME="wallio_ci"
KEYCHAIN_PASSWORD="wallio_ci_pass"
CERT_PATH="/tmp/distribution.p12"
CERT_PWD=$(printf '%s' "$CERTIFICATE_PASSWORD" | tr -d '[:space:]')

security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME.keychain" 2>/dev/null || true
security default-keychain -s "$KEYCHAIN_NAME.keychain"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME.keychain"
security set-keychain-settings -t 3600 -u "$KEYCHAIN_NAME.keychain"

printf '%s' "$CERTIFICATE_BASE64" | base64 --decode > "$CERT_PATH"
security import "$CERT_PATH" -k "$KEYCHAIN_NAME.keychain" -P "$CERT_PWD" -T /usr/bin/codesign -T /usr/bin/security -A
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME.keychain"

# Install provisioning profile
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
printf '%s' "$PROVISIONING_PROFILE_BASE64" | base64 --decode > "$HOME/Library/MobileDevice/Provisioning Profiles/wallio.mobileprovision"

rm -f "$CERT_PATH"
echo "Signing setup done."
