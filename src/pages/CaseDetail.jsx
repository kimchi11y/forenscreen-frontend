import React from 'react';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';

export default function CaseDetail() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-[#191c1e]">
      <SideNavBar />
      <TopAppBar />

      <main className="ml-[280px] pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-16 py-8">
          <h2 className="text-4xl font-semibold text-[#00375e] mb-8">
            Case Detail
          </h2>

          <div className="bg-white border border-[#c2c7d0] rounded-xl p-8">
            <p className="text-[#42474f]">Case details will be displayed here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
