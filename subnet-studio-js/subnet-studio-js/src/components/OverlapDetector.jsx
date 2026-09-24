import React, { useState } from 'react';
import { checkOverlap, validateIp, getNetworkDetails } from '../lib/iputils';
import { GitCompare, AlertTriangle, CheckCircle2 } from 'lucide-react';
export function OverlapDetector() {
  const [ip1, setIp1] = useState('10.0.0.0');
  const [cidr1, setCidr1] = useState(16);
  const [ip2, setIp2] = useState('10.0.1.0');
  const [cidr2, setCidr2] = useState(24);
  const isValid1 = validateIp(ip1);
  const isValid2 = validateIp(ip2);
  const isOverlap = isValid1 && isValid2 ? checkOverlap(ip1, cidr1, ip2, cidr2) : false;
  const details1 = isValid1 ? getNetworkDetails(ip1, cidr1) : null;
  const details2 = isValid2 ? getNetworkDetails(ip2, cidr2) : null;
  return <div className="space-y-6">
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h2 className="text-[11px] font-semibold tracking-widest text-zinc-600 dark:text-zinc-400 uppercase flex items-center gap-2 mb-6">
          <GitCompare className="w-4 h-4 text-amber-400" />
          Subnet Overlap & Conflict Detector
        </h2>
        
        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8">
          Check if a proposed CIDR block overlaps with an existing network allocation to prevent routing loops and packet drops.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Primary Network */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Primary Network</h3>
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="flex-1">
                <input type="text" value={ip1} onChange={e => setIp1(e.target.value)} className={`w-full bg-zinc-50/80 dark:bg-zinc-950/80 border ${isValid1 ? 'border-zinc-200/80 dark:border-zinc-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50' : 'border-red-500'} rounded-2xl px-5 py-4 text-zinc-900 dark:text-zinc-100 font-mono outline-none shadow-inner transition-all`} placeholder="e.g. 10.0.0.0" />
              </div>
              <div className="w-full xl:w-32 relative">
                <span className="absolute left-5 top-4 text-zinc-500 font-mono">/</span>
                <input type="number" min="0" max="32" value={cidr1} onChange={e => setCidr1(parseInt(e.target.value) || 0)} className="w-full bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-2xl pl-10 pr-5 py-4 text-zinc-900 dark:text-zinc-100 font-mono outline-none shadow-inner transition-all" />
              </div>
            </div>
            {details1 && <div className="bg-zinc-50/50 dark:bg-zinc-950/50 rounded-2xl p-5 text-sm space-y-3 border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Range:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{details1.network} - {details1.broadcast}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Size:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{details1.numHosts.toLocaleString()} hosts</span>
                </div>
              </div>}
          </div>

          {/* Proposed Network */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Proposed Network</h3>
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="flex-1">
                <input type="text" value={ip2} onChange={e => setIp2(e.target.value)} className={`w-full bg-zinc-50/80 dark:bg-zinc-950/80 border ${isValid2 ? 'border-zinc-200/80 dark:border-zinc-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50' : 'border-red-500'} rounded-2xl px-5 py-4 text-zinc-900 dark:text-zinc-100 font-mono outline-none shadow-inner transition-all`} placeholder="e.g. 10.0.1.0" />
              </div>
              <div className="w-full xl:w-32 relative">
                <span className="absolute left-5 top-4 text-zinc-500 font-mono">/</span>
                <input type="number" min="0" max="32" value={cidr2} onChange={e => setCidr2(parseInt(e.target.value) || 0)} className="w-full bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-2xl pl-10 pr-5 py-4 text-zinc-900 dark:text-zinc-100 font-mono outline-none shadow-inner transition-all" />
              </div>
            </div>
            {details2 && <div className="bg-zinc-50/50 dark:bg-zinc-950/50 rounded-2xl p-5 text-sm space-y-3 border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Range:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{details2.network} - {details2.broadcast}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Size:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{details2.numHosts.toLocaleString()} hosts</span>
                </div>
              </div>}
          </div>
        </div>

        {/* Result */}
        {isValid1 && isValid2 && <div className={`mt-8 p-6 rounded-2xl border flex items-start gap-4 ${isOverlap ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(248,113,113,0.1)]' : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.1)]'}`}>
            {isOverlap ? <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" /> : <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />}
            
            <div>
              <h4 className={`text-lg font-medium mb-1 ${isOverlap ? 'text-red-400' : 'text-emerald-400'}`}>
                {isOverlap ? 'Conflict Detected: Subnets Overlap' : 'Clear: No Subnet Overlap'}
              </h4>
              <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                {isOverlap ? `The proposed network ${ip2}/${cidr2} collides with the primary network ${ip1}/${cidr1}. ${cidr1 < cidr2 ? 'The proposed network is contained within the primary.' : cidr1 > cidr2 ? 'The primary network is contained within the proposed.' : 'Both networks are identical.'} Deploying these together will cause routing errors.` : `The proposed network ${ip2}/${cidr2} does not collide with ${ip1}/${cidr1}. They occupy discrete address spaces and can be routed simultaneously.`}
              </p>
            </div>
          </div>}
      </div>
    </div>;
}
