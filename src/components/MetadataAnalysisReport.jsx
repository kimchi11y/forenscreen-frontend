import React from 'react';

export default function MetadataAnalysisReport({ metadata }) {
  return (
    <div className="bg-white border border-[#c2c7d0] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#c2c7d0] flex justify-between items-center">
        <h3 className="text-xl font-medium">Metadata Analysis Report</h3>
        <button className="text-[#00375e] text-sm font-medium hover:underline">
          Full Analysis.json
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#f2f4f6]">
              <th className="px-6 py-3 text-xs font-bold tracking-wider uppercase text-[#42474f]">
                Attribute
              </th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider uppercase text-[#42474f]">
                Analyzed Value
              </th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider uppercase text-[#42474f]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c2c7d0]">
            {metadata.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 font-medium">{item.attribute}</td>
                <td className="px-6 py-4 font-mono text-xs text-[#42474f]">
                  {item.value}
                </td>
                <td className="px-6 py-4">
                  <div
                    className={`flex items-center gap-2 ${item.statusColor}`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {item.icon}
                    </span>
                    <span className="text-xs font-semibold">{item.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
