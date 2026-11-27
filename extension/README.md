# ForenScreen browser extension

Register your screenshots and photos with ForenScreen straight from the browser,
before you share them. **It always asks first. Nothing is uploaded without you
clicking Register.**

## What it does

| Where | How |
|---|---|
| **Any website** | Right-click an image, then choose **Register with ForenScreen…**. A window shows the image; it is uploaded only if you click **Register**. |
| **Toolbar icon** | Drop an image on the popup (or click to choose one), check the preview, then click **Register**. |
| **Instagram and X** | When you add photos to a new post, a small panel asks **Register with ForenScreen?**. **Not now** (or ignoring it) does nothing. The site works exactly as before. |

If another account already registered a similar picture, you see it side by side
with yours and can **Register anyway**, the same as in the web app.

## Install (development)

1. Start the backend (port 8000) and the web app (`npm run dev`, https://localhost:5173).
2. In Chrome, open `chrome://extensions`, turn on **Developer mode**, click
   **Load unpacked**, and choose this `extension` folder.
3. Sign in to the web app, open **Browser extension** in the sidebar, and click
   **Connect extension**.

The extension icon's popup should now say "Connected".

## How sign-in works

The web app's own sign-in lasts 15 minutes, too short for an extension. So the
**Connect extension** page asks the backend for a separate extension token and
hands it to the extension through `content-app.js`, which runs only on the web
app's own pages and accepts messages only from that page. The token is never
shown on screen.

The token is deliberately weak:

- It can only **register originals** and ask whose it is (`/upload-asset/`,
  `/me`). The backend refuses it everywhere else, so it cannot read your
  registry, checks or images.
- It lasts 90 days, the server stores only its hash, and you can disconnect it
  at any time from the **Browser extension** page.

## Permissions, and why

| Permission | Why |
|---|---|
| `contextMenus` | The right-click **Register with ForenScreen…** item. |
| `storage` | Keeps the extension's sign-in token on this computer. |
| Host access to all sites | The right-click item has to fetch the image you clicked, wherever it is hosted (Instagram's images come from a separate CDN, for example). |
| Content script on instagram.com, x.com, twitter.com | The **Register this?** panel when you add photos to a post. It only reads the photos you picked, and only after you click **Register**. |
| Content script on the web app | The bridge that receives the token from the **Connect extension** page. |

## Configuration

`config.js` sets where the API and the web app are. When deploying, change both,
and change the `matches` of `content-app.js` in `manifest.json` to the web
app's address.

## Files

| File | Role |
|---|---|
| `manifest.json` | Chrome Manifest V3 definition |
| `background.js` | Right-click menu, stores the token, uploads for the Instagram/X panel |
| `popup.html` / `popup.js` | Toolbar popup: connection status, drop a file, register |
| `confirm.html` / `confirm.js` | Window opened by the right-click item |
| `content-social.js` | The **Register this?** panel on Instagram and X |
| `content-app.js` | Token bridge on the web app's pages |
| `lib/api.js` | API calls and the plain-language result messages |
| `lib/flow.js` | The confirm → register → result flow shared by the popup and the window |
| `ui.css` | Styles for the popup and the window (light and dark) |

## Known limits

- Instagram and X change their pages often. The panel listens for any file
  picker on the page rather than specific buttons, which is less fragile, but a
  site change could still stop it appearing.
- Tested: the API logic (`lib/api.js`) end to end against a test server. The
  Chrome-only parts (menu, popup, panel) still need trying in Chrome.
