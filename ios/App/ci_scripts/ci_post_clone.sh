#!/bin/sh
set -e

KEYCHAIN_NAME="wallio_ci"
KEYCHAIN_PASSWORD="wallio_ci_pass"
CERT_PATH="/tmp/distribution.p12"
PROFILE_PATH="/tmp/wallio.mobileprovision"

security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME.keychain"
security default-keychain -s "$KEYCHAIN_NAME.keychain"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME.keychain"
security set-keychain-settings -t 3600 -u "$KEYCHAIN_NAME.keychain"

echo "$CERTIFICATE_BASE64" | base64 --decode > "$CERT_PATH"
security import "$CERT_PATH" -k "$KEYCHAIN_NAME.keychain" -P "$CERTIFICATE_PASSWORD" -T /usr/bin/codesign -T /usr/bin/security
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_NAME.keychain"

echo "$PROVISIONING_PROFILE_BASE64" | base64 --decode > "$PROFILE_PATH"
mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
cp "$PROFILE_PATH" ~/Library/MobileDevice/Provisioning\ Profiles/

rm -f "$CERT_PATH" "$PROFILE_PATH"
echo "Signing setup done."
