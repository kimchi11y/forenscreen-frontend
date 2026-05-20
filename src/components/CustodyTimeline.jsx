import React from 'react';

export default function CustodyTimeline({ events }) {
  return (
    <div className="bg-white border border-[#c2c7d0] rounded-xl p-6 sticky top-24">
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-[#00375e]">link</span>
        <h3 className="text-xl font-medium text-[#191c1e]">
          Custody Timeline
        </h3>
      </div>

      <div className="space-y-0">
        {events.map((event, index) => (
          <div key={index} className="relative pl-8 pb-8">
            {index < events.length - 1 && (
              <div className="absolute left-[11px] top-0 bottom-0 w-px bg-[#c2c7d0]"></div>
            )}
            <div
              className={`absolute left-0 top-0 w-6 h-6 rounded-full ${event.iconBgColor} flex items-center justify-center z-10`}
            >
              <span
                className={`material-symbols-outlined ${event.iconColor || 'text-white'} text-xs`}
              >
                {event.icon}
              </span>
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${
                  event.title === 'Integrity Verified'
                    ? 'text-[#006c4e]'
                    : 'text-[#00375e]'
                }`}
              >
                {event.title}
              </p>
              <p className="text-xs text-[#42474f]">{event.timestamp}</p>
              {event.details && <div className="mt-2">{event.details}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
