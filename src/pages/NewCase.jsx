import React from 'react';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';

export default function NewCase() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-[#191c1e]">
      <SideNavBar />
      <TopAppBar />

      <main className="ml-[280px] pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-16 py-8">
          <h2 className="text-4xl font-semibold text-[#00375e] mb-8">
            Create New Case
          </h2>

          <div className="bg-white border border-[#c2c7d0] rounded-xl p-8 max-w-2xl">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#191c1e] mb-1">
                  Case Number
                </label>
                <input
                  type="text"
                  className="w-full bg-[#f2f4f6] border border-[#c2c7d0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00375e]/10"
                  placeholder="2025-XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#191c1e] mb-1">
                  Case Title
                </label>
                <input
                  type="text"
                  className="w-full bg-[#f2f4f6] border border-[#c2c7d0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00375e]/10"
                  placeholder="Enter case title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#191c1e] mb-1">
                  Description
                </label>
                <textarea
                  className="w-full bg-[#f2f4f6] border border-[#c2c7d0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00375e]/10 h-32"
                  placeholder="Enter case description"
                />
              </div>
              <button
                type="submit"
                className="bg-[#00375e] text-white font-medium rounded-lg px-6 py-2.5 hover:opacity-90 transition-opacity"
              >
                Create Case
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
