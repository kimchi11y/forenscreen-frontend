import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/evidence-submission', icon: 'upload_file', label: 'Evidence Submission' },
];

export default function SideNavBar() {
  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-[#00375e] dark:bg-[#2d3133] border-r border-[#c2c7d0] flex flex-col p-4 z-20">
      <div className="mb-8 px-4 py-2">
        <h1 className="text-2xl font-bold text-white">ForenScreen</h1>
        <p className="text-sm text-white/60">Forensic Unit</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 transition-colors rounded-lg ${
                isActive
                  ? 'bg-[#1f4e79] text-[#95bff1]'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto text-white/50 text-sm px-4">
        <p>Digital Evidence Fingerprinting System</p>
      </div>
    </aside>
  );
}
