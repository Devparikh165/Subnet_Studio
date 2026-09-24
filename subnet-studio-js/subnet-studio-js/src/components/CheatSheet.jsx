import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { cidrToMaskLong, longToIp } from '../lib/iputils';
export function ExpandableCheatSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const cheatSheetData = Array.from({
    length: 25
  }).map((_, i) => {
    const cidr = i + 8; // /8 to /32
    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = cidr === 32 ? 1 : cidr === 31 ? 2 : totalHosts - 2;
    const mask = longToIp(cidrToMaskLong(cidr));
    return {
      cidr,
      mask,
      totalHosts,
      usableHosts
    };
  });
  return <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl shadow-xl overflow-hidden mt-8 transition-all">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-zinc-600 dark:text-zinc-400">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Quick-Reference Cheat Sheet
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />}
      </button>

      {isOpen && <div className="px-6 pb-6 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="pb-3 font-medium">CIDR</th>
                  <th className="pb-3 font-medium">Subnet Mask</th>
                  <th className="pb-3 font-medium text-right">Total Hosts</th>
                  <th className="pb-3 font-medium text-right">Usable Hosts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {cheatSheetData.map(row => <tr key={row.cidr} className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 font-mono text-indigo-400">/{row.cidr}</td>
                    <td className="py-2.5 font-mono">{row.mask}</td>
                    <td className="py-2.5 font-mono text-right">{row.totalHosts.toLocaleString()}</td>
                    <td className="py-2.5 font-mono text-right">{row.usableHosts.toLocaleString()}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>}
    </div>;
}
