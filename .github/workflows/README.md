# GitHub Actions Workflows

## Build and Release APK

This workflow automatically builds an Android APK using EAS Build and attaches it to GitHub releases.

### Setup Instructions

#### 1. Create an Expo Access Token

1. Go to https://expo.dev/accounts/[your-account]/settings/access-tokens
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the generated token

#### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository settings
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste your Expo access token
6. Click **Add secret**

### Usage

#### Automatic Builds on Release

The workflow automatically triggers when you create a new release:

1. Go to your repository on GitHub
2. Click **Releases** → **Draft a new release**
3. Create a new tag (e.g., `v1.0.0`)
4. Fill in the release title and description
5. Click **Publish release**

The workflow will:
- Build the APK using EAS Build
- Download the built APK
- Attach it to the release as `ha-shopping-list-v1.0.0.apk`

#### Manual Builds

You can also trigger builds manually:

1. Go to **Actions** tab in your repository
2. Select **Build and Release APK** workflow
3. Click **Run workflow**
4. Enter the tag name (e.g., `v1.0.0`)
5. Click **Run workflow**

### Build Configuration

The workflow uses the `preview` build profile defined in `eas.json`:

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

This builds an APK (not AAB) that can be directly installed on Android devices.

### Troubleshooting

**Build fails with authentication error:**
- Verify your `EXPO_TOKEN` secret is set correctly
- Make sure the token hasn't expired
- Check that your Expo account has access to the project

**Build fails during compilation:**
- Check the EAS Build logs in the Actions output
- Verify that `eas.json` and `app.json` are properly configured
- Ensure all dependencies are compatible with the Expo SDK version

**APK not attached to release:**
- Check the "Upload APK to release" step in the workflow logs
- Verify the release was created before running the workflow (for manual runs)
