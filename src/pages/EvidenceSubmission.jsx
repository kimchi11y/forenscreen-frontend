import { useState } from 'react';

export default function EvidenceSubmission() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [caseId, setCaseId] = useState('');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);

    // Generate previews for image files
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
    const newPreviews = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));
    setPreviews(newPreviews);
  };

  const removePreview = (index) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFiles = files.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    setFiles(newFiles);
  };

  const handleDownload = async (result) => {
    try {
      const response = await fetch(`http://localhost:8000/uploads/${result.saved_filename || result.file_id}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);
    setUploadResults([]);

    try {
      const formData = new FormData();
      formData.append('case_id', caseId);

      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadResults(data.files);
      setFiles([]);
      setCaseId('');
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Evidence Submission</h1>
      <p className="text-gray-600 mb-6">Upload screenshots for forensic analysis: edit detection, duplicate detection, and file integrity verification</p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#f9f9f9] p-6 rounded-lg border border-[#c2c7d0]">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Case ID (Optional)
          </label>
          <input
            type="text"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            placeholder="Enter associated case ID"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00375e]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Evidence Files
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#00375e] transition-colors">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#00375e] hover:text-[#1f4e79] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#00375e]">
                  <span>Upload files</span>
                  <input id="file-upload" type="file" className="sr-only" multiple accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG screenshots up to 10MB each</p>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium mb-2">Selected Files:</h4>
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            </div>

            {previews.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-3">Image Previews:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => removePreview(index)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate" title={preview.name}>
                        {preview.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className="w-full px-6 py-3 bg-[#00375e] text-white font-medium rounded-lg hover:bg-[#1f4e79] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Analyzing Screenshots...' : `Analyze Screenshots (${files.length} files)`}
        </button>
      </form>

      {uploadResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Forensic Analysis Results</h2>
          <div className="space-y-4">
            {uploadResults.map((result, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-[#c2c7d0] shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{result.filename}</h3>
                    <p className="text-sm text-gray-500">
                      {(result.size / 1024).toFixed(1)} KB • {result.mime_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      ✓ Verified
                    </span>
                    {result.mime_type?.startsWith('image/') && (
                      <button
                        onClick={() => handleDownload(result)}
                        className="px-3 py-1 bg-[#00375e] text-white text-sm font-medium rounded-full hover:bg-[#1f4e79] transition-colors flex items-center gap-1"
                        title="Download image"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download
                      </button>
                    )}
                  </div>
                </div>

                {result.mime_type?.startsWith('image/') && (
                  <div className="mb-4">
                    <img
                      src={`http://localhost:8000/uploads/${result.saved_filename || result.file_id}`}
                      alt={result.filename}
                      className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="bg-[#f0f9ff] p-4 rounded-lg border border-[#bae6fd]">
                  <h4 className="text-sm font-medium text-[#0369a1] mb-2">SHA-256 Digital Fingerprint</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm text-[#0c4a6e] break-all font-mono bg-white p-3 rounded border border-[#bae6fd]">
                      {result.sha256_hash}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(result.sha256_hash)}
                      className="px-4 py-2 bg-[#00375e] text-white text-sm rounded hover:bg-[#1f4e79] transition-colors"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Screenshot Forensics Section */}
                {result.forensics && (
                  <div className="mt-4 space-y-4">
                    {/* Manipulation Indicators */}
                    {result.forensics.manipulation_indicators && result.forensics.manipulation_indicators.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="text-sm font-medium text-[#0369a1] mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">fact_check</span>
                          Forensic Analysis
                        </h4>
                        <ul className="space-y-2 text-sm">
                          {result.forensics.manipulation_indicators.map((indicator, idx) => (
                            <li key={idx} className="text-gray-700">{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Edit Detection */}
                    {result.forensics.edit_detection && (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="text-sm font-medium text-[#991b1b] mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">content_cut</span>
                          Edit Detection (Error Level Analysis)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">ELA Score:</span>
                            <p className="font-medium">{result.forensics.edit_detection.ela_score || 'N/A'}/100</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Edit Likelihood:</span>
                            <p className={`font-medium ${
                              result.forensics.edit_detection.edit_likelihood === 'High' ? 'text-red-600' :
                              result.forensics.edit_detection.edit_likelihood === 'Medium' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {result.forensics.edit_detection.edit_likelihood || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Compression:</span>
                            <p className="font-medium">{result.forensics.edit_detection.compression_analysis?.compression_type || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Interpretation:</span>
                            <p className="font-medium text-xs">{result.forensics.edit_detection.interpretation || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Image Analysis */}
                    {result.forensics.image_analysis && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="text-sm font-medium text-[#166534] mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">image</span>
                          Image Analysis
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Dimensions:</span>
                            <p className="font-medium">
                              {result.forensics.image_analysis.width && result.forensics.image_analysis.height
                                ? `${result.forensics.image_analysis.width} × ${result.forensics.image_analysis.height}`
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Format:</span>
                            <p className="font-medium">{result.forensics.image_analysis.format || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Megapixels:</span>
                            <p className="font-medium">{result.forensics.image_analysis.megapixels || 'N/A'} MP</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Aspect Ratio:</span>
                            <p className="font-medium">{result.forensics.image_analysis.aspect_ratio || 'N/A'}</p>
                          </div>
                        </div>
                        {result.forensics.image_analysis.color_profile && (
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Avg Brightness:</span>
                              <p className="font-medium">{result.forensics.image_analysis.color_profile.brightness_avg || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Color Variance:</span>
                              <p className="font-medium">{result.forensics.image_analysis.color_profile.color_variance || 'N/A'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Duplicate Detection */}
                    {result.forensics.duplicate_check && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="text-sm font-medium text-[#6b21a8] mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">content_copy</span>
                          Duplicate Detection
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Is Duplicate:</span>
                            <p className={`font-medium ${result.forensics.duplicate_check.is_duplicate ? 'text-red-600' : 'text-green-600'}`}>
                              {result.forensics.duplicate_check.is_duplicate ? '⚠️ Yes - Exact Match Found' : '✅ No'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Is Similar:</span>
                            <p className={`font-medium ${result.forensics.duplicate_check.is_similar ? 'text-yellow-600' : 'text-green-600'}`}>
                              {result.forensics.duplicate_check.is_similar ? '⚡ Yes - Similar Files Found' : '✅ No'}
                            </p>
                          </div>
                        </div>
                        {result.forensics.duplicate_check.similar_files && result.forensics.duplicate_check.similar_files.length > 0 && (
                          <div className="mt-2 p-2 bg-white rounded border border-purple-300">
                            <p className="text-xs font-medium text-gray-700 mb-1">Similar Files Found:</p>
                            <ul className="text-xs space-y-1">
                              {result.forensics.duplicate_check.similar_files.map((file, idx) => (
                                <li key={idx} className="text-gray-600">
                                  • {file.filename} ({file.similarity})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timeline Data */}
                    {result.forensics.timeline_data && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h4 className="text-sm font-medium text-[#92400e] mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg">schedule</span>
                          File Timeline Analysis
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Analysis Time:</span>
                            <p className="font-medium text-xs">{new Date(result.forensics.timeline_data.analysis_timestamp).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">File Size:</span>
                            <p className="font-medium">{result.forensics.timeline_data.file_size_mb || 'N/A'} MB</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Format:</span>
                            <p className="font-medium">{result.forensics.timeline_data.format || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500">Uploaded:</span>
                    <p className="font-medium">{new Date(result.uploaded_at).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500">Case ID:</span>
                    <p className="font-medium">{result.case_id || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500">File ID:</span>
                    <p className="font-medium font-mono text-xs">{result.file_id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
