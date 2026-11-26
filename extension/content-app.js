// Bridge between the ForenScreen web app and the extension.
//
// Runs only on the web app's own pages (see manifest.json). The app's
// "Connect extension" page posts a token with window.postMessage; this script
// accepts it only from the page itself, on its own origin, and hands it to the
// background worker. It also tells the page the extension is installed, so the
// page can say so.

(() => {
  const FROM_APP = "forenscreen-app";
  const FROM_EXTENSION = "forenscreen-extension";

  function reply(message) {
    window.postMessage({ source: FROM_EXTENSION, ...message }, window.location.origin);
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message || message.source !== FROM_APP) return;

    if (message.type === "ping") {
      reply({ type: "present" });
    } else if (message.type === "connect-extension" && typeof message.token === "string") {
      chrome.runtime.sendMessage({ type: "connect", token: message.token }, (result) => {
        reply({ type: "connected", ok: Boolean(result?.ok), email: result?.email ?? null });
      });
    }
  });

  reply({ type: "present" });
})();
