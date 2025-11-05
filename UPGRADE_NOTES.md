# Upgrade Notes

## Current SDK Version: Expo SDK 51 ✅

The project uses Expo SDK 51, which targets Android API level 34.

### Google Play Store Requirement

**Status:** ✅ **Ready for Play Store submission!**

As of August 31, 2024, Google Play Store requires apps to target Android API level 34 or higher.

- **Current status:** SDK 51 targets API 34+ ✅ (compatible with Play Store submission)
- **Upgraded from:** SDK 49 (API 33)
- **APK sideloading:** Works perfectly

### Upgrade History

**November 2024:** Upgraded from SDK 49 to SDK 51
- **Reason:** Prepare for Google Play Store submission (requires API 34+)
- **Process:** Used `--legacy-peer-deps` to resolve webpack-config peer dependency conflicts
- **Breaking changes:** Updated React Native from 0.72.10 to 0.74.5, expo-router from 2.x to 3.x
- **Testing:** All expo-doctor checks pass (16/16)

### Current Configuration

The project is configured for SDK 51:
- Android: API level 34+ ✅
- React Native: 0.74.5
- Expo: ~51.0.0
- Expo Router: ~3.5.24

### Future Upgrades

To upgrade to future SDK versions:

```bash
# Upgrade to latest Expo SDK
npm install expo@~52.0.0 --legacy-peer-deps

# Update all dependencies to match new SDK
npm install --legacy-peer-deps [package list from expo install --fix output]

# Verify everything is compatible
npx expo-doctor

# Test the app thoroughly
npm start
```

**Note:** Use `--legacy-peer-deps` if you encounter peer dependency conflicts with @expo/webpack-config.

### Links

- [Expo SDK 50 Release Notes](https://blog.expo.dev/expo-sdk-50-is-here-3d4bcb5f)
- [Expo SDK Upgrade Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Google Play Store Requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
