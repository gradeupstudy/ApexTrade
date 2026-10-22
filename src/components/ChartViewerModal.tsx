import React, { useState } from 'react';
import { 
  X, 
  BarChart2, 
  Camera, 
  Layers, 
  Maximize2, 
  CheckCircle2, 
  AlertTriangle,
  Brain,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Trade } from '../types/trade';
import { formatINR } from '../utils/calculations';
import { LiveTradingViewChart } from './LiveTradingViewChart';

interface ChartViewerModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChartViewerModal: React.FC<ChartViewerModalProps> = ({
  trade,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'tv_chart' | 'side-by-side' | 'before' | 'after'>('tv_chart');

  if (!isOpen || !trade) return null;

  const isProfit = trade.pnlRupee > 0;
  const isLoss = trade.pnlRupee < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden shadow-2xl text-slate-200">
        
        {/* Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
              #{trade.serialNumber}
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{trade.script}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                  trade.tradeDirection === 'Short' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {trade.tradeDirection || 'Long'}
                </span>
                <span className="text-xs font-mono font-normal text-slate-400">({trade.tradeType})</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5 flex-wrap">
                <span>Source: <strong className="text-slate-300">{trade.scriptSource || trade.setupQuality || 'Other'}</strong></span>
                {trade.entryType && (
                  <>
                    <span>·</span>
                    <span>Entry: <strong className="text-slate-300">{trade.entryType}</strong></span>
                  </>
                )}
                <span>·</span>
                <span>MTF: {trade.mtf}</span>
                <span>·</span>
                <span>Risk: {trade.riskPerTrade}</span>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('tv_chart')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
                  activeTab === 'tv_chart' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Live TradingView Chart</span>
              </button>

              <button
                onClick={() => setActiveTab('side-by-side')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-colors ${
                  activeTab === 'side-by-side' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Screenshots Side-by-Side</span>
              </button>

              <button
                onClick={() => setActiveTab('before')}
                className={`hidden md:inline-block px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'before' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pre-Trade
              </button>

              <button
                onClick={() => setActiveTab('after')}
                className={`hidden md:inline-block px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'after' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Post-Trade
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Trade Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 p-3 bg-slate-950 border-b border-slate-800/80 text-xs font-mono">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Entry / Actual</span>
            <span className="text-slate-200 font-semibold">₹{trade.entryPrice} / ₹{trade.actualEntryPrice}</span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Stop Loss / Target</span>
            <span className="text-slate-200 font-semibold">₹{trade.stopLoss} / ₹{trade.target}</span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Quantity / Cap Req</span>
            <span className="text-slate-200 font-semibold">{trade.actualQuantity} / {formatINR(trade.capitalRequired)}</span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Exit Price</span>
            <span className="text-slate-200 font-semibold">{trade.exitPrice !== null ? `₹${trade.exitPrice}` : 'Open Position'}</span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Profit / Loss (₹)</span>
            <span className={`font-bold ${isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'}`}>
              {trade.status === 'Close' ? `${isProfit ? '+' : ''}${formatINR(trade.pnlRupee)}` : 'Active / Pending'}
            </span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">ROI</span>
            <span className={`font-bold ${isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'}`}>
              {trade.status === 'Close' ? `${trade.roiPercent > 0 ? '+' : ''}${trade.roiPercent.toFixed(1)}%` : '—'}
            </span>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
            <span className="text-[10px] text-slate-500 block">Rule Adherence</span>
            <span className={`font-semibold ${trade.ruleFollowed === 'Yes' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trade.ruleFollowed === 'Yes' ? 'Disciplined (Yes)' : 'Violated (No)'}
            </span>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#070b12]">
          {activeTab === 'tv_chart' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-emerald-400">
                  TradingView Chart with Trade Levels Overlay for {trade.script}
                </span>
                <span className="text-[11px] text-slate-500">
                  Live updates via WebSockets without page reload
                </span>
              </div>

              <LiveTradingViewChart
                initialSymbol={trade.script}
                tradeOverlay={{
                  entryPrice: trade.entryPrice,
                  actualEntryPrice: trade.actualEntryPrice,
                  stopLoss: trade.stopLoss,
                  target: trade.target,
                  exitPrice: trade.exitPrice,
                  script: trade.script
                }}
                height={500}
              />
            </div>
          ) : activeTab === 'side-by-side' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[440px]">
              {/* Pre-Trade Screenshot */}
              <div className="flex flex-col rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-400 flex items-center gap-1.5">
                    Pre-Analysis Chart Setup
                  </span>
                  <span className="text-slate-500 font-mono">{trade.tradeDate}</span>
                </div>
                <div className="flex-1 p-2 flex items-center justify-center bg-slate-950">
                  {trade.chartBefore ? (
                    <img 
                      src={trade.chartBefore} 
                      alt="Pre Trade Setup" 
                      className="max-h-[460px] w-full object-contain rounded" 
                    />
                  ) : (
                    <div className="text-center text-slate-500 py-16">
                      <p className="text-sm">No Pre-Trade chart uploaded for this setup.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Post-Trade Screenshot */}
              <div className="flex flex-col rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    Post-Trade Execution & Exit
                  </span>
                  <span className="text-slate-500 font-mono">{trade.exitDate || trade.tradeDate}</span>
                </div>
                <div className="flex-1 p-2 flex items-center justify-center bg-slate-950">
                  {trade.chartAfter ? (
                    <img 
                      src={trade.chartAfter} 
                      alt="Post Trade Execution" 
                      className="max-h-[460px] w-full object-contain rounded" 
                    />
                  ) : (
                    <div className="text-center text-slate-500 py-16">
                      <p className="text-sm">No Post-Trade chart uploaded yet (position active/pending).</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'before' ? (
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-2 flex items-center justify-center bg-slate-950 min-h-[480px]">
              {trade.chartBefore ? (
                <img 
                  src={trade.chartBefore} 
                  alt="Pre Trade Setup" 
                  className="max-h-[600px] w-full object-contain rounded" 
                />
              ) : (
                <p className="text-slate-500">No Pre-Trade chart uploaded.</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-2 flex items-center justify-center bg-slate-950 min-h-[480px]">
              {trade.chartAfter ? (
                <img 
                  src={trade.chartAfter} 
                  alt="Post Trade Execution" 
                  className="max-h-[600px] w-full object-contain rounded" 
                />
              ) : (
                <p className="text-slate-500">No Post-Trade chart uploaded.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Notes & Psychology */}
        <div className="p-4 bg-[#0f172a] border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-slate-400">Emotions:</span>
            <div className="flex flex-wrap gap-1">
              {trade.emotions?.map(em => (
                <span 
                  key={em} 
                  className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700 font-medium"
                >
                  {em}
                </span>
              ))}
            </div>
          </div>

          {trade.notes && (
            <div className="text-slate-400 italic max-w-xl truncate">
              "{trade.notes}"
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
