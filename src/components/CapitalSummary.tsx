import React, { useState } from 'react';
import { 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Info, 
  Edit3, 
  Check, 
  X,
  PieChart as PieIcon
} from 'lucide-react';
import { CapitalMetrics } from '../types/trade';
import { formatINR } from '../utils/calculations';

interface CapitalSummaryProps {
  metrics: CapitalMetrics;
  onUpdateTotalCapital: (newCapital: number) => void;
}

export const CapitalSummary: React.FC<CapitalSummaryProps> = ({
  metrics,
  onUpdateTotalCapital
}) => {
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [editCapitalInput, setEditCapitalInput] = useState(metrics.totalCapital.toString());
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  const handleSaveCapital = () => {
    const val = parseFloat(editCapitalInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateTotalCapital(val);
      setIsEditingCapital(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveCapital();
    if (e.key === 'Escape') {
      setEditCapitalInput(metrics.totalCapital.toString());
      setIsEditingCapital(false);
    }
  };

  const isClosedProfit = metrics.closedPnL >= 0;
  const capitalUtilization = metrics.totalCapital > 0 
    ? Math.min(100, Math.round((metrics.capitalDeployed / metrics.totalCapital) * 100))
    : 0;

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 mb-8 shadow-xs">
      
      {/* Top Banner explaining the 2 Major Options */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
            Capital Management Terminal
          </span>
          <span className="text-slate-600 text-xs">·</span>
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>How Capital Available is Calculated</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{metrics.closedTradesCount} Closed Trades</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>{metrics.activeTradesCount} Active Trades</span>
          </div>
          {metrics.pendingTradesCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{metrics.pendingTradesCount} Pending Orders</span>
            </div>
          )}
        </div>
      </div>

      {/* Formula Explanation Callout (toggleable) */}
      {showFormulaInfo && (
        <div className="mb-5 p-3.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-100">Capital Available Formula:</p>
              <div className="font-mono text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 text-[11px] sm:text-xs">
                Capital Available = Total Capital + Realized P/L (Closed Trades) - Capital Required (Active Trades)
              </div>
              <p className="text-slate-400">
                1. All closed trades' profit or loss are added/subtracted from your base capital to reflect realized equity.<br />
                2. Active trades lock up their required margin (Calculated Quantity × Entry Price) until closed.<br />
                3. The remainder is your pristine free cash available to execute your next planned trade safely.
              </p>
            </div>
            <button
              onClick={() => setShowFormulaInfo(false)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Primary 2 Major Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Major Option 1: Total Capital (Filled by User) */}
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 relative group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              1. Total Capital (Filled by Me)
            </span>
            {!isEditingCapital && (
              <button
                onClick={() => {
                  setEditCapitalInput(metrics.totalCapital.toString());
                  setIsEditingCapital(true);
                }}
                className="opacity-70 group-hover:opacity-100 text-slate-400 hover:text-white p-1 rounded transition-opacity"
                title="Edit Total Capital"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isEditingCapital ? (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-slate-500 font-mono text-sm">₹</span>
                <input
                  type="number"
                  value={editCapitalInput}
                  onChange={(e) => setEditCapitalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full pl-7 pr-2 py-1.5 bg-slate-950 border border-emerald-500 rounded text-slate-100 font-mono text-base font-bold focus:outline-hidden"
                  placeholder="500000"
                />
              </div>
              <button
                onClick={handleSaveCapital}
                className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded transition-colors"
                title="Save"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <button
                onClick={() => setIsEditingCapital(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {formatINR(metrics.totalCapital)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Base funded capital allocated for trading account
              </p>
            </div>
          )}
        </div>

        {/* Major Option 2: Capital Available (Calculated Result) */}
        <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 relative">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              2. Capital Available
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              For Next Trade
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
            {formatINR(metrics.capitalAvailable)}
          </div>
          <p className="text-[11px] text-emerald-400/70 mt-1">
            Total Capital + Closed P/L - Active Capital Req.
          </p>
        </div>

        {/* Supporting Metric A: Capital Required in Active Trades */}
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-sky-400" />
              Capital Required (Active)
            </span>
            <span className="text-xs font-mono text-slate-400">
              {metrics.activeTradesCount} {metrics.activeTradesCount === 1 ? 'pos' : 'positions'}
            </span>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-sky-400 tabular-nums">
            {formatINR(metrics.capitalDeployed)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Utilization:</span>
            <span className="font-mono text-slate-300 font-medium">{capitalUtilization}%</span>
          </div>
        </div>

        {/* Supporting Metric B: Closed Profit/Loss */}
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              {isClosedProfit ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              )}
              Closed Profit / Loss
            </span>
            <span className="text-xs font-mono text-slate-400">
              {metrics.closedTradesCount} closed
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
            metrics.closedPnL > 0 
              ? 'text-emerald-400' 
              : metrics.closedPnL < 0 
              ? 'text-rose-400' 
              : 'text-slate-300'
          }`}>
            {formatINR(metrics.closedPnL)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Current Total Equity:</span>
            <span className="font-mono text-slate-200 font-semibold">{formatINR(metrics.totalEquity)}</span>
          </div>
        </div>

      </div>

    </div>
  );
};
