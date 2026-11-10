# Reelo — Android phone + laptop

This download contains both versions of Reelo for Project 6:

- `android` — native Android app with a floating purple monster, daily count, estimated app time, seven-day history, manual mode, and optional accessibility-based scroll estimates.
- `chrome-extension` — draggable purple counter inside desktop Chrome or Edge on Instagram Reels and YouTube Shorts, with local history, manual taps, and optional scroll estimates.

## Get it running

### Android phone or emulator

Open the `android` folder in Android Studio, install Android SDK Platform 35 if prompted, and press **Run** with a connected Android phone or emulator selected. In Reelo, allow **Display over other apps** and tap **Allow floating bubble** again after returning. For automatic estimates, choose Level 2 and enable Reelo in Android Accessibility settings. See [the Android setup guide](android/README.md).

Android Studio can generate an installable debug APK with **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The output is `android/app/build/outputs/apk/debug/app-debug.apk`.

### Laptop browser

Extract the ZIP, open `chrome://extensions` (Chrome) or `edge://extensions` (Edge), turn on **Developer mode**, choose **Load unpacked**, and select the `chrome-extension` folder. See [the Chrome/Edge setup guide](chrome-extension/README.md).

## What to expect

Automatic mode estimates counts from scroll events; neither Android nor a browser extension can confirm that a Reel or Short was watched to completion. Use manual mode for a precise hand-count. Android and browser data are stored separately on their device/browser profile and do not sync. Reelo itself does not require an account or internet access; Instagram and YouTube still need internet to load videos.
