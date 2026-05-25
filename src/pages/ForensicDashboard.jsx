import { useState } from 'react';
import {
  Upload,
  FileImage,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scale,
  Eye,
  Hash,
  Calendar,
  FileText,
  Sparkles,
  ImageIcon,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { forensicsAPI } from '../api/forensics';

function ForensicDashboard() {
  const [activeTab, setActiveTab] = useState('register');
  const [uploadedAssets, setUploadedAssets] = useState([]);
  const [evidenceResults, setEvidenceResults] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [expandedResults, setExpandedResults] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Handle original asset upload
  const handleAssetUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await forensicsAPI.uploadOriginalAsset(file);
      setUploadedAssets([...uploadedAssets, {
        id: result.id,
        file_name: result.file_name,
        phash: result.phash,
        sha256: result.sha256,
        uploaded_at: new Date().toISOString(),
        file: file
      }]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle evidence upload
  const handleEvidenceUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await forensicsAPI.uploadEvidence(file);
      setEvidenceResults([result, ...evidenceResults]);
      setSelectedEvidence(result);

      // Auto-select matching asset if found
      if (result.files[0]?.matched_asset) {
        const matchedAsset = uploadedAssets.find(
          asset => asset.id === result.files[0].matched_asset.original_asset_id
        );
        if (matchedAsset) {
          setSelectedAsset(matchedAsset);
        }
      }
    } catch (error) {
      console.error('Evidence upload failed:', error);
      alert('Failed to upload evidence. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getVerificationStatus = (status) => {
    switch (status) {
      case 'VERIFIED_AUTHENTIC':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          text: 'Verified Authentic',
          className: 'text-emerald-600 bg-emerald-50 border-emerald-200'
        };
      case 'TAMPERED_MANIPULATED':
        return {
          icon: <XCircle className="w-5 h-5" />,
          text: 'Tampered/Manipulated',
          className: 'text-red-600 bg-red-50 border-red-200'
        };
      case 'UNREGISTERED_ASSET':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          text: 'Unregistered Asset',
          className: 'text-amber-600 bg-amber-50 border-amber-200'
        };
      default:
        return {
          icon: <Shield className="w-5 h-5" />,
          text: 'Unknown Status',
          className: 'text-gray-600 bg-gray-50 border-gray-200'
        };
    }
  };

  const toggleResultExpanded = (resultId) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  };

  const getELAClassification = (score) => {
    if (score > 15) return { text: 'High Manipulation', className: 'text-red-600 bg-red-50' };
    if (score > 8) return { text: 'Medium Manipulation', className: 'text-amber-600 bg-amber-50' };
    return { text: 'Low Manipulation', className: 'text-emerald-600 bg-emerald-50' };
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">ForenScreen</h1>
                <p className="text-xs text-slate-500">Digital Forensics Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium">{uploadedAssets.length}</span> assets registered
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-medium">{evidenceResults.length}</span> analyses performed
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200">
            <nav className="flex gap-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('register')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'register'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Upload className="w-4 h-4" />
                Register Assets
              </button>
              <button
                onClick={() => setActiveTab('analyze')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analyze'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Scale className="w-4 h-4" />
                Analyze Evidence
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'compare'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Eye className="w-4 h-4" />
                Compare
              </button>
            </nav>
          </div>
        </div>

        {/* Register Assets Tab */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Upload className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Register Original Asset</h2>
                  <p className="text-sm text-slate-500">Upload files to establish authenticity baseline</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAssetUpload}
                  className="hidden"
                  id="asset-upload"
                  disabled={isLoading}
                />
                <label htmlFor="asset-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    {isLoading ? (
                      <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
                    ) : (
                      <FileImage className="w-12 h-12 text-slate-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {isLoading ? 'Processing...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-indigo-800">
                    <p className="font-medium mb-1">Secure Registration Process:</p>
                    <ul className="space-y-1 text-indigo-700">
                      <li>• SHA-256 cryptographic signature generated</li>
                      <li>• Perceptual hash (pHash) computed for visual matching</li>
                      <li>• Asset stored in secure Neon DB ledger</li>
                      <li>• Immutable chain of custody established</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Registered Assets List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Registered Assets</h2>
                    <p className="text-sm text-slate-500">{uploadedAssets.length} files in secure ledger</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {uploadedAssets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <FileImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No assets registered yet</p>
                  </div>
                ) : (
                  uploadedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAsset?.id === asset.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                            <ImageIcon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{asset.file_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {asset.phash.substring(0, 8)}...
                              </span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(asset.uploaded_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analyze Evidence Tab */}
        {activeTab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evidence Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Scale className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Analyze Evidence</h2>
                  <p className="text-sm text-slate-500">Compare against registered assets</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  className="hidden"
                  id="evidence-upload"
                  disabled={isLoading}
                />
                <label htmlFor="evidence-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    {isLoading ? (
                      <RefreshCw className="w-12 h-12 text-amber-600 animate-spin" />
                    ) : (
                      <Eye className="w-12 h-12 text-slate-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {isLoading ? 'Analyzing...' : 'Upload evidence for forensic analysis'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Supports screenshot forensics & visual matching</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium mb-1">Forensic Analysis Includes:</p>
                    <ul className="space-y-1 text-amber-700">
                      <li>• Visual similarity matching via pHash comparison</li>
                      <li>• Cryptographic integrity verification (SHA-256)</li>
                      <li>• Error Level Analysis (ELA) for edit detection</li>
                      <li>• Compression artifact analysis</li>
                      <li>• Color profile & manipulation indicators</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Analysis Results</h2>
                    <p className="text-sm text-slate-500">{evidenceResults.length} files analyzed</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {evidenceResults.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No analysis results yet</p>
                  </div>
                ) : (
                  evidenceResults.map((result, index) => {
                    const file = result.files[0];
                    if (!file) return null;
                    const status = getVerificationStatus(file.verification_status);
                    const elaClass = getELAClassification(file.forensics?.edit_detection?.ela_score || 0);

                    return (
                      <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            setSelectedEvidence(result);
                            toggleResultExpanded(index);
                          }}
                          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status.className}`}>
                              {status.icon}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-slate-900 text-sm">{file.filename}</p>
                              <p className="text-xs text-slate-500">{status.text}</p>
                            </div>
                          </div>
                          {expandedResults.has(index) ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {expandedResults.has(index) && (
                          <div className="px-4 pb-4 border-t border-slate-100 pt-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="p-2 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-700 mb-1">ELA Score</p>
                                <p className="text-lg font-bold text-slate-900">
                                  {file.forensics?.edit_detection?.ela_score || 'N/A'}
                                </p>
                                <p className={`text-xs font-medium ${elaClass.className} inline-block px-2 py-0.5 rounded mt-1`}>
                                  {elaClass.text}
                                </p>
                              </div>
                              <div className="p-2 bg-slate-50 rounded-lg">
                                <p className="font-medium text-slate-700 mb-1">Color Variance</p>
                                <p className="text-lg font-bold text-slate-900">
                                  {file.forensics?.image_analysis?.color_profile?.color_variance || 'N/A'}
                                </p>
                              </div>
                            </div>

                            {file.matched_asset && (
                              <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="font-medium text-emerald-800 text-xs mb-1">Matched Original Asset</p>
                                <p className="text-xs text-emerald-700">{file.matched_asset.original_filename}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && selectedEvidence && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Scale className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Side-by-Side Comparison</h2>
                <p className="text-sm text-slate-500">Visual comparison with forensic analysis</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Evidence File */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-600" />
                    Evidence File
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    getVerificationStatus(selectedEvidence.files[0]?.verification_status).className
                  }`}>
                    {getVerificationStatus(selectedEvidence.files[0]?.verification_status).text}
                  </span>
                </div>

                {selectedEvidence.files[0]?.file_path && (
                  <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={`${forensicsAPI.getUploadedFilePath(selectedEvidence.files[0].saved_filename)}`}
                      alt="Evidence"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">SHA-256:</span>
                    <span className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {selectedEvidence.files[0]?.sha256_hash?.substring(0, 16)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{selectedEvidence.files[0]?.filename}</span>
                  </div>
                </div>

                {/* Forensic Analysis */}
                {selectedEvidence.files[0]?.forensics && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Forensic Analysis
                    </h4>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">ELA Score</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedEvidence.files[0].forensics.edit_detection?.ela_score || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Dimensions</span>
                        <span className="font-mono text-slate-900">
                          {selectedEvidence.files[0].forensics.image_analysis?.width} × {selectedEvidence.files[0].forensics.image_analysis?.height}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Format</span>
                        <span className="text-slate-900">
                          {selectedEvidence.files[0].forensics.image_analysis?.format}
                        </span>
                      </div>

                      {selectedEvidence.files[0].forensics.manipulation_indicators?.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-600 mb-2">Manipulation Indicators:</p>
                          <div className="space-y-1">
                            {selectedEvidence.files[0].forensics.manipulation_indicators.map((indicator, idx) => (
                              <p key={idx} className="text-xs text-slate-700">• {indicator}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Original Asset */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Original Asset
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Registered Authentic
                  </span>
                </div>

                {selectedEvidence.files[0]?.matched_asset ? (
                  <>
                    <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={forensicsAPI.getAssetImageUrl(selectedEvidence.files[0].matched_asset.original_asset_id)}
                        alt="Original Asset"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">SHA-256:</span>
                        <span className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {selectedEvidence.files[0].matched_asset.original_sha256?.substring(0, 16)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{selectedEvidence.files[0].matched_asset.original_filename}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-emerald-800">
                          <p className="font-medium">Cryptographic Verification</p>
                          <p className="text-xs text-emerald-700 mt-1">
                            This asset is registered in the secure ledger with verified integrity
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <FileImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No matching asset found</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Match Status */}
            {selectedEvidence.files[0]?.matched_asset && (
              <div className={`mt-6 p-4 rounded-lg border-2 ${
                selectedEvidence.files[0].verification_status === 'VERIFIED_AUTHENTIC'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedEvidence.files[0].verification_status === 'VERIFIED_AUTHENTIC' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedEvidence.files[0].verification_status === 'VERIFIED_AUTHENTIC'
                        ? 'Files Match Cryptographically'
                        : 'Files Do Not Match - Tampering Detected'}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedEvidence.files[0].verification_status === 'VERIFIED_AUTHENTIC'
                        ? 'The evidence file matches the registered asset bit-for-bit. No tampering detected.'
                        : 'The visual appearance matches but the cryptographic hashes differ. This indicates the file has been modified.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State for Compare Tab */}
        {activeTab === 'compare' && !selectedEvidence && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Scale className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Evidence to Compare</h3>
            <p className="text-slate-500 mb-6">Upload evidence files in the Analyze tab to enable side-by-side comparison</p>
            <button
              onClick={() => setActiveTab('analyze')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Analyze Evidence
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ForensicDashboard;