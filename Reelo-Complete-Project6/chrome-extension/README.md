# Reelo for laptop browsers

This folder contains the Reelo extension for desktop Chrome and Microsoft Edge. It puts a draggable purple counter on Instagram Reels and YouTube Shorts pages. It is an in-browser overlay, not a Windows-wide floating window.

## Install in Chrome or Edge

1. Extract the project ZIP to a folder you plan to keep, such as `Documents\Reelo`.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this `chrome-extension` folder (the one containing `manifest.json`).
5. Open Instagram and go to a Reel, or open a YouTube Short. Reelo appears on the page. Drag it to move it; tap it to add one count.
6. Open the Reelo toolbar popup to see today's count and the last seven days.

## Counting modes

- Enable **Estimate counts from scrolling** for an automatic estimate from downward wheel or keyboard scroll input while a supported Reels/Shorts page is open.
- Turn that option off for manual counting. The bubble can still be tapped to add a count.
- Turn off **Show Reelo on supported pages** to hide the bubble and pause automatic counting.

Automatic estimates do not prove a video was watched or completed. The browser extension cannot reliably tell a new video from all other scrolls on those pages. Page changes, touchpad gestures, and browser behavior can affect its count.

## Privacy and storage

Reelo has no login, network request, analytics, or server. It uses the browser's local extension storage. Counts stay on this browser profile; they do not sync to the Android app. The extension requests local storage and runs only on Instagram and YouTube pages.
