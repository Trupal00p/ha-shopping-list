# Release Guide - Automated APK Builds

This guide explains how to use the GitHub Actions workflow to automatically build and release Android APKs for the HA Shopping List app.

## Prerequisites

Before you can use the automated build system, you need to set up your Expo account and GitHub repository.

### 1. Create an Expo Account

If you don't have one already:
1. Go to https://expo.dev/
2. Sign up for a free account
3. Verify your email address

### 2. Install EAS CLI Locally (Optional, for testing)

```bash
npm install -g eas-cli
eas login
```

### 3. Generate an Expo Access Token

1. Log in to https://expo.dev/
2. Go to **Account Settings** → **Access Tokens**
   - Direct link: https://expo.dev/accounts/[your-username]/settings/access-tokens
3. Click **Create Token**
4. Give it a descriptive name: `GitHub Actions - HA Shopping List`
5. **Copy the token immediately** - you won't be able to see it again!

### 4. Add Token to GitHub Repository

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste the token you copied from Expo
6. Click **Add secret**

## Creating a Release

### Method 1: Automatic Build on Release Creation (Recommended)

This is the easiest way to create a release with an APK.

1. **Go to your repository on GitHub**
2. **Click the "Releases" section** (in the right sidebar)
3. **Click "Draft a new release"**
4. **Create a new tag:**
   - Click "Choose a tag"
   - Type a new version tag, e.g., `v1.0.0`, `v1.1.0`, etc.
   - Click "Create new tag: v1.0.0 on publish"
5. **Fill in release details:**
   - Release title: e.g., "Version 1.0.0 - Multi-list support"
   - Description: List the new features, bug fixes, and changes
6. **Click "Publish release"**

The workflow will automatically:
- Trigger within seconds
- Build the APK using EAS Build (takes 10-15 minutes)
- Download the APK
- Attach it to your release as `ha-shopping-list-v1.0.0.apk`

### Method 2: Manual Workflow Trigger

If you need to rebuild a specific release or run the build manually:

1. **Go to the "Actions" tab** in your repository
2. **Select "Build and Release APK"** from the workflows list
3. **Click "Run workflow"** (button on the right)
4. **Enter the tag name** of an existing release (e.g., `v1.0.0`)
5. **Click "Run workflow"** button

The workflow will build and attach the APK to the specified release.

## Monitoring the Build

### View Build Progress

1. Go to the **Actions** tab in your repository
2. Click on the running workflow
3. Watch the progress in real-time

### Build Steps

The workflow performs these steps:
1. **Checkout repository** - Downloads your code
2. **Setup Node.js** - Installs Node.js 20
3. **Setup EAS** - Installs EAS CLI and authenticates
4. **Install dependencies** - Runs `npm ci`
5. **Build Android APK** - Uses EAS Build (takes 10-15 minutes)
6. **Get latest build info** - Retrieves the build artifact URL
7. **Download APK** - Downloads the built APK file
8. **Upload APK to release** - Attaches it to the GitHub release

### Build Time

- **Total time:** ~15-20 minutes
- **Most time spent:** EAS Build compilation (10-15 min)
- **GitHub Actions time:** ~5 minutes

## Troubleshooting

### Build Fails with "Authentication Error"

**Problem:** EAS can't authenticate with your Expo account

**Solution:**
1. Verify your `EXPO_TOKEN` secret is set correctly
2. Generate a new token and update the secret
3. Make sure the token hasn't expired

### Build Fails with "Project not found"

**Problem:** EAS doesn't recognize your project

**Solution:**
1. Check that `app.json` has the correct `extra.eas.projectId`
2. If missing, run locally: `eas build:configure`
3. Commit the updated `app.json`

### APK Not Attached to Release

**Problem:** Build succeeds but APK isn't on the release page

**Solution:**
1. Check the workflow logs for the "Upload APK to release" step
2. Verify the release exists before the workflow runs
3. For manual runs, make sure you entered the correct tag name
4. Check that the `GITHUB_TOKEN` has write permissions

### Build Fails During Compilation

**Problem:** The APK build itself fails

**Solution:**
1. Check the EAS Build logs (link provided in workflow output)
2. Common issues:
   - Missing dependencies in `package.json`
   - Incompatible package versions
   - Invalid configuration in `app.json` or `eas.json`
3. Test the build locally: `eas build --platform android --profile preview`

### Node Version Errors

**Problem:** Incompatible Node version errors

**Solution:**
- The workflow uses Node.js 20, which is compatible with modern packages
- If you see version errors, check that your dependencies support Node 20
- Update dependencies if needed: `npm update`

## Testing Locally Before Release

Before creating a release, test the build locally:

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Login to Expo
eas login

# Build APK locally
eas build --platform android --profile preview

# Or build and download immediately
eas build --platform android --profile preview --local
```

## Version Numbering

Follow semantic versioning for tags:

- **Major version** (v2.0.0): Breaking changes, major new features
- **Minor version** (v1.1.0): New features, backward compatible
- **Patch version** (v1.0.1): Bug fixes, small changes

Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - Added multi-list support
- `v1.1.1` - Fixed menu bug
- `v2.0.0` - Redesigned UI (breaking change)

## Build Configuration

The workflow uses the `preview` build profile from `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

This builds an **APK** (not AAB) that can be:
- Installed directly on Android devices
- Distributed without Google Play Store
- Shared via direct download

## Distributing the APK

After the build completes:

1. **Download from GitHub:**
   - Go to the release page
   - Click on `ha-shopping-list-vX.X.X.apk`
   - Share this download link

2. **Install on Android:**
   - Transfer APK to device
   - Enable "Install from Unknown Sources" in settings
   - Open APK file to install

3. **Share with Users:**
   - Post the GitHub release link
   - Users can download directly from GitHub
   - Include installation instructions in release notes

## Advanced Usage

### Custom Build Profiles

To create different build types, edit `eas.json`:

```json
{
  "build": {
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "development": {
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug",
        "buildType": "apk"
      }
    }
  }
}
```

Then update the workflow to use a different profile:
```yaml
- name: Build Android APK
  run: eas build --platform android --profile production --non-interactive
```

### Building for Multiple Platforms

To build both Android and iOS:

```yaml
- name: Build Android APK
  run: eas build --platform android --profile preview --non-interactive

- name: Build iOS IPA
  run: eas build --platform ios --profile preview --non-interactive
```

Note: iOS builds require Apple Developer account credentials.

## Support

- **EAS Build Documentation:** https://docs.expo.dev/build/introduction/
- **GitHub Actions Documentation:** https://docs.github.com/en/actions
- **Expo Forums:** https://forums.expo.dev/
- **Issues:** Open an issue in this repository

## Quick Reference

| Task | Command/Action |
|------|----------------|
| Create release | GitHub → Releases → Draft new release |
| Manual build | Actions → Build and Release APK → Run workflow |
| Test locally | `eas build --platform android --profile preview` |
| Check build status | Actions tab → Click workflow run |
| Download APK | Release page → Click APK file |
| Add token | Settings → Secrets → EXPO_TOKEN |
| View logs | Actions → Click workflow → Expand steps |
