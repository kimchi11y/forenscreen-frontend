// "Register this?" prompt on Instagram and X.
//
// When you pick photos for a new post, a small panel asks whether to register
// them with ForenScreen first. It never uploads on its own: nothing is read or
// sent until you click Register, and "Not now" (or ignoring it) does nothing.
// The site itself is left alone - the file picker works exactly as before.

(() => {
  const seen = new Set(); // files already offered this session

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:2147483647;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      .panel { width: 320px; font: 13px/1.4 system-ui, sans-serif; color: #111; background: #fff;
               border: 1px solid #d4d4d4; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,.18);
               padding: 14px; }
      .title { font-weight: 600; margin: 0 0 4px; }
      .muted { color: #555; font-size: 12px; margin: 0 0 10px; }
      .row { display: flex; gap: 10px; align-items: center; margin: 6px 0; }
      .row img { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e5e5; }
      .row .status { flex: 1; font-size: 12px; }
      .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
      button { font: inherit; border-radius: 8px; padding: 6px 12px; cursor: pointer; border: 1px solid #d4d4d4; background: #fff; }
      button.primary { background: #4338ca; color: #fff; border-color: #4338ca; }
      button:disabled { opacity: .6; cursor: default; }
      .ok { color: #15803d; } .warn { color: #b45309; } .bad { color: #b91c1c; }
    </style>
    <div class="panel" role="dialog" aria-label="Register with ForenScreen">
      <p class="title">Register with ForenScreen?</p>
      <p class="muted">Save a fingerprint of your original before you post, so edited copies can be
        caught later. Nothing is sent unless you choose Register.</p>
      <div class="list"></div>
      <div class="actions">
        <button class="dismiss" type="button">Not now</button>
        <button class="primary register" type="button">Register</button>
      </div>
    </div>`;

  const list = root.querySelector(".list");
  const registerButton = root.querySelector(".register");
  const dismissButton = root.querySelector(".dismiss");
  let pending = []; // { file, row }

  function hide() {
    host.remove();
    pending = [];
    list.textContent = "";
  }

  function setStatus(row, text, tone) {
    const status = row.querySelector(".status");
    status.textContent = text;
    status.className = `status ${tone ?? ""}`;
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function send(message) {
    return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
  }

  async function register(item, confirmSimilar = false) {
    setStatus(item.row, "Registering…");
    const result = await send({
      type: "register",
      dataUrl: await readAsDataUrl(item.file),
      fileName: item.file.name,
      confirmSimilar,
    });
    const status = result?.status;
    if (status === "registered" || status === "already") {
      setStatus(item.row, status === "registered" ? "Registered ✓" : "Already registered ✓", "ok");
    } else if (status === "similar") {
      setStatus(item.row, result.detail, "warn");
      const anyway = document.createElement("button");
      anyway.type = "button";
      anyway.textContent = "Register anyway";
      anyway.addEventListener("click", () => {
        anyway.remove();
        register(item, true);
      });
      item.row.append(anyway);
    } else if (status === "disconnected") {
      setStatus(item.row, "Connect the extension first (click its icon).", "bad");
    } else {
      setStatus(item.row, result?.detail || "Could not register.", "bad");
    }
  }

  registerButton.addEventListener("click", async () => {
    registerButton.disabled = true;
    dismissButton.textContent = "Close";
    for (const item of pending) await register(item);
  });
  dismissButton.addEventListener("click", hide);

  function offer(files) {
    if (!host.isConnected) {
      document.documentElement.append(host);
      registerButton.disabled = false;
      dismissButton.textContent = "Not now";
    }
    for (const file of files) {
      const row = document.createElement("div");
      row.className = "row";
      const thumb = document.createElement("img");
      thumb.alt = "";
      thumb.src = URL.createObjectURL(file);
      const status = document.createElement("span");
      status.className = "status";
      status.textContent = file.name;
      row.append(thumb, status);
      list.append(row);
      pending.push({ file, row });
    }
  }

  // Capture phase, passive: we only look at what was picked, never change it.
  document.addEventListener(
    "change",
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files) return;
      const images = [...input.files].filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (!file.type.startsWith("image/") || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (images.length > 0) offer(images);
    },
    { capture: true, passive: true },
  );
})();
