/**
 * Thin client for the ForenScreen API.
 *
 * Every call returns parsed JSON and throws an Error carrying the server's
 * `detail` message where one is available, so callers can surface something
 * more useful than "request failed".
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

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

export const forensicsAPI = {
  baseUrl: API_BASE_URL,

  /** Register an original. Idempotent: re-registering identical bytes returns
   *  the existing record with `duplicate: true` rather than erroring. */
  async uploadOriginalAsset(file) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_BASE_URL}/upload-asset/`, {
      method: "POST",
      body: form,
    });
    return parse(response);
  },

  /** Registered originals, newest first. */
  async listAssets({ limit = 100, offset = 0 } = {}) {
    const query = new URLSearchParams({ limit, offset });
    const response = await fetch(`${API_BASE_URL}/assets?${query}`);
    return parse(response);
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
      body: form,
    });
    return parse(response);
  },

  /** Rectangles where the evidence differs from the original it matched. */
  async getAlteredRegions(fileId, originalAssetId) {
    const query = new URLSearchParams({ original_asset_id: originalAssetId });
    const response = await fetch(`${API_BASE_URL}/evidence/${fileId}/altered-regions?${query}`);
    return parse(response);
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

  /** Absolute URL for the evidence copy saved during a check. */
  evidenceImageUrl(savedFilename) {
    return `${API_BASE_URL}/uploads/${savedFilename}`;
  },
};

export { API_BASE_URL };
