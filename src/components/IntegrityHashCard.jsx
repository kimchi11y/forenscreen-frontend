import React, { useState } from 'react';

export default function IntegrityHashCard({ hashValue, verified = true }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hashValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#c2c7d0] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#00375e] style-fill">
            verified
          </span>
          <h3 className="text-xl font-medium text-[#191c1e]">
            SHA-256 Integrity Hash
          </h3>
        </div>
        {verified && (
          <span className="px-3 py-1 bg-[#83f5c6] text-[#007151] text-xs font-bold rounded-full">
            INTEGRITY VERIFIED
          </span>
        )}
      </div>
      <div className="bg-[#f2f4f6] rounded-lg p-4 flex items-center justify-between gap-4 border border-[#c2c7d0]">
        <code className="font-mono text-xs text-[#00375e] break-all">
          {hashValue}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#e6e8ea] rounded transition-colors text-[#42474f] shrink-0"
        >
          <span className="material-symbols-outlined text-sm">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span className="text-xs font-medium">
            {copied ? 'COPIED!' : 'COPY'}
          </span>
        </button>
      </div>
    </div>
  );
}
