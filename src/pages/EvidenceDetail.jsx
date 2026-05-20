import React from 'react';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';
import EvidencePreview from '../components/EvidencePreview';
import IntegrityHashCard from '../components/IntegrityHashCard';
import MetadataAnalysisReport from '../components/MetadataAnalysisReport';
import CustodyTimeline from '../components/CustodyTimeline';

const mockMetadata = [
  {
    attribute: 'DateTimeOriginal',
    value: '2025:01:14 14:32:05',
    status: 'Valid',
    icon: 'check_circle',
    statusColor: 'text-[#006c4e]',
  },
  {
    attribute: 'Device',
    value: 'Sony Alpha 7 IV (Internal ID: SN_49202)',
    status: 'Authenticated',
    icon: 'check_circle',
    statusColor: 'text-[#006c4e]',
  },
  {
    attribute: 'GPS Coordinates',
    value: '40.7128° N, 74.0060° W',
    status: 'Geolocation Lock',
    icon: 'location_on',
    statusColor: 'text-[#006c4e]',
  },
  {
    attribute: 'Software',
    value: 'A7R4 v1.20 Firmware',
    status: 'Signed',
    icon: 'shield',
    statusColor: 'text-[#006c4e]',
  },
  {
    attribute: 'Manipulation Flags',
    value: 'ELA: 0.02% Deviation (Threshold: 5%)',
    status: 'No Manipulation',
    icon: 'check_circle',
    statusColor: 'text-[#006c4e]',
  },
];

const mockTimelineEvents = [
  {
    title: 'Evidence Uploaded',
    timestamp: 'Jan 14, 2025 • 15:10:00',
    icon: 'upload',
    iconBgColor: 'bg-[#00375e]',
    details: (
      <p className="text-xs mt-2 text-[#42474f] bg-[#f2f4f6] p-2 rounded">
        Terminal ID: T-01-MILLER
      </p>
    ),
  },
  {
    title: 'Hash Recorded',
    timestamp: 'Jan 14, 2025 • 15:10:02',
    icon: 'tag',
    iconBgColor: 'bg-[#00375e]',
  },
  {
    title: 'Metadata Extracted',
    timestamp: 'Jan 14, 2025 • 15:10:15',
    icon: 'description',
    iconBgColor: 'bg-[#00375e]',
  },
  {
    title: 'Origin URL Captured',
    timestamp: 'Jan 14, 2025 • 15:10:45',
    icon: 'public',
    iconBgColor: 'bg-[#00375e]',
  },
  {
    title: 'Integrity Verified',
    timestamp: 'Jan 14, 2025 • 15:11:10',
    icon: 'check',
    iconBgColor: 'bg-[#006c4e]',
  },
  {
    title: 'Ethereum Anchored',
    timestamp: 'Jan 14, 2025 • 15:12:00',
    icon: 'token',
    iconBgColor: 'bg-[#1f4e79]',
    iconColor: 'text-[#95bff1]',
    details: (
      <div className="mt-3 p-3 bg-[#eceef0] rounded-lg border border-[#c2c7d0]">
        <p className="text-[10px] uppercase font-bold tracking-wider text-[#42474f] mb-1">
          Transaction Hash
        </p>
        <p className="font-mono text-[11px] text-[#00375e] truncate">
          0x9e8c...a4f3
        </p>
        <a
          className="inline-flex mt-2 text-[11px] text-[#00375e] hover:underline items-center gap-1"
          href="#etherscan"
        >
          View on Etherscan{' '}
          <span className="material-symbols-outlined text-[12px]">
            open_in_new
          </span>
        </a>
      </div>
    ),
  },
];

export default function EvidenceDetail() {
  const hashValue =
    '4a5e62c12a7a4067a98d30e3f538e1b5c6f932e93a0b5f1a2c3d4e5f6a7b8c9d';

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-[#191c1e]">
      <SideNavBar />
      <TopAppBar />

      <main className="ml-[280px] pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-16 py-8">
          {/* Page Header */}
          <div className="flex justify-between items-end mb-8">
            <div>
              <nav className="flex items-center gap-2 text-[#42474f] text-xs mb-2">
                <span>Cases</span>
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
                <span>Case #2025-X09</span>
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
                <span className="text-[#00375e] font-medium">EV-2025-001</span>
              </nav>
              <h2 className="text-4xl font-semibold text-[#00375e]">
                Evidence Detail
              </h2>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-transparent border border-[#c2c7d0] text-[#00375e] font-medium rounded-lg hover:bg-[#f2f4f6] transition-colors">
                <span className="material-symbols-outlined">verified_user</span>
                Verify File Integrity
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-[#00375e] text-white font-medium rounded-lg hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined">file_download</span>
                Generate Court Export
              </button>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column: Evidence Preview & Metadata */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <EvidencePreview
                imageUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuDXYZCz23ugbaBB1g5yEXbD7zQBiS3spZMKDGclbaiEU91e1ZekU-zw3nZ5dpZ7769TmBDTeQ1IdIwP_FpRoYVZKs-Q5MJVcuZHxVwuzRFyx_eIl1NlRNCiSfTKu8xYgzYDmBFAJNV5J-xHZMdDcXmqBdY6bwgiSEpraYHO3jPAaxOX9VDE5hNEY413xxcn1jA-wXSmnVFuzKQSwySXR5jHT2pKF6MVGZGtaL8FRSPiWRRaR0ubypGGURm-IBOm2zNPvVA1NIYpNAAP"
                fileName="EV-2025-001.JPG"
                verified
              />
              <IntegrityHashCard hashValue={hashValue} verified />
              <MetadataAnalysisReport metadata={mockMetadata} />
            </div>

            {/* Right Column: Blockchain Custody Timeline */}
            <div className="col-span-12 lg:col-span-4">
              <CustodyTimeline events={mockTimelineEvents} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
