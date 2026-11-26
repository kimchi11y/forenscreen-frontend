/**
 * Thin client for the ForenScreen API.
 *
 * Every call returns parsed JSON and throws an Error carrying the server's
 * `detail` message where one is available, so callers can surface something
 * more useful than "request failed".
 *
 * Requests carry a bearer token when one is available. The backend verifies it
 * against Neon's JWKS and uses it to attribute custody entries to a real user;
 * without it the request is simply anonymous. An invalid token is rejected with
 * 401 rather than silently downgraded, so a transport failure is visible.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

let authTokenProvider = null;

/** Register the function that mints an API token (see lib/auth.js). */
export function setAuthTokenProvider(provider) {
  authTokenProvider = provider;
}

async function authHeaders() {
  if (!authTokenProvider) return {};
  try {
    const token = await authTokenProvider();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    // A failure to mint a token must not break endpoints that also work
    // anonymously; the request proceeds unattributed. It is logged, though:
    // staying silent here once hid that no request was ever signed in.
    console.warn("ForenScreen: could not get a sign-in token; request sent anonymously.", error);
    return {};
  }
}

async function parse(response) {
  if (response.ok) {
    return response.status === 204 ? null : response.json();
  }
  let detail = `${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    if (body?.detail) detail = body.detail;
  } catch {
    // response was not JSON; keep the status line
  }
  throw new Error(detail);
}

async function get(path) {
  return parse(await fetch(`${API_BASE_URL}${path}`, { headers: await authHeaders() }));
}

export const forensicsAPI = {
  baseUrl: API_BASE_URL,

  /** Register an original. Idempotent: re-registering identical bytes returns
   *  the existing record with `duplicate: true` rather than erroring.
   *
   *  If another account already registered a similar picture, nothing is saved
   *  and this resolves to `{ similar: true, detail, registered_at }` instead of
   *  throwing, so the caller can ask the user. Call again with
   *  `confirmSimilar: true` to register anyway. */
  async uploadOriginalAsset(file, { confirmSimilar = false } = {}) {
    const form = new FormData();
    form.append("file", file);
    if (confirmSimilar) form.append("confirm_similar", "true");
    const response = await fetch(`${API_BASE_URL}/upload-asset/`, {
      method: "POST",
      headers: await authHeaders(),
      body: form,
    });
    if (response.status === 409) {
      const body = await response.clone().json().catch(() => null);
      if (body?.similar) return body;
    }
    return parse(response);
  },

  /** Registered originals, newest first. */
  async listAssets({ limit = 100, offset = 0 } = {}) {
    const query = new URLSearchParams({ limit, offset });
    return get(`/assets?${query}`);
  },

  /**
   * Check an evidence file against the registry.
   *
   * `originalAssetId` scopes the check to one known original, which is the way
   * out of an AMBIGUOUS_MATCH result - the backend compares against that
   * original only instead of searching the whole registry.
   */
  async uploadEvidence(file, { caseId = null, originalAssetId = null, submitterMetadata = null } = {}) {
    const form = new FormData();
    form.append("file", file);
    if (caseId) form.append("case_id", caseId);
    if (originalAssetId) form.append("original_asset_id", originalAssetId);
    if (submitterMetadata) {
      form.append("submitter_metadata", JSON.stringify(submitterMetadata));
    }
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: await authHeaders(),
      body: form,
    });
    return parse(response);
  },

  /** Recent comparisons, newest first. */
  listChecks({ limit = 50, offset = 0 } = {}) {
    return get(`/checks?${new URLSearchParams({ limit, offset })}`);
  },

  /** One stored comparison - lets a result survive a page reload. */
  getCheck(checkId) {
    return get(`/checks/${checkId}`);
  },

  /** Record that a report was exported, and return its contents. */
  async exportReport(checkId) {
    const response = await fetch(`${API_BASE_URL}/checks/${checkId}/report`, {
      method: "POST",
      headers: await authHeaders(),
    });
    return parse(response);
  },

  /** Rectangles where the evidence differs from the original it matched. */
  getAlteredRegions(fileId, originalAssetId) {
    return get(
      `/evidence/${fileId}/altered-regions?${new URLSearchParams({ original_asset_id: originalAssetId })}`,
    );
  },

  /** Where does this evidence differ, in the same call shape as above. */
  getDifferenceMap(fileId, originalAssetId) {
    return this.getAlteredRegions(fileId, originalAssetId);
  },

  /** The handling history of one asset or one piece of evidence. */
  getCustody(subjectType, subjectId) {
    return get(`/custody/${subjectType}/${subjectId}`);
  },

  /** Recompute the hash chain and report whether it is intact. */
  verifyCustody(subjectType, subjectId) {
    return get(`/custody/${subjectType}/${subjectId}/verify`);
  },

  /** Compare a digest against both the registry and the chain. */
  verifyAnchor(sha256) {
    return get(`/verify-anchor/${sha256}`);
  },

  /** Who the API believes we are. */
  whoami() {
    return get("/me");
  },

  /**
   * Fetch a protected image with the sign-in token and return it as a Blob.
   * Needed because an <img src> request cannot carry an Authorization header,
   * and the API only serves an image to whoever may see it.
   */
  async fetchImage(url) {
    const response = await fetch(url, { headers: await authHeaders() });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.blob();
  },

  /** URL of the evidence image with the differing pixels tinted. */
  differenceOverlayUrl(fileId, originalAssetId) {
    const query = new URLSearchParams({ original_asset_id: originalAssetId });
    return `${API_BASE_URL}/evidence/${fileId}/difference-overlay?${query}`;
  },

  /** Absolute URL for a registered original's image. */
  assetImageUrl(assetId) {
    return `${API_BASE_URL}/view-asset/${assetId}`;
  },

  /**
   * Absolute URL for the evidence copy saved during a check. The server checks
   * the file against its recorded SHA-256 before serving it.
   */
  evidenceImageUrl(fileId) {
    return `${API_BASE_URL}/evidence/${fileId}/image`;
  },
};

export { API_BASE_URL };
