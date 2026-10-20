import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Search, 
  Filter, 
  Maximize2, 
  ArrowUpRight, 
  ArrowDownRight,
  Camera,
  Layers
} from 'lucide-react';
import { Trade } from '../types/trade';
import { formatINR } from '../utils/calculations';

interface ChartVaultViewProps {
  trades: Trade[];
  onOpenChartModal: (trade: Trade) => void;
  onOpenTradeModal: (trade?: Trade) => void;
}

export const ChartVaultView: React.FC<ChartVaultViewProps> = ({
  trades,
  onOpenChartModal,
  onOpenTradeModal
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterOutcome, setFilterOutcome] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const tradesWithCharts = trades.filter(t => t.chartBefore || t.chartAfter);

  const filtered = tradesWithCharts.filter(t => {
    if (searchTerm && !t.script.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterType !== 'ALL' && t.tradeType !== filterType) return false;
    if (filterOutcome === 'WIN' && (t.status !== 'Close' || t.pnlRupee <= 0)) return false;
    if (filterOutcome === 'LOSS' && (t.status !== 'Close' || t.pnlRupee >= 0)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            Chart Visual Playbook & Screenshot Vault
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Archived pre-trade analysis hypotheses and post-trade outcomes for visual pattern recognition.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {filtered.length} setups in playbook
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0f172a] border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by script..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">All Types</option>
            <option value="QIT">QIT</option>
            <option value="MIT">MIT</option>
            <option value="WIT">WIT</option>
            <option value="DIT">DIT</option>
            <option value="QT">QT</option>
            <option value="TBS">TBS</option>
          </select>

          <select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Winning Setups</option>
            <option value="LOSS">Losing Setups</option>
          </select>
        </div>
      </div>

      {/* Grid of Chart Cards */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#0f172a] border border-slate-800 text-slate-500">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-slate-300">No chart screenshots match your criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Upload screenshots in the trade logger to archive your setups.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(trade => {
            const isClosed = trade.status === 'Close';
            const isProfit = trade.pnlRupee > 0;

            return (
              <div 
                key={trade.id}
                className="rounded-xl bg-[#0f172a] border border-slate-800 overflow-hidden hover:border-slate-700 transition-all group flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white font-mono">
                      <span>#{trade.serialNumber}</span>
                      <span>·</span>
                      <span className="font-sans text-sm">{trade.script}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {trade.tradeType} · Setup {trade.setupQuality}
                    </div>
                  </div>

                  <div className="text-right">
                    {isClosed ? (
                      <span className={`font-mono font-bold text-sm block ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}{formatINR(trade.pnlRupee)}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-500/20">
                        {trade.status}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {trade.tradeDate}
                    </span>
                  </div>
                </div>

                {/* Pre / Post Screenshots comparison */}
                <div 
                  onClick={() => onOpenChartModal(trade)}
                  className="p-3 bg-slate-950 cursor-pointer relative"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {/* Pre-Trade */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-sky-400 font-mono font-semibold mb-1">
                        Pre Setup
                      </span>
                      <div className="h-28 rounded bg-slate-900 border border-slate-800/80 overflow-hidden">
                        {trade.chartBefore ? (
                          <img 
                            src={trade.chartBefore} 
                            alt="Pre setup" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-[10px] text-slate-600">
                            No Pre Chart
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Post-Trade */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold mb-1">
                        Post Result
                      </span>
                      <div className="h-28 rounded bg-slate-900 border border-slate-800/80 overflow-hidden">
                        {trade.chartAfter ? (
                          <img 
                            src={trade.chartAfter} 
                            alt="Post trade" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-[10px] text-slate-600">
                            No Post Chart
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-slate-900/90 text-white text-[11px] px-2.5 py-1 rounded shadow-md flex items-center gap-1.5 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5" /> Full Screen Compare
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[180px] text-[11px]">
                    {trade.emotions.join(', ')}
                  </span>
                  <button
                    onClick={() => onOpenTradeModal(trade)}
                    className="text-xs text-slate-300 hover:text-white"
                  >
                    Edit Trade
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
