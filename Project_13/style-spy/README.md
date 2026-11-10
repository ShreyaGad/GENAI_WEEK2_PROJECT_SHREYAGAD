# Style Spy (Project 13)

A Manifest V3 Chrome extension that scans visible page elements for frequently used colors and typography, copies individual values, saves named kits locally, and exports CSS custom properties.

## Install

1. Unzip `style-spy.zip`.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Choose **Load unpacked** and select the `style-spy` folder.
4. Pin the extension, open a regular website, and choose **Scan this page**.

Saved kits use Chrome local extension storage and remain available after Chrome restarts. The scan is limited to the first 5,000 visible page elements for responsiveness. Browser-internal pages and the Chrome Web Store cannot be scanned.
