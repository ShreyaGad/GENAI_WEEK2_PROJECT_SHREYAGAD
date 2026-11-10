# AuraForm

A local-first photo and signature preparation tool for exam and job application forms. The site contains four linked pages: Home, Photo Studio, Form Presets, and Help & Privacy.

## Open the website

Run a small local web server from this folder so the upload and studio pages can share files through browser IndexedDB:

```powershell
py -m http.server 8765 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8765/` in a browser. This server listens only on your own computer. The site makes no external requests; after it is open, image processing and downloads work without Wi-Fi as long as this local server remains running.

## Workflow

1. Choose a photo, signature, and one of the three starter presets.
2. In Photo Studio, drag the crop frame to position it and adjust the crop size. Switch to the Signature tab to position the signature.
3. Select **Prepare both files**. The browser exports JPEGs at the selected pixel dimensions and searches for the highest JPEG quality that stays below each maximum KB limit.
4. Download either file separately or both files together as a ZIP. The page shows exact bytes and KB before download.

Create an additional form profile under **Form Presets**. Custom settings stay in this browser. Inputs are limited to 25 MB each.

## Privacy and browser storage

Image processing uses the browser's local image decoder and canvas APIs. The original image blobs are kept in this browser's IndexedDB between the upload and studio pages. No image data is sent to a remote service. Clearing this browser's site data removes the local copies. Outputs are created in memory and downloaded by the browser.

## Starter preset limits

The official-source links and extracted rules are also documented in [preset-sources.md](preset-sources.md). Notices can change. Always check the current notice and application portal before uploading.

| Preset | Photo | Signature | Dimension note |
| --- | --- | --- | --- |
| NEET (UG) 2026 | 10–200 KB | 10–100 KB | Bulletin specifies file limits and face guidance, not pixels; AuraForm uses 600 × 800 and 600 × 250 px. |
| JEE (Main) 2026 | 10–200 KB | 10–100 KB | Bulletin specifies file limits and face guidance, not pixels; AuraForm uses 600 × 800 and 600 × 250 px. |
| UPSC Recruitment | Max 40 KB | Max 40 KB | Official FAQ specifies 110 × 140 px photo and 140 × 110 px signature. |

