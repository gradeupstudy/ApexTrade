import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Target, 
  Award, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck,
  Zap,
  BarChart2,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  Activity
} from 'lucide-react';
import { Trade, TradeType, ScriptSource, EntryType, YesNo } from '../types/trade';
import { 
  calculateStrategyAnalytics, 
  calculateScriptSourceAnalytics, 
  calculateEntryTypeAnalytics,
  calculateMTFAnalytics,
  calculateTimeCycleAnalytics,
  TimeCyclePoint,
  formatINR, 
  formatINRCompact 
} from '../utils/calculations';

interface StrategyAnalysisViewProps {
  trades: Trade[];
}

export const StrategyAnalysisView: React.FC<StrategyAnalysisViewProps> = ({ trades }) => {
  const closedTrades = useMemo(() => trades.filter(t => t.status === 'Close'), [trades]);
  
  // Analytics calculators
  const strategyStats = useMemo(() => calculateStrategyAnalytics(trades), [trades]);
  const sourceStats = useMemo(() => calculateScriptSourceAnalytics(trades), [trades]);
  const entryTypeStats = useMemo(() => calculateEntryTypeAnalytics(trades), [trades]);
  const mtfStats = useMemo(() => calculateMTFAnalytics(trades), [trades]);
  const timeCycleStats = useMemo(() => calculateTimeCycleAnalytics(trades), [trades]);

  // Time Cycle State (Weekly, Monthly, Yearly)
  const [cyclePeriod, setCyclePeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [mtfSearchTerm, setMtfSearchTerm] = useState('');

  // Selected cycle points
  const activeCyclePoints: TimeCyclePoint[] = useMemo(() => {
    if (cyclePeriod === 'weekly') return timeCycleStats.weekly;
    if (cyclePeriod === 'yearly') return timeCycleStats.yearly;
    return timeCycleStats.monthly;
  }, [cyclePeriod, timeCycleStats]);

  // Filtered MTF Stocks
  const filteredMtfStocks = useMemo(() => {
    if (!mtfSearchTerm.trim()) return mtfStats.mtfStocks;
    return mtfStats.mtfStocks.filter(s => 
      s.script.toLowerCase().includes(mtfSearchTerm.toLowerCase())
    );
  }, [mtfStats.mtfStocks, mtfSearchTerm]);

  // Overall metrics summary
  const totalClosedPnL = closedTrades.reduce((acc, t) => acc + (t.pnlRupee || 0), 0);
  const totalWinningTrades = closedTrades.filter(t => (t.pnlRupee || 0) > 0).length;
  const overallWinRate = closedTrades.length > 0 
    ? Math.round((totalWinningTrades / closedTrades.length) * 100) 
    : 0;

  // SVG Chart Dimensions for Time Cycle Curve
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 25;

  const svgCurveData = useMemo(() => {
    if (activeCyclePoints.length === 0) return null;

    const cumulativeValues = activeCyclePoints.map(p => p.cumulativePnL);
    const minVal = Math.min(0, ...cumulativeValues);
    const maxVal = Math.max(100, ...cumulativeValues);
    const range = (maxVal - minVal) || 1;

    const availableW = chartWidth - paddingX * 2;
    const availableH = chartHeight - paddingY * 2;

    const stepX = activeCyclePoints.length > 1 
      ? availableW / (activeCyclePoints.length - 1) 
      : availableW / 2;

    const coords = activeCyclePoints.map((p, i) => {
      const x = paddingX + (activeCyclePoints.length === 1 ? availableW / 2 : i * stepX);
      const normalizedY = (p.cumulativePnL - minVal) / range;
      const y = chartHeight - paddingY - (normalizedY * availableH);
      return { x, y, point: p };
    });

    const zeroY = chartHeight - paddingY - ((0 - minVal) / range) * availableH;

    // Line Path
    let linePath = '';
    coords.forEach((c, idx) => {
      linePath += idx === 0 ? `M ${c.x} ${c.y}` : ` L ${c.x} ${c.y}`;
    });

    // Fill Path
    const lastX = coords[coords.length - 1]?.x || paddingX;
    const firstX = coords[0]?.x || paddingX;
    const fillPath = `${linePath} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`;

    return {
      coords,
      linePath,
      fillPath,
      zeroY,
      minVal,
      maxVal
    };
  }, [activeCyclePoints]);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Execution & Portfolio Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive quantitative analysis: Margin Trading Facility (MTF), Entry Types, Time Cycles, and Script Source performance.
          </p>
        </div>
        
        {/* Quick KPI Strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 mr-2">Closed P&L:</span>
            <span className={`font-bold ${totalClosedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalClosedPnL >= 0 ? '+' : ''}{formatINR(totalClosedPnL)}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 mr-2">Win Rate:</span>
            <span className="font-bold text-slate-200">{overallWinRate}%</span>
          </div>
        </div>
      </div>

      {/* 1. MTF PERFORMANCE ANALYSIS (Margin Trading Facility) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                MTF (Margin Trading Facility) Performance Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Profitability analysis of trades marked with MTF option = YES versus non-MTF trades.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-md self-start sm:self-auto">
            Margin Facility Edge
          </span>
        </div>

        {/* High-level MTF Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* MTF YES Net PnL */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-emerald-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
            <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold block mb-1">
              MTF YES · Realized P&L
            </span>
            <span className={`text-xl font-bold font-mono tabular-nums block ${
              mtfStats.yesNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {mtfStats.yesNetPnL >= 0 ? '+' : ''}{formatINR(mtfStats.yesNetPnL)}
            </span>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <span>{mtfStats.yesWins}W / {mtfStats.yesClosedCount - mtfStats.yesWins}L</span>
              <span className="text-emerald-300 font-semibold">{mtfStats.yesWinRate}% Win</span>
            </div>
          </div>

          {/* MTF YES Capital & Profit Factor */}
          <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              MTF Capital Deployed
            </span>
            <span className="text-xl font-bold font-mono text-sky-400 block tabular-nums">
              {formatINRCompact(mtfStats.yesCapitalDeployed)}
            </span>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <span>Profit Factor:</span>
              <span className="text-slate-200 font-semibold">{mtfStats.yesProfitFactor.toFixed(2)}</span>
            </div>
          </div>

          {/* Non-MTF Comparison */}
          <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              MTF NO · Regular Trades P&L
            </span>
            <span className={`text-xl font-bold font-mono tabular-nums block ${
              mtfStats.noNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {mtfStats.noNetPnL >= 0 ? '+' : ''}{formatINR(mtfStats.noNetPnL)}
            </span>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              <span>{mtfStats.noClosedCount} closed trades</span>
              <span className="text-slate-300">{mtfStats.noWinRate}% Win</span>
            </div>
          </div>

          {/* MTF Alpha Comparison */}
          <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                MTF Margin Edge
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {mtfStats.yesNetPnL >= mtfStats.noNetPnL ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">Outperforming Regular</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">Underperforming Regular</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">
              MTF Win Rate is {Math.abs(Math.round(mtfStats.yesWinRate - mtfStats.noWinRate))}% {mtfStats.yesWinRate >= mtfStats.noWinRate ? 'higher' : 'lower'} than non-MTF trades.
            </p>
          </div>

        </div>

        {/* MTF Stocks Profitability Breakdown Table */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stocks Traded under MTF (Margin Trading Facility)</span>
              <span className="text-slate-500 font-normal">({filteredMtfStocks.length} symbols)</span>
            </h4>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter MTF stocks..."
                value={mtfSearchTerm}
                onChange={(e) => setMtfSearchTerm(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 focus:outline-hidden focus:border-slate-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0b0f19] text-[10px] uppercase text-slate-400 border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-2 px-3">Symbol / Script</th>
                  <th className="py-2 px-3 text-center">Executions</th>
                  <th className="py-2 px-3 text-center">Win Rate</th>
                  <th className="py-2 px-3 text-right">Capital Deployed</th>
                  <th className="py-2 px-3 text-right">Avg ROI %</th>
                  <th className="py-2 px-3 text-right">Realized Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                {filteredMtfStocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                      No stocks marked with MTF option = YES found.
                    </td>
                  </tr>
                ) : (
                  filteredMtfStocks.map(stock => (
                    <tr key={stock.script} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{stock.script}</span>
                        <span className="text-[10px] text-slate-500">Last trade: {stock.lastTradeDate}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-300">
                        {stock.tradeCount} <span className="text-slate-500 text-[10px]">({stock.winCount}W)</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          stock.winRate >= 60 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' :
                          stock.winRate >= 40 ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' :
                          'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                        }`}>
                          {stock.winRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {formatINR(stock.capitalDeployed)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={stock.avgReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {stock.avgReturnPercent >= 0 ? '+' : ''}{stock.avgReturnPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold text-sm ${
                        stock.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {stock.netPnL >= 0 ? '+' : ''}{formatINR(stock.netPnL)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. TIME CYCLE ANALYSIS (Weekly - Monthly - Yearly) WITH PROFIT/LOSS CURVE */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Time Cycle Profit & Loss Curve Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Evaluate trading performance and equity progression across Weekly, Monthly, and Yearly cycles.
              </p>
            </div>
          </div>

          {/* Time Cycle Selector */}
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setCyclePeriod('weekly')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                cyclePeriod === 'weekly' 
                  ? 'bg-sky-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setCyclePeriod('monthly')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                cyclePeriod === 'monthly' 
                  ? 'bg-sky-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCyclePeriod('yearly')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                cyclePeriod === 'yearly' 
                  ? 'bg-sky-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Time Curve Interactive Graph */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">
              Cumulative Profit & Loss Curve ({cyclePeriod.toUpperCase()})
            </span>
            {activeCyclePoints.length > 0 && (
              <span className={`text-xs font-mono font-bold ${
                activeCyclePoints[activeCyclePoints.length - 1]?.cumulativePnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                Total Realized: {formatINR(activeCyclePoints[activeCyclePoints.length - 1]?.cumulativePnL || 0)}
              </span>
            )}
          </div>

          {activeCyclePoints.length === 0 || !svgCurveData ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500 font-mono">
              No closed trade records found for this time cycle.
            </div>
          ) : (
            <div className="relative w-full overflow-hidden">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 select-none">
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <pattern id="chartGrid" width={40} height={25} patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth={0.5}/>
                  </pattern>
                </defs>

                <rect width={chartWidth} height={chartHeight} fill="url(#chartGrid)" opacity={0.4} />

                {/* Zero Reference Line */}
                <line 
                  x1={paddingX} 
                  y1={svgCurveData.zeroY} 
                  x2={chartWidth - paddingX} 
                  y2={svgCurveData.zeroY} 
                  stroke="#475569" 
                  strokeWidth={1} 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={chartWidth - paddingX + 5} 
                  y={svgCurveData.zeroY + 3} 
                  fill="#64748b" 
                  fontSize={9} 
                  fontFamily="JetBrains Mono"
                >
                  ₹0
                </text>

                {/* Curve Fill Area */}
                <path d={svgCurveData.fillPath} fill="url(#curveGradient)" />

                {/* Curve Main Stroke */}
                <path 
                  d={svgCurveData.linePath} 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />

                {/* Data Points */}
                {svgCurveData.coords.map((c, i) => (
                  <g key={i} className="group cursor-pointer">
                    <circle 
                      cx={c.x} 
                      cy={c.y} 
                      r={4} 
                      fill="#10b981" 
                      stroke="#0f172a" 
                      strokeWidth={2} 
                    />
                    {/* Period label under axis */}
                    <text 
                      x={c.x} 
                      y={chartHeight - 8} 
                      fill="#94a3b8" 
                      fontSize={8} 
                      fontFamily="JetBrains Mono" 
                      textAnchor="middle"
                    >
                      {c.point.periodLabel}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* Time Cycle Period Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {activeCyclePoints.map((item) => (
            <div key={item.sortKey} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 font-bold block truncate">{item.periodLabel}</span>
              <span className={`text-sm font-bold block mt-1 ${item.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.netPnL >= 0 ? '+' : ''}{formatINRCompact(item.netPnL)}
              </span>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-800/80">
                <span>{item.tradeCount} trades</span>
                <span className="text-slate-300">{item.winRate}% W</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. ENTRY TYPE ANALYSIS (Direct, TBS, PA) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Entry Type Performance Analysis (Direct, TBS, PA)
              </h3>
              <p className="text-xs text-slate-400">
                Comparative edge of Direct execution versus TBS (Trend/Time Based Setup) and PA (Price Action Confirmation).
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-md self-start sm:self-auto">
            Trigger Optimization
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {entryTypeStats.map(e => {
            const isPos = e.netPnL >= 0;
            const fullNames: Record<EntryType, string> = {
              Direct: 'Instant Limit/Market Trigger',
              TBS: 'Time Based Setup / Trend Breakdown',
              PA: 'Price Action & Candlestick Confirmation'
            };

            return (
              <div key={e.entryType} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-bold font-mono text-white">{e.entryType}</span>
                    <span className={`text-base font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{formatINR(e.netPnL)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">{fullNames[e.entryType]}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Executions:</span>
                    <span className="text-slate-200 font-semibold">{e.tradeCount} trades</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Win Rate:</span>
                    <span className="text-slate-200 font-semibold">{e.winRate}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full" 
                      style={{ width: `${e.winRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. STOCK SOURCE PERFORMANCE (HTF Running - I, HTF Running - II, Other) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Stock / Script Source Profitability Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Institutional Higher Timeframe (HTF Running - I, HTF Running - II) vs Discretionary (Other) setups.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-500/30 px-2.5 py-1 rounded-md self-start sm:self-auto">
            Origin Analytics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sourceStats.map(s => {
            const isPos = s.netPnL >= 0;
            const sourceColor = s.source === 'HTF Running - I' 
              ? 'text-emerald-400' 
              : s.source === 'HTF Running - II' 
              ? 'text-sky-400' 
              : 'text-amber-400';

            const barColor = s.source === 'HTF Running - I' 
              ? 'bg-emerald-500' 
              : s.source === 'HTF Running - II' 
              ? 'bg-sky-500' 
              : 'bg-amber-500';

            return (
              <div key={s.source} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-base font-bold font-mono ${sourceColor}`}>{s.source}</span>
                    <span className={`text-base font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{formatINR(s.netPnL)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    {s.source === 'HTF Running - I' && 'Institutional Primary Momentum & Trend Alignment'}
                    {s.source === 'HTF Running - II' && 'Secondary Trend Continuation & Pullback Confluence'}
                    {s.source === 'Other' && 'Discretionary / News / Range Bound Trade Setups'}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Executions:</span>
                    <span className="text-slate-200 font-semibold">{s.tradeCount} trades</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Win Rate:</span>
                    <span className="text-slate-200 font-semibold">{s.winRate}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`${barColor} h-full rounded-full`} 
                      style={{ width: `${s.winRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TRADE TYPE STRATEGY BREAKDOWN (QIT, MIT, WIT, DIT, QT, TBS) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
          <span>Trade Type Strategy Execution Matrix</span>
          <span className="text-xs font-mono text-slate-400 font-normal">Income & Positional Categories</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {strategyStats.map(item => {
            const isPos = item.netPnL >= 0;
            return (
              <div key={item.tradeType} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">{item.tradeType}</span>
                  <span className="text-[10px] text-slate-400">{item.tradeCount}T</span>
                </div>
                <span className={`text-xs font-bold block tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? '+' : ''}{formatINRCompact(item.netPnL)}
                </span>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-800/80">
                  <span>Win:</span>
                  <span className="text-slate-200 font-semibold">{item.winRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
