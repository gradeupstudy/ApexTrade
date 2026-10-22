import React from 'react';
import { 
  TrendingUp, 
  Plus, 
  BarChart3, 
  BookOpen, 
  Brain, 
  Layers, 
  Image as ImageIcon,
  Download,
  Wallet
} from 'lucide-react';
import { formatINRCompact } from '../utils/calculations';

interface HeaderProps {
  activeTab: 'dashboard' | 'trades' | 'live_chart' | 'emotions' | 'strategy' | 'charts';
  setActiveTab: (tab: 'dashboard' | 'trades' | 'live_chart' | 'emotions' | 'strategy' | 'charts') => void;
  onOpenNewTrade: () => void;
  onOpenSettings: () => void;
  totalCapital: number;
  capitalAvailable: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTrade,
  onOpenSettings,
  totalCapital,
  capitalAvailable
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            ApexTrade Pro
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'trades'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Trade Journal</span>
          </button>

          <button
            onClick={() => setActiveTab('live_chart')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'live_chart'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('emotions')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'emotions'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Emotional Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('strategy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'strategy'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'charts'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Chart Vault</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Quick Capital Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 transition-colors"
            title="Configure Total Capital & Journal Settings"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Avail:</span>
            <span className="text-emerald-400 font-semibold tabular-nums">
              {formatINRCompact(capitalAvailable)}
            </span>
          </button>

          <button
            onClick={onOpenNewTrade}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Trade</span>
          </button>
        </div>

      </div>

      {/* Mobile Nav strip */}
      <div className="flex md:hidden items-center justify-around px-2 py-2 border-t border-slate-800 bg-[#090d16] text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2 py-1 rounded ${activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('trades')}
          className={`px-2 py-1 rounded ${activeTab === 'trades' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Journal
        </button>
        <button
          onClick={() => setActiveTab('live_chart')}
          className={`px-2 py-1 rounded ${activeTab === 'live_chart' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Live Chart
        </button>
        <button
          onClick={() => setActiveTab('emotions')}
          className={`px-2 py-1 rounded ${activeTab === 'emotions' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Emotions
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-2 py-1 rounded ${activeTab === 'strategy' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-2 py-1 rounded ${activeTab === 'charts' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
        >
          Vault
        </button>
      </div>
    </header>
  );
};
