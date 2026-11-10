# Tab Goblin (Project 14)

A Manifest V3 Chrome extension that lists tabs from least recently used to most recently used, protects tabs on a Keep list, discards idle tabs using Chrome's built-in tab discard feature, and saves/restores a URL session locally.

## Install

1. Unzip `tab-goblin.zip`.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Choose **Load unpacked** and select the `tab-goblin` folder.
4. Open the extension popup to review tabs and set the idle threshold.

Sleeping discards a page from memory without closing its tab. Chrome reloads it when clicked. The active tab, tabs on the Keep list, and non-web pages are never discarded. The saved session stores web page URLs on this device; restore opens them in a new Chrome window. Tab metadata access is needed to show titles, URLs, and last-use order.
