# AuraForm design handoff

The website is the interactive implementation of these Figma-ready design tokens and components. The workspace does not currently have a connected Figma editing tool, so the interface is authored directly in HTML and CSS.

## Frames

- Desktop: 1440 × 1000; 1240 px centered content, 30 px page gutters.
- Tablet: 768 px breakpoint; studio outputs move below the editor.
- Mobile: 390 × 844; single-column upload and preset cards, compact sticky navigation.
- Pages: Home / Upload, Photo Studio / Crop, Form Presets / Rules, Help / Privacy.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#1B2533` | Body copy and controls |
| Deep teal | `#173D45` | Hero and primary brand surface |
| Action teal | `#148578` | Buttons, links, focus actions |
| Mint | `#DFF3EF` | Active steps and reassurance |
| Page wash | `#F5F7F8` | Background |
| Line | `#E2E7ED` | Cards, separators, input borders |
| Radius | 10 / 15 / 18 / 25 px | Controls / cards / panels / hero |

## Components

Brand header and four-link navigation, privacy callout, upload dropzone, preset summary, numbered workflow rail, crop canvas with face guide, file-size meter, result download buttons, official-source cards, and custom preset form. Components are shared through `assets/style.css` and `assets/app.js`.
