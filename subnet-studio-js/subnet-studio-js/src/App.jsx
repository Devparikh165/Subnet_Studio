import React, { useState, useEffect } from 'react';
import { Calculator } from './components/Calculator';
import { OverlapDetector } from './components/OverlapDetector';
import { Network, GitCompare, Server, Sun, Moon } from 'lucide-react';
export default function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 selection:bg-emerald-500/30 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Subnet Studio</h1>
              <div className="text-[10px] uppercase tracking-widest text-emerald-500 font-medium">SecOps Dashboard</div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-1 bg-white/50 dark:bg-zinc-900/50 p-1 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 transition-colors duration-300">
              <TabButton active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} icon={<Network className="w-4 h-4" />} label="Calculator & Playbooks" />
              <TabButton active={activeTab === 'overlap'} onClick={() => setActiveTab('overlap')} icon={<GitCompare className="w-4 h-4" />} label="Conflict Detector" />
            </nav>
            <button onClick={() => setIsDark(!isDark)} className="p-2.5 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Toggle theme">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-between p-2 gap-2">
          <div className="flex overflow-x-auto scrollbar-hide gap-2">
            <TabButton active={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} icon={<Network className="w-4 h-4" />} label="Calculator" />
            <TabButton active={activeTab === 'overlap'} onClick={() => setActiveTab('overlap')} icon={<GitCompare className="w-4 h-4" />} label="Conflicts" />
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 shrink-0 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" aria-label="Toggle theme">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {activeTab === 'calculator' && <Calculator />}
        {activeTab === 'overlap' && <OverlapDetector />}
      </main>
    </div>;
}
function TabButton({
  active,
  onClick,
  icon,
  label
}) {
  return <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${active ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:bg-zinc-800/50'}`}>
      {icon}
      {label}
    </button>;
}
