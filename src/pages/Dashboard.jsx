import React from 'react';
import SideNavBar from '../components/SideNavBar';
import TopAppBar from '../components/TopAppBar';

export default function Dashboard() {
  const stats = [
    { label: 'Active Cases', value: '12', color: 'bg-[#00375e]' },
    { label: 'Evidence Items', value: '247', color: 'bg-[#006c4e]' },
    { label: 'Pending Verification', value: '8', color: 'bg-[#1f4e79]' },
    { label: 'Blockchain Anchored', value: '239', color: 'bg-[#83f5c6]' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans text-[#191c1e]">
      <SideNavBar />
      <TopAppBar />

      <main className="ml-[280px] pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-16 py-8">
          <h2 className="text-4xl font-semibold text-[#00375e] mb-8">
            Dashboard
          </h2>

          <div className="grid grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white border border-[#c2c7d0] rounded-xl p-6">
                <p className="text-sm text-[#42474f] mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color} text-white rounded-lg px-3 py-1 inline-block`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#c2c7d0] rounded-xl p-6">
            <h3 className="text-xl font-medium mb-4">Recent Activity</h3>
            <p className="text-[#42474f]">No recent activity to display.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
