# Upgrade Notes

## Current SDK Version: Expo SDK 49

The project currently uses Expo SDK 49, which targets Android API level 33.

### Google Play Store Requirement

**Important:** As of August 31, 2024, Google Play Store requires apps to target Android API level 34 or higher.

- **Current status:** SDK 49 targets API 33 (not compatible with Play Store submission)
- **Required for Play Store:** Upgrade to Expo SDK 50 or later
- **APK sideloading:** Works fine with current SDK

### When to Upgrade

You should upgrade to SDK 50+ if:
- ✅ You plan to publish to Google Play Store
- ✅ You want the latest Android features and security updates
- ✅ You need compatibility with newer Android versions

You can delay upgrading if:
- ⏸️ You only distribute APKs via direct download (sideloading)
- ⏸️ You're not ready to test with the new SDK
- ⏸️ Your dependencies aren't compatible with SDK 50 yet

### How to Upgrade to SDK 50+

When you're ready to upgrade:

```bash
# Upgrade to latest Expo SDK
npx expo install expo@latest

# Update all dependencies to match new SDK
npx expo install --fix

# Update EAS Build configuration if needed
npx expo-doctor

# Test the app thoroughly
npm start
```

**Important:** Major SDK upgrades can introduce breaking changes. Test thoroughly after upgrading.

### Current Configuration

The project is configured for SDK 49:
- Android: API level 33
- React Native: 0.72.10
- Expo: ~49.0.18

### Links

- [Expo SDK 50 Release Notes](https://blog.expo.dev/expo-sdk-50-is-here-3d4bcb5f)
- [Expo SDK Upgrade Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Google Play Store Requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
