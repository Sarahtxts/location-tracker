---
description: How to build a downloadable Android APK using EAS Build
---

# How to Build an Android APK

This guide will help you generate a downloadable `.apk` file for your Android device using Expo Application Services (EAS).

## Prerequisites
-   You need an [Expo Account](https://expo.dev/signup).
-   You need to be logged in to your Expo account in the terminal.

## Steps

1.  **Install EAS CLI**
    If you haven't already, install the EAS CLI globally:
    ```powershell
    npm install -g eas-cli
    ```

2.  **Login to Expo**
    Log in to your Expo account:
    ```powershell
    eas login
    ```

3.  **Configure Project**
    Initialize the build configuration. This will create an `eas.json` file.
    ```powershell
    eas build:configure
    ```
    -   Select `Android` when prompted.

4.  **Modify `eas.json` for APK**
    By default, EAS builds an App Bundle (`.aab`) for the Play Store. To get a downloadable APK, you need to modify `eas.json`.
    Open `eas.json` and add a `preview` profile (or modify the existing one) to set `buildType` to `apk`:

    ```json
    {
      "build": {
        "preview": {
          "android": {
            "buildType": "apk"
          }
        },
        "production": {}
      }
    }
    ```

5.  **Run the Build**
    Run the build command using the `preview` profile:
    ```powershell
    eas build -p android --profile preview
    ```

6.  **Download APK**
    -   Wait for the build to complete (this happens in the cloud).
    -   Once finished, the terminal will show a link to download your `.apk` file.
    -   You can also find the build in your [Expo Dashboard](https://expo.dev/accounts/[your-username]/projects/location-tracker-mobile/builds).

7.  **Install on Device**
    -   Download the `.apk` to your phone.
    -   Open it to install (you may need to allow installation from unknown sources).
