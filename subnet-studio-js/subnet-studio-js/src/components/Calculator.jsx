import React, { useState, useMemo } from 'react';
import { getNetworkDetails, getSubnets, validateIp, cidrToMaskLong, longToIp, validateIpv6, getIpv6Details } from '../lib/iputils';
import { Copy, Terminal, Shield, Download, CheckCircle2, Binary, Globe, Lock, Network, Target } from 'lucide-react';
import { ExpandableCheatSheet } from './CheatSheet';
import { motion, AnimatePresence } from 'motion/react';
import { SubnetTree } from './SubnetTree';
export function Calculator() {
  const [ip, setIp] = useState('10.0.0.0');
  const [cidr, setCidr] = useState(8);
  const [splitTo, setSplitTo] = useState(24);
  const [requiredHosts, setRequiredHosts] = useState('');
  const isValidV4 = validateIp(ip);
  const isValidV6 = validateIpv6(ip);
  const isValid = isValidV4 || isValidV6;
  const isV6 = isValidV6;
  const details = useMemo(() => {
    if (isValidV4) return getNetworkDetails(ip, cidr);
    return null;
  }, [ip, cidr, isValidV4]);
  const v6Details = useMemo(() => {
    if (isValidV6) return getIpv6Details(ip);
    return null;
  }, [ip, isValidV6]);
  const partialClass = useMemo(() => {
    if (isV6) return {
      ipClass: '-',
      type: '-'
    };
    const parts = ip.split('.');
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);
    let ipClass = 'Unknown';
    if (first >= 1 && first <= 126) ipClass = 'A';else if (first >= 128 && first <= 191) ipClass = 'B';else if (first >= 192 && first <= 223) ipClass = 'C';else if (first >= 224 && first <= 239) ipClass = 'D (Multicast)';else if (first >= 240 && first <= 255) ipClass = 'E (Experimental)';
    let type = 'Public';
    if (first === 10) type = 'Private (RFC 1918)';else if (first === 172 && !isNaN(second) && second >= 16 && second <= 31) type = 'Private (RFC 1918)';else if (first === 192 && second === 168) type = 'Private (RFC 1918)';else if (first === 127) type = 'Loopback';else if (first === 169 && second === 254) type = 'APIPA (Link-Local)';else if (first >= 224) type = 'Reserved';
    if (isNaN(first)) {
      ipClass = '-';
      type = '-';
    }
    return {
      ipClass,
      type
    };
  }, [ip]);
  const handleIpChange = e => {
    const newIp = e.target.value;
    setIp(newIp);
    const newIsV6 = validateIpv6(newIp);
    const oldIsV6 = validateIpv6(ip);
    if (newIsV6 && !oldIsV6) {
      setCidr(64);
    } else if (!newIsV6) {
      const oldFirst = parseInt(ip.split('.')[0], 10);
      const newFirst = parseInt(newIp.split('.')[0], 10);
      if (!isNaN(newFirst) && newFirst !== oldFirst) {
        if (newFirst >= 1 && newFirst <= 126) setCidr(8);else if (newFirst >= 128 && newFirst <= 191) setCidr(16);else if (newFirst >= 192 && newFirst <= 223) setCidr(24);
      }
    }
  };
  const splitSubnets = useMemo(() => {
    if (!isValidV4 || splitTo <= cidr || splitTo > cidr + 8 || splitTo > 32) return [];
    return getSubnets(ip, cidr, splitTo);
  }, [ip, cidr, splitTo, isValidV4]);
  const optimalSubnet = useMemo(() => {
    if (!requiredHosts || typeof requiredHosts !== 'number' || requiredHosts <= 0) return null;

    // Calculate required addresses including network and broadcast
    const neededAddresses = requiredHosts + 2;
    // Find the nearest power of 2
    let power = Math.ceil(Math.log2(neededAddresses));
    if (power < 0) power = 0;
    if (power > 32) return {
      error: 'Too many hosts'
    };
    const suggestedCidr = 32 - power;
    const providedAddresses = Math.pow(2, power);
    const providedHosts = providedAddresses - 2;
    const wastageCount = providedHosts - requiredHosts;
    const wastagePercent = providedHosts > 0 ? (wastageCount / providedHosts * 100).toFixed(1) : "0";
    return {
      cidr: suggestedCidr,
      hosts: providedHosts,
      wastageCount,
      wastagePercent,
      error: null
    };
  }, [requiredHosts]);
  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
  };
  const generatePlaybook = () => {
    if (!details) return;
    const content = `#!/bin/bash
# Subnet Studio Playbook for ${details.network}/${details.cidr}

echo "Applying UFW rules..."
sudo ufw deny from ${details.network}/${details.cidr} to any port 22
sudo ufw allow from ${details.network}/${details.cidr} to any port 80
sudo ufw allow from ${details.network}/${details.cidr} to any port 443
sudo ufw reload

echo "Running Nmap Reconnaissance..."
nmap -sV -O ${details.network}/${details.cidr} -oN nmap_scan_${details.network.replace(/\./g, '_')}.txt
`;
    const blob = new Blob([content], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playbook_${details.network}_${details.cidr}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const renderBinaryBreakdown = (binaryStr, cidrLen, label, ipValue, isV6 = false) => {
    const blocks = isV6 ? binaryStr.match(/.{1,16}/g) || [] : binaryStr.match(/.{1,8}/g) || [];
    const labels = isV6 ? ipValue.split(':') : ipValue.split('.');
    return <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 items-start xl:items-center w-full">
        <div className="text-[10px] font-semibold tracking-widest text-zinc-500 xl:w-12 shrink-0">{label}</div>
        <div className="flex flex-wrap gap-4 md:gap-6 w-full">
          {blocks.map((block, blockIdx) => <div key={blockIdx} className="flex flex-col items-center gap-2">
              <div className="flex gap-0.5 sm:gap-1 bg-zinc-50/80 dark:bg-zinc-950/80 p-1 sm:p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-inner">
                {block.split('').map((bit, bitIdx) => {
              const overallIdx = isV6 ? blockIdx * 16 + bitIdx : blockIdx * 8 + bitIdx;
              const isNetwork = overallIdx < cidrLen;
              const isOne = bit === '1';
              let bitClass = 'w-3 h-5 sm:w-4 sm:h-6 md:w-5 md:h-6 lg:w-6 lg:h-7 flex items-center justify-center rounded text-[10px] sm:text-xs font-mono font-medium transition-all duration-300 ';
              if (isNetwork) {
                if (isOne) {
                  bitClass += 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.25)] border border-emerald-500/40';
                } else {
                  bitClass += 'bg-emerald-500/5 text-emerald-500/40 border border-emerald-500/10';
                }
              } else {
                if (isOne) {
                  bitClass += 'bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(248,113,113,0.25)] border border-red-500/40';
                } else {
                  bitClass += 'bg-red-500/5 text-red-500/40 border border-red-500/10';
                }
              }
              return <motion.div key={bitIdx} className={bitClass} initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                delay: overallIdx * (isV6 ? 0.002 : 0.01)
              }}>
                      {bit}
                    </motion.div>;
            })}
              </div>
              <div className="text-[10px] sm:text-xs font-mono text-zinc-600 dark:text-zinc-400 tracking-wider">
                {labels[blockIdx]}
              </div>
            </div>)}
        </div>
      </div>;
  };
  return <div className="space-y-8">
      
      {/* Input Section */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="relative bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
          <div className="flex-1 w-full flex flex-col group">
            <label className="text-[11px] font-semibold tracking-widest text-zinc-500 uppercase mb-3">
               IP Address
            </label>
            <input type="text" value={ip} onChange={handleIpChange} className={`w-full bg-zinc-50/80 dark:bg-zinc-950/80 border ${isValid ? 'border-zinc-200/80 dark:border-zinc-800/80 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50' : 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'} rounded-2xl px-5 py-4 text-zinc-900 dark:text-zinc-100 font-mono text-2xl sm:text-3xl outline-none transition-all shadow-inner`} placeholder="e.g. 10.0.0.0" />
            
            <AnimatePresence>
              {partialClass.ipClass !== '-' && <motion.div initial={{
              opacity: 0,
              y: -10
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0
            }} className="flex flex-wrap items-center gap-3 mt-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80">
                    <Network className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-zinc-700 dark:text-zinc-300">
                      Class {partialClass.ipClass}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${partialClass.type.includes('Private') ? 'bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300' : 'bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.15)]'}`}>
                    {partialClass.type.includes('Private') ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    <span className="text-[11px] sm:text-xs uppercase tracking-widest font-semibold">
                      {partialClass.type}
                    </span>
                  </div>
                </motion.div>}
      
        {isValidV6 && v6Details && <motion.div key="v6-results" initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -20
            }} className="space-y-8">
            {/* IPv6 Binary Breakdown */}
            <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h3 className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Binary className="w-4 h-4 text-sky-400" /> IPv6 Binary Breakdown
                </h3>
                <div className="flex gap-4 text-[11px] font-medium tracking-wide uppercase">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-sky-400/80 border border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]"></div>Network Prefix ({cidr})</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-indigo-400/80 border border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>Interface ID ({128 - cidr})</span>
                </div>
              </div>
              
              <div className="space-y-8 overflow-x-auto scrollbar-hide pb-4">
                {renderBinaryBreakdown(v6Details.binary, cidr, "IP", v6Details.expanded, true)}
              </div>
            </div>

            {/* IPv6 Details */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-sm">
                <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">IPv6 Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <DetailItem label="Expanded Address" value={v6Details.expanded} highlight />
                  <DetailItem label="Interface Type" value={v6Details.type} highlight />
                  <DetailItem label="Network Prefix Length" value={`/${cidr}`} />
                  <DetailItem label="Total Addresses in Prefix" value={cidr === 128 ? "1" : `2^${128 - cidr}`} />
                </div>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>
          </div>

          <div className="flex-1 w-full flex flex-col group">
            <label className="text-[11px] font-semibold tracking-widest text-zinc-500 uppercase mb-3">
               CIDR Prefix
            </label>
            
            <div className="flex items-baseline gap-3 mb-4 h-[42px] sm:h-[48px]">
              <span className="text-4xl sm:text-5xl font-semibold text-sky-400 font-mono tracking-tight">/{cidr}</span>
              {!isV6 && <span className="text-sm sm:text-base text-zinc-500 font-mono tracking-wider">{longToIp(cidrToMaskLong(cidr))}</span>}
            </div>

            <input type="range" min="0" max={isV6 ? "128" : "32"} value={cidr} onChange={e => setCidr(parseInt(e.target.value) || 0)} className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer mb-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform" style={{
            background: `linear-gradient(to right, #38bdf8 ${cidr / (isV6 ? 128 : 32) * 100}%, #27272a ${cidr / (isV6 ? 128 : 32) * 100}%)`
          }} />
            
            <div className="flex flex-wrap gap-2">
              {(isV6 ? [48, 64, 96, 128] : [8, 16, 24, 26, 27, 28, 30]).map(val => <button key={val} onClick={() => setCidr(val)} className={`px-3 sm:px-4 py-2 rounded-xl font-mono text-xs sm:text-sm transition-colors border ${cidr === val ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.1)]' : 'bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                  /{val}
                </button>)}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {isValidV4 && details && <motion.div key="results" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: -20
      }} className="space-y-8">
            {/* Binary Breakdown */}
            <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h3 className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Binary className="w-4 h-4 text-emerald-400" /> Binary Breakdown
                </h3>
                <div className="flex gap-4 text-[11px] font-medium tracking-wide uppercase">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-400/80 border border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"></div>Network Bits ({details.cidr})</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-400/80 border border-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]"></div>Host Bits ({32 - details.cidr})</span>
                </div>
              </div>
              
              <div className="space-y-8">
                {renderBinaryBreakdown(details.ipBinary, details.cidr, "IP", details.ip)}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800/80 to-transparent opacity-50"></div>
                {renderBinaryBreakdown(details.maskBinary, details.cidr, "MASK", details.mask)}
              </div>
            </div>

            {/* Details & Class */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-sm">
                <h3 className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Network Bounds</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                  <DetailItem label="Network Address" value={details.network} highlight />
                  <DetailItem label="Broadcast Address" value={details.broadcast} highlight />
                  <DetailItem label="Subnet Mask" value={details.mask} />
                  <DetailItem label="Total Usable Hosts" value={details.numHosts.toLocaleString()} />
                  <DetailItem label="First Host" value={details.hostMin} />
                  <DetailItem label="Last Host" value={details.hostMax} />
                </div>
              </div>
            </div>

            {/* CLI & Playbook */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-sm">
                <h3 className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" /> CLI Export
                </h3>
                <div className="space-y-3">
                  <CliCommand title="NMAP — FULL SCAN" command={`nmap -sV ${details.network}/${details.cidr}`} onCopy={copyToClipboard} />
                  <CliCommand title="NMAP — PING SWEEP" command={`nmap -sn ${details.network}/${details.cidr}`} onCopy={copyToClipboard} />
                  <CliCommand title="UFW — ALLOW INBOUND" command={`ufw allow from ${details.network}/${details.cidr}`} onCopy={copyToClipboard} />
                </div>
              </div>
              
              <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <h3 className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-emerald-400" /> SecOps Playbook Generator
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 flex-1 leading-relaxed">
                  Generate a ready-to-deploy bash script containing Kali Linux reconnaissance commands and UFW hardening rules tailored to <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded">{details.network}/{details.cidr}</span>.
                </p>
                <button onClick={generatePlaybook} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]">
                  <Download className="w-4 h-4" /> Download .sh Playbook
                </button>
              </div>
            </div>

            {/* Subnet Splitter */}
            {cidr < 30 && <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-wide">Subnet Splitter (VLSM)</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Divide this network into smaller subnets</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-500">Split into:</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-zinc-500 font-mono text-sm">/</span>
                      <select value={splitTo} onChange={e => setSplitTo(parseInt(e.target.value))} className="bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl pl-7 pr-8 py-2 text-zinc-800 dark:text-zinc-200 font-mono text-sm appearance-none outline-none focus:border-emerald-500/50 shadow-inner">
                        {Array.from({
                    length: Math.min(8, 32 - cidr)
                  }).map((_, i) => {
                    const val = cidr + i + 1;
                    if (val > 32) return null;
                    return <option key={val} value={val}>{val}</option>;
                  })}
                      </select>
                    </div>
                  </div>
                </div>
                
                {splitSubnets.length > 0 && <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500">
                          <th className="pb-3 font-semibold text-[10px] uppercase tracking-widest">Network</th>
                          <th className="pb-3 font-semibold text-[10px] uppercase tracking-widest">Host Range</th>
                          <th className="pb-3 font-semibold text-[10px] uppercase tracking-widest">Broadcast</th>
                          <th className="pb-3 font-semibold text-[10px] uppercase tracking-widest text-right">Hosts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {splitSubnets.map((sub, i) => <tr key={i} className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 font-mono text-emerald-400">{sub.network}/{sub.cidr}</td>
                            <td className="py-3 font-mono text-zinc-600 dark:text-zinc-400">{sub.hostMin} - {sub.hostMax}</td>
                            <td className="py-3 font-mono">{sub.broadcast}</td>
                            <td className="py-3 font-mono text-right">{sub.numHosts}</td>
                          </tr>)}
                      </tbody>
                    </table>
                    {splitTo - cidr > 8 && <div className="mt-4 text-center text-xs text-zinc-500">
                        Showing up to 256 subnets maximum to maintain performance.
                      </div>}
                  </div>}
                
                <SubnetTree originalIp={details.network} originalCidr={details.cidr} targetCidr={splitTo} />
              </div>}

            {/* Host Requirement Matcher */}
            <div className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-wide flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-sky-400" /> Host Requirement Matcher
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">Find the smallest subnet for your required hosts</p>
                  
                  <div className="relative max-w-xs">
                    <input type="number" min="1" value={requiredHosts} onChange={e => setRequiredHosts(e.target.value ? parseInt(e.target.value) : '')} placeholder="Enter number of hosts..." className="w-full bg-zinc-50/80 dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/80 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 rounded-xl px-4 py-2.5 text-zinc-800 dark:text-zinc-200 font-mono text-sm outline-none shadow-inner" />
                  </div>
                </div>

                <div className="flex-1 w-full bg-zinc-50/50 dark:bg-zinc-950/50 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800/80 min-h-[120px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {!requiredHosts ? <motion.div key="empty" initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} exit={{
                  opacity: 0
                }} className="text-zinc-500 text-sm font-medium">
                        Enter a number to see the optimal CIDR
                      </motion.div> : optimalSubnet?.error ? <motion.div key="error" initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} exit={{
                  opacity: 0
                }} className="text-red-400 text-sm font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4" /> {optimalSubnet.error}
                      </motion.div> : optimalSubnet ? <motion.div key="result" initial={{
                  opacity: 0,
                  scale: 0.95
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} exit={{
                  opacity: 0
                }} className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                          <div className="text-[10px] font-semibold text-zinc-500 tracking-widest uppercase mb-1">Suggested Subnet</div>
                          <div className="text-3xl font-semibold font-mono text-sky-400">/{optimalSubnet.cidr}</div>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center min-w-[90px]">
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-semibold">Total Hosts</div>
                            <div className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{optimalSubnet.hosts}</div>
                          </div>
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center min-w-[90px]">
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-semibold">Wastage</div>
                            <div className={`font-mono font-medium ${parseFloat(optimalSubnet.wastagePercent) > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {optimalSubnet.wastagePercent}%
                            </div>
                          </div>
                        </div>
                      </motion.div> : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Expandable Cheat Sheet */}
            <ExpandableCheatSheet />

          </motion.div>}
      </AnimatePresence>
    </div>;
}
function DetailItem({
  label,
  value,
  highlight = false
}) {
  return <div className="group">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5 font-semibold">{label}</div>
      <div className={`font-mono text-sm sm:text-base transition-colors ${highlight ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:hover:text-zinc-950 dark:text-white'}`}>
        {value}
      </div>
    </div>;
}
function CliCommand({
  title,
  command,
  onCopy
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return <motion.div whileHover={{
    scale: 1.01
  }} className="group bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-white dark:hover:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl p-4 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] font-semibold text-zinc-500 tracking-widest uppercase">{title}</div>
        <div className="font-mono text-emerald-400 text-sm">
          {command}
        </div>
      </div>
      <button onClick={handleCopy} className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors">
        {copied ? <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500">Copied</span>
          </> : <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </>}
      </button>
    </motion.div>;
}
