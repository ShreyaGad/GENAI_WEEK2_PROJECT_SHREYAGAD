# Reelo — Project 6 Android app

Reelo is a small, purple floating monster and reel counter for Instagram Reels and YouTube Shorts. The app keeps its counters on your phone and does not require a login or internet access.

## What is included

- A draggable purple monster that stays above other apps after you grant Android's **Display over other apps** permission.
- **Level 1 · Manual:** tap Reelo once after each Reel or Short.
- **Level 2 · Automatic estimate:** the optional accessibility service counts scroll events received from Instagram and YouTube, with a debounce to limit repeat counts.
- A daily total, estimated time in the two apps, and the last seven days of counts. Data remains in private app storage across phone restarts.
- A hide-bubble control in the dashboard.

Automatic counting is an estimate. Android's accessibility events do not say that a short video was watched or completed, and scroll events can occur in other parts of Instagram and YouTube. The service is scoped to those two apps and does not read screen text or video content. Manual mode is the reliable option when you need an exact count.

## Install and run on an Android phone

1. Install Android Studio on a Windows, macOS, or Linux computer. During setup, install Android SDK Platform 35 and a recent Android SDK Build Tools version.
2. Open the `Reelo-Android` folder in Android Studio and let Gradle sync finish. If prompted, allow Android Studio to download the Android Gradle Plugin and SDK components.
3. Connect an Android phone with USB debugging enabled, or create an Android emulator in Device Manager.
4. Choose the phone/emulator in Android Studio and press **Run ▶** to install Reelo.
5. In Reelo, tap **Allow floating bubble** and grant **Display over other apps**. Tap the button again if Android returns to the app without starting the bubble.
6. For manual counting, leave **Level 1 · Manual** selected. Open Instagram Reels or YouTube Shorts and tap the floating monster after each video. Drag Reelo to move it; use **Hide floating bubble** to close it.
7. For automatic estimates, select **Level 2 · Automatic**, then enable **Reelo automatic reel counter** in Android Accessibility settings. Return to Reelo, start the floating bubble, and scroll Reels or Shorts.

To create a file to save or sideload, use **Build → Build Bundle(s) / APK(s) → Build APK(s)** in Android Studio. The debug APK is written to:

```text
app/build/outputs/apk/debug/app-debug.apk
```

You can copy that APK to your phone and open it to install. Android may ask you to allow installation from that file app. Android Studio's emulator is the laptop testing option; the overlay runs on Android, not directly as a Windows/macOS desktop app.

## Privacy and permissions

- There is no `INTERNET` permission, account, analytics, or server.
- Counts and estimated foreground seconds are kept in the app's private SharedPreferences.
- Overlay permission is needed for the floating monster.
- Accessibility permission is optional and only needed for automatic estimates. Android displays its accessibility notice while the service is enabled.
- Notification permission may be requested on Android 13+. The foreground-service notification indicates that the bubble is active.

## Source layout

- `app/src/main/java/com/reelo/app/MainActivity.java` — dashboard, mode selection, and permissions.
- `OverlayService.java` and `MonsterView.java` — foreground floating bubble and purple character.
- `ReeloAccessibilityService.java` — package-scoped scroll-event estimate and foreground-time tracking.
- `Stats.java` — offline daily counts and time data.
- `app/src/main/res/xml/accessibility_config.xml` — limits accessibility event delivery to Instagram and YouTube; screen text retrieval is disabled.

## Project 6 phone checklist

- [ ] Install on a real Android phone and grant overlay permission.
- [ ] Confirm Reelo stays above Instagram and YouTube.
- [ ] Tap 20 times in manual mode and confirm the counter increases.
- [ ] Restart the phone and confirm the daily total is preserved.
- [ ] Compare automatic estimates to 20+ hand-counted scrolls; results vary with the app version and screen.
- [ ] Confirm manual counting and saved stats work with Wi-Fi and mobile data turned off.
