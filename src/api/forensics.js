const API_BASE_URL = 'http://127.0.0.1:8000';

export const forensicsAPI = {
  // Upload original asset to register in secure ledger
  async uploadOriginalAsset(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload-asset/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload original asset');
    }

    return response.json();
  },

  // Upload evidence file for comparison and forensic analysis
  async uploadEvidence(file, caseId = null, submitterMetadata = null) {
    const formData = new FormData();
    formData.append('file', file);

    if (caseId) {
      formData.append('case_id', caseId);
    }

    if (submitterMetadata) {
      formData.append('submitter_metadata', JSON.stringify(submitterMetadata));
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload evidence file');
    }

    return response.json();
  },

  // Get database-stored asset image for display
  getAssetImageUrl(assetId) {
    return `${API_BASE_URL}/view-asset/${assetId}`;
  },

  // Get file uploaded to disk (from /upload endpoint)
  getUploadedFilePath(filename) {
    return `${API_BASE_URL}/uploads/${filename}`;
  }
};