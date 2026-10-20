import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Target, 
  Scale, 
  Award, 
  Brain, 
  Layers, 
  ArrowRight,
  Maximize2,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  Trade, 
  CapitalMetrics 
} from '../types/trade';
import { 
  calculateAnalyticsSummary, 
  calculateEmotionAnalytics, 
  calculateStrategyAnalytics,
  calculateQualityAnalytics,
  calculateEquityCurve,
  formatINR,
  formatINRCompact
} from '../utils/calculations';

interface DashboardProps {
  trades: Trade[];
  metrics: CapitalMetrics;
  onOpenTradeModal: (trade?: Trade) => void;
  onOpenChartModal: (trade: Trade) => void;
  onNavigateTab: (tab: 'trades' | 'emotions' | 'strategy' | 'charts') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  trades,
  metrics,
  onOpenTradeModal,
  onOpenChartModal,
  onNavigateTab
}) => {
  const summary = calculateAnalyticsSummary(trades);
  const emotionStats = calculateEmotionAnalytics(trades);
  const strategyStats = calculateStrategyAnalytics(trades);
  const qualityStats = calculateQualityAnalytics(trades);
  const equityPoints = calculateEquityCurve(trades, metrics.totalCapital);

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // SVG Chart Dimensions for Equity Curve
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  const minEquity = Math.min(...equityPoints.map(p => p.equity), metrics.totalCapital * 0.95);
  const maxEquity = Math.max(...equityPoints.map(p => p.equity), metrics.totalCapital * 1.05);
  const range = maxEquity - minEquity || 1;

  const getCoordinates = (index: number, equity: number) => {
    const x = paddingX + (index / (Math.max(1, equityPoints.length - 1))) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((equity - minEquity) / range) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const polylinePoints = equityPoints
    .map((p, idx) => {
      const { x, y } = getCoordinates(idx, p.equity);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = equityPoints.length > 0
    ? `${getCoordinates(0, equityPoints[0].equity).x},${svgHeight - paddingY} ${polylinePoints} ${
        getCoordinates(equityPoints.length - 1, equityPoints[equityPoints.length - 1].equity).x
      },${svgHeight - paddingY}`
    : '';

  const baseCoordY = getCoordinates(0, metrics.totalCapital).y;

  const bestEmotion = [...emotionStats]
    .filter(e => e.tradeCount > 0)
    .sort((a, b) => b.netPnL - a.netPnL)[0];

  const worstEmotion = [...emotionStats]
    .filter(e => e.tradeCount > 0)
    .sort((a, b) => a.netPnL - b.netPnL)[0];

  const recentClosedTrades = [...trades]
    .filter(t => t.status === 'Close')
    .slice(-4)
    .reverse();

  return (
    <div className="space-y-8">
      
      {/* Top Returns & Return Ratios Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Net Returns */}
        <div className="p-3.5 rounded-lg bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Net Return</span>
            {summary.netPnL >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
          <div className={`text-xl font-bold font-mono tracking-tight tabular-nums ${
            summary.netPnL > 0 ? 'text-emerald-400' : summary.netPnL < 0 ? 'text-rose-400' : 'text-slate-200'
          }`}>
            {formatINRCompact(summary.netPnL)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ROI: <span className="font-mono text-slate-300 font-medium">
              {metrics.totalCapital > 0 ? ((summary.netPnL / metrics.totalCapital) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-3.5 rounded-lg bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Win Rate</span>
            <Target className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-slate-100 tabular-nums">
            {summary.winRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.winningTrades}W · {summary.losingTrades}L
          </div>
        </div>

        {/* Profit Factor */}
        <div className="p-3.5 rounded-lg bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Profit Factor</span>
            <Scale className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-sky-400 tabular-nums">
            {summary.profitFactor.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Gross W: {formatINRCompact(summary.grossProfits)}
          </div>
        </div>

        {/* Realized Risk:Reward */}
        <div className="p-3.5 rounded-lg bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Return Ratio (R:R)</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-amber-400 tabular-nums">
            1 : {summary.riskRewardRealized.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Avg W: {formatINRCompact(summary.avgWin)}
          </div>
        </div>

        {/* Average Loss */}
        <div className="p-3.5 rounded-lg bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Avg Loss</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-rose-400 tabular-nums">
            {formatINRCompact(summary.avgLoss)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Max Loss: {formatINRCompact(summary.largestLoss)}
          </div>
        </div>

        {/* Rule Adherence Win Rate */}
        <div className="p-3.5 rounded-lg bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Rule Discipline</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
            {summary.ruleFollowedWinRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Violated Win%: <span className="text-rose-400 font-mono">{summary.ruleViolatedWinRate}%</span>
          </div>
        </div>

      </div>

      {/* Trend Analysis Graphic: Interactive Equity Curve */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 mb-4 gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Trend Analysis: Cumulative Equity Curve
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes account balance evolution from base capital of {formatINR(metrics.totalCapital)} to {formatINR(metrics.totalEquity)}
            </p>
          </div>

          {hoveredPoint !== null && equityPoints[hoveredPoint] && (
            <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-md font-mono">
              <span className="text-slate-400">{equityPoints[hoveredPoint].date}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-200 font-semibold">{equityPoints[hoveredPoint].script}</span>
              <span className="text-slate-600">·</span>
              <span className={equityPoints[hoveredPoint].pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatINR(equityPoints[hoveredPoint].pnl)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-white font-bold">{formatINR(equityPoints[hoveredPoint].equity)}</span>
            </div>
          )}
        </div>

        {/* SVG Equity Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[680px]">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-56 select-none"
            >
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = paddingY + ratio * (svgHeight - paddingY * 2);
                const value = maxEquity - ratio * range;
                return (
                  <g key={ratio}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={svgWidth - paddingX} 
                      y2={y} 
                      stroke="#1e293b" 
                      strokeDasharray="4 4" 
                      strokeWidth="1"
                    />
                    <text 
                      x={paddingX - 8} 
                      y={y + 3} 
                      fill="#64748b" 
                      fontSize="9" 
                      textAnchor="end" 
                      fontFamily="JetBrains Mono"
                    >
                      {formatINRCompact(value)}
                    </text>
                  </g>
                );
              })}

              {/* Baseline (Initial Capital) */}
              <line 
                x1={paddingX} 
                y1={baseCoordY} 
                x2={svgWidth - paddingX} 
                y2={baseCoordY} 
                stroke="#475569" 
                strokeWidth="1.2" 
                strokeDasharray="6 3"
              />

              {/* Area */}
              {areaPoints ? (
                <polygon points={areaPoints} fill="url(#equityGrad)" />
              ) : null}

              {/* Line */}
              {polylinePoints ? (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* Data points */}
              {equityPoints.map((pt, idx) => {
                const { x, y } = getCoordinates(idx, pt.equity);
                const isHovered = hoveredPoint === idx;
                return (
                  <g 
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer"
                  >
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isHovered ? 6 : 3.5} 
                      fill={pt.pnl >= 0 ? '#10b981' : '#ef4444'} 
                      stroke="#0f172a" 
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400"></span>
              Equity Curve
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-slate-500 border-b border-dashed border-slate-400"></span>
              Base Capital ({formatINR(metrics.totalCapital)})
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {equityPoints.length - 1} Closed Milestones Recorded
          </span>
        </div>
      </div>

      {/* Two Column Grid: Emotional Analysis Graphics & Strategy Analysis Graphics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Emotional Analysis Graphics */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-100">Emotional Bias Analysis</h3>
              </div>
              <button
                onClick={() => onNavigateTab('emotions')}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
              >
                <span>Deep Dive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick highlight cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-[11px] text-emerald-400 font-medium uppercase font-mono">Most Profitable Mindset</span>
                <div className="text-sm font-bold text-slate-100 mt-1">
                  {bestEmotion ? bestEmotion.emotion : 'N/A'}
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">
                  {bestEmotion ? formatINR(bestEmotion.netPnL) : '₹0'} ({bestEmotion?.winRate}%)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                <span className="text-[11px] text-rose-400 font-medium uppercase font-mono">Most Costly Emotion</span>
                <div className="text-sm font-bold text-slate-100 mt-1">
                  {worstEmotion && worstEmotion.netPnL < 0 ? worstEmotion.emotion : 'None / Disciplined'}
                </div>
                <div className="text-xs font-mono text-rose-400 font-semibold mt-0.5">
                  {worstEmotion && worstEmotion.netPnL < 0 ? formatINR(worstEmotion.netPnL) : '₹0'} ({worstEmotion?.winRate}%)
                </div>
              </div>
            </div>

            {/* Emotion PnL Bar Graphics */}
            <div className="space-y-2.5">
              {emotionStats.map(stat => {
                const isPositive = stat.netPnL >= 0;
                const maxAbsPnL = Math.max(...emotionStats.map(s => Math.abs(s.netPnL)), 1);
                const barWidth = Math.min(100, Math.round((Math.abs(stat.netPnL) / maxAbsPnL) * 100));

                return (
                  <div key={stat.emotion} className="text-xs">
                    <div className="flex items-center justify-between mb-1 text-slate-300">
                      <span className="font-medium">{stat.emotion}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500">{stat.tradeCount} trades</span>
                        <span className={`font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatINR(stat.netPnL)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Trading with Calm & Mental Clarity yields institutional edge.</span>
            <span className="font-mono text-slate-400">{summary.closedTrades} Analyzed</span>
          </div>
        </div>

        {/* Strategy & Setup Quality Analysis Graphics */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-100">Strategy & Quality Analysis</h3>
              </div>
              <button
                onClick={() => onNavigateTab('strategy')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
              >
                <span>All Strategies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Trade Type Breakdown (QIT, MIT, WIT, DIT, QT, TBS) */}
            <div className="mb-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block mb-2 font-medium">
                Trade Type Performance (QIT, MIT, WIT, DIT, QT, TBS)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {strategyStats.map(item => (
                  <div key={item.tradeType} className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-xs font-bold text-slate-200 block">{item.tradeType}</span>
                    <span className="text-[11px] font-mono text-slate-400 block">{item.winRate}% W</span>
                    <span className={`text-[10px] font-mono block font-semibold ${
                      item.netPnL > 0 ? 'text-emerald-400' : item.netPnL < 0 ? 'text-rose-400' : 'text-slate-500'
                    }`}>
                      {formatINRCompact(item.netPnL)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup Quality Breakdown (A+, A, B, C) */}
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block mb-2 font-medium">
                Setup Quality Win Rate (A+, A, B, C)
              </span>
              <div className="space-y-2">
                {qualityStats.map(q => (
                  <div key={q.quality} className="flex items-center justify-between text-xs">
                    <span className="w-8 font-bold text-slate-300 font-mono">{q.quality}</span>
                    <div className="flex-1 mx-3 bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          q.quality === 'A+' ? 'bg-emerald-400' :
                          q.quality === 'A' ? 'bg-sky-400' :
                          q.quality === 'B' ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${q.winRate}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-slate-300 w-12 text-right">{q.winRate}%</span>
                    <span className={`font-mono w-20 text-right font-semibold ${
                      q.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatINRCompact(q.netPnL)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>A+ & A setups consistently produce high risk:reward expectancy.</span>
            <span className="font-mono text-slate-400">{summary.closedTrades} Trades</span>
          </div>
        </div>

      </div>

      {/* Recent Trades with Chart Previews */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Recent Trade Executions & Chart Proofs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any trade chart to inspect pre-trade setup and post-trade result side-by-side
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('trades')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            <span>View Full Journal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentClosedTrades.map(trade => (
            <div 
              key={trade.id}
              className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono font-bold text-slate-100">{trade.script}</span>
                  <span className={`font-mono font-semibold ${
                    trade.pnlRupee >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {trade.pnlRupee >= 0 ? '+' : ''}{formatINR(trade.pnlRupee)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-2 font-mono">
                  <span>#{trade.serialNumber}</span>
                  <span>·</span>
                  <span>{trade.tradeType}</span>
                  <span>·</span>
                  <span>{trade.setupQuality} Quality</span>
                </div>

                {/* Chart Preview Thumbnail */}
                <div 
                  onClick={() => onOpenChartModal(trade)}
                  className="w-full h-28 rounded bg-slate-950 border border-slate-800 overflow-hidden relative cursor-pointer group-hover:border-slate-600 transition-colors mb-2"
                >
                  <img 
                    src={trade.chartAfter || trade.chartBefore} 
                    alt={`${trade.script} trade chart`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-opacity">
                      <Maximize2 className="w-3 h-3" /> Compare Charts
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80 text-slate-400">
                <span className="truncate max-w-[120px]">{trade.emotions.join(', ')}</span>
                <span className="font-mono text-slate-300">{trade.exitDate || trade.tradeDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
