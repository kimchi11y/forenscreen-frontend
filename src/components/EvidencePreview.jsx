import React from 'react';

export default function EvidencePreview({ imageUrl, fileName, verified = true }) {
  return (
    <div className="bg-white border border-[#c2c7d0] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#c2c7d0] flex justify-between items-center bg-[#f2f4f6]">
        <span className="text-xs font-bold tracking-wider uppercase text-[#42474f]">
          Primary Evidence Preview
        </span>
        <div className="flex gap-2">
          {verified && (
            <span className="bg-[#83f5c6] text-[#007151] px-2 py-0.5 rounded-full text-xs font-semibold">
              VERIFIED
            </span>
          )}
          <span className="text-xs text-[#42474f]">{fileName}</span>
        </div>
      </div>
      <div className="aspect-video relative bg-[#d8dadc] flex items-center justify-center p-6">
        <img
          className="max-w-full max-h-full rounded-lg object-contain shadow-md"
          alt="Forensic capture"
          src={imageUrl}
        />
        <div className="absolute bottom-6 right-6 flex gap-2">
          <button className="p-2 bg-white/80 backdrop-blur rounded-lg border border-[#c2c7d0] hover:bg-white transition-colors">
            <span className="material-symbols-outlined">zoom_in</span>
          </button>
          <button className="p-2 bg-white/80 backdrop-blur rounded-lg border border-[#c2c7d0] hover:bg-white transition-colors">
            <span className="material-symbols-outlined">fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
