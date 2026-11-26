// Background service worker.
//
// - Adds "Register with ForenScreen" to the right-click menu on images. It
//   only opens a confirmation window; nothing is uploaded until the user
//   clicks Register there.
// - Receives the sign-in token from the web app's Connect page (via
//   content-app.js) and stores it.
// - Uploads for the Instagram / X prompt (content-social.js), which cannot
//   call the API itself - but only after the user clicked Register in it.

import { APP_URL } from "./config.js";
import { registerImage, setToken, whoami } from "./lib/api.js";

const MENU_ID = "forenscreen-register-image";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Register with ForenScreen…",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.srcUrl) return;
  const url = chrome.runtime.getURL(`confirm.html?src=${encodeURIComponent(info.srcUrl)}`);
  chrome.windows.create({ url, type: "popup", width: 460, height: 640 });
});

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only this extension's own scripts can send messages here.
  if (sender.id !== chrome.runtime.id) return false;

  (async () => {
    switch (message?.type) {
      case "connect":
        if (typeof message.token !== "string" || !message.token.startsWith("fsx_")) {
          return { ok: false };
        }
        await setToken(message.token);
        return { ok: true, ...(await whoami()) };
      case "status":
        return whoami();
      case "register": {
        const blob = await dataUrlToBlob(message.dataUrl);
        return registerImage(blob, message.fileName, { confirmSimilar: Boolean(message.confirmSimilar) });
      }
      case "open-app":
        await chrome.tabs.create({ url: `${APP_URL}${message.path ?? "/extension"}` });
        return { ok: true };
      default:
        return { ok: false };
    }
  })().then(sendResponse, (error) => sendResponse({ status: "error", detail: String(error) }));

  return true; // the response is sent asynchronously
});
