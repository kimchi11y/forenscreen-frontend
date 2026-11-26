// Talking to the ForenScreen API from the extension.
//
// The extension signs in with a token the web app issues (see the web app's
// "Connect extension" page). That token can only register originals and ask
// who it belongs to; the API refuses it everywhere else.

import { API_BASE_URL } from "../config.js";

const TOKEN_KEY = "forenscreenToken";

export async function getToken() {
  const stored = await chrome.storage.local.get(TOKEN_KEY);
  return stored[TOKEN_KEY] ?? null;
}

export async function setToken(token) {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearToken() {
  await chrome.storage.local.remove(TOKEN_KEY);
}

/** Who the stored token belongs to: { connected, email? }. Never throws. */
export async function whoami() {
  const token = await getToken();
  if (!token) return { connected: false };
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      await clearToken();
      return { connected: false, reason: "This extension was disconnected. Connect it again." };
    }
    const body = await response.json();
    return { connected: Boolean(body.authenticated), email: body.email ?? null };
  } catch {
    return { connected: true, offline: true };
  }
}

function deviceInfo() {
  let timezone;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timezone = undefined;
  }
  return {
    user_agent: navigator.userAgent,
    platform: navigator.userAgentData?.platform ?? navigator.platform,
    language: navigator.language,
    timezone,
  };
}

/**
 * Register an image. Only ever called after the user said yes.
 *
 * Resolves to one of:
 *   { status: "registered", fileName }
 *   { status: "already", fileName }            - you registered these exact bytes before
 *   { status: "similar", detail, preview }     - another account registered a similar
 *                                                 picture first; call again with
 *                                                 confirmSimilar to register anyway
 *   { status: "taken", detail }                - these exact bytes belong to another account
 *   { status: "disconnected" }                 - no valid token; connect from the web app
 *   { status: "error", detail }
 */
export async function registerImage(blob, fileName, { confirmSimilar = false } = {}) {
  const token = await getToken();
  if (!token) return { status: "disconnected" };

  const form = new FormData();
  form.append("file", blob, fileName || "image");
  form.append("client_metadata", JSON.stringify({ device: deviceInfo() }));
  if (confirmSimilar) form.append("confirm_similar", "true");

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/upload-asset/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch {
    return { status: "error", detail: "ForenScreen could not be reached. Is it running?" };
  }

  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    await clearToken();
    return { status: "disconnected" };
  }
  if (response.status === 409 && body.similar) {
    return { status: "similar", detail: body.detail, preview: body.earlier_preview ?? null };
  }
  if (response.status === 409) return { status: "taken", detail: body.detail };
  if (!response.ok) {
    return { status: "error", detail: body.detail || `Registration failed (HTTP ${response.status}).` };
  }
  return { status: body.duplicate ? "already" : "registered", fileName: body.file_name };
}

/** One sentence for each result, shared by the popup, the window and the page prompt. */
export function describe(result) {
  switch (result.status) {
    case "registered":
      return "Registered. Its fingerprint is saved and will be anchored on the blockchain.";
    case "already":
      return "You had already registered this exact image.";
    case "similar":
      return result.detail;
    case "taken":
      return result.detail;
    case "disconnected":
      return "Connect the extension to your ForenScreen account first.";
    default:
      return result.detail || "Something went wrong.";
  }
}
