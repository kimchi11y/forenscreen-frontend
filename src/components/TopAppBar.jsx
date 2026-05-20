import React from 'react';

export default function TopAppBar() {
  return (
    <header className="flex justify-between items-center h-16 ml-[280px] px-16 bg-[#f7f9fb] border-b border-[#c2c7d0] fixed top-0 right-0 left-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42474f]">
            search
          </span>
          <input
            className="w-full bg-[#f2f4f6] border border-[#c2c7d0] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00375e]/10"
            placeholder="Search evidence ID, officer or date..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button className="text-[#42474f] hover:bg-[#f2f4f6] p-2 transition-colors rounded-md">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-[#42474f] hover:bg-[#f2f4f6] p-2 transition-colors rounded-md">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-[#c2c7d0]">
          <img
            className="w-8 h-8 rounded-full object-cover"
            alt="Investigator headshot"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKDuUU44RfIE8qTK67z7CV3DU47KOLM9bpdZ3owRouuUZtbafiYWz9bksBK-i4ut4zqaDxibPF3lv0UvPft_JJt7snW_q2VPzn2-jyRyazOIUrcC2tcYu-1aVl_iZgQNcJF6srtkO-PSkhHwOJO5OJRLlfHeKoYFCPhvHOb1Crc1IF-9-QujWLAicCUMUIB1jPQwP7ZQA0qGHXNvhQ-8lVQxnTfZpHzFNLER9dSfds5jnZ_l7X5_fVY3L2KNqXvNizg9up4LHLI_15"
          />
          <div className="hidden lg:block text-right">
            <p className="text-sm font-semibold">Det. J. Miller</p>
            <p className="text-xs text-[#42474f]">Senior Analyst</p>
          </div>
        </div>
      </div>
    </header>
  );
}
