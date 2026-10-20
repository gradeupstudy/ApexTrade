import React from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Trade } from '../types/trade';
import { calculateEmotionAnalytics, formatINR, formatINRCompact } from '../utils/calculations';

interface EmotionalAnalysisViewProps {
  trades: Trade[];
}

export const EmotionalAnalysisView: React.FC<EmotionalAnalysisViewProps> = ({ trades }) => {
  const emotionStats = calculateEmotionAnalytics(trades);
  const closedTrades = trades.filter(t => t.status === 'Close');

  const positiveEmotions = ['Calm', 'Mental Clarity', 'Emotion Ready'];
  const negativeEmotions = ['Fomo', 'Greed', 'Mental Stress', 'Frustration'];

  const positivePnL = emotionStats
    .filter(e => positiveEmotions.includes(e.emotion))
    .reduce((acc, curr) => acc + curr.netPnL, 0);

  const negativePnL = emotionStats
    .filter(e => negativeEmotions.includes(e.emotion))
    .reduce((acc, curr) => acc + curr.netPnL, 0);

  const bestEmotion = [...emotionStats]
    .filter(e => e.tradeCount > 0)
    .sort((a, b) => b.netPnL - a.netPnL)[0];

  const worstEmotion = [...emotionStats]
    .filter(e => e.tradeCount > 0)
    .sort((a, b) => a.netPnL - b.netPnL)[0];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Behavioral Psychology & Emotional Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional performance analysis correlating psychological states with realized P&L across {closedTrades.length} closed trades.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-md">
            Psychology Correlation Engine
          </span>
        </div>
      </div>

      {/* Psychology Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Disciplined Mindset Card */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Disciplined States (Calm, Clarity, Ready)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
            positivePnL >= 0 ? 'text-emerald-400' : 'text-slate-200'
          }`}>
            {positivePnL >= 0 ? '+' : ''}{formatINR(positivePnL)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total realized profit generated when entering trades in balanced psychological equilibrium.
          </p>
        </div>

        {/* Destructive States Card */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Emotional Leakage (FOMO, Greed, Stress, Frustration)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
            negativePnL < 0 ? 'text-rose-400' : 'text-slate-200'
          }`}>
            {formatINR(negativePnL)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Capital sacrificed to impulsive entries, chasing setups, and over-leveraged greed.
          </p>
        </div>

        {/* Net Psychological Edge */}
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Optimal Mental Benchmark</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400 tracking-tight">
            {bestEmotion ? bestEmotion.emotion : 'Calm'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {bestEmotion ? `${bestEmotion.winRate}% Win Rate · ${formatINR(bestEmotion.netPnL)} generated` : 'Maintain emotional neutral discipline'}
          </p>
        </div>

      </div>

      {/* Deep Emotion Breakdown Table & Graphic Bars */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center justify-between">
          <span>Emotional State Matrix & Expectancy</span>
          <span className="text-xs font-mono text-slate-500 font-normal">All 7 User Input Options</span>
        </h3>

        <div className="space-y-4">
          {emotionStats.map(stat => {
            const isPositive = stat.netPnL >= 0;
            const maxPnL = Math.max(...emotionStats.map(s => Math.abs(s.netPnL)), 1);
            const percentageWidth = Math.min(100, Math.round((Math.abs(stat.netPnL) / maxPnL) * 100));

            return (
              <div key={stat.emotion} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-100 w-32">{stat.emotion}</span>
                    <span className="text-xs font-mono text-slate-400">
                      {stat.tradeCount} trades ({stat.winCount}W / {stat.lossCount}L)
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 mr-1.5">Win Rate:</span>
                      <span className={`font-semibold ${stat.winRate >= 50 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {stat.winRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 mr-1.5">Avg/Trade:</span>
                      <span className={`font-semibold ${stat.avgPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatINR(stat.avgPnL)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 mr-1.5">Total PnL:</span>
                      <span className={`font-bold tabular-nums text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{formatINR(stat.netPnL)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bar graphic */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${percentageWidth}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trader Discipline Advice & Cognitive Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Positive Behavioral Habits
          </h4>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">·</span>
              <span><strong>Pre-trade checklist verification:</strong> Entering in 'Calm' or 'Emotion Ready' states guarantees you wait for candle close at predetermined level.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">·</span>
              <span><strong>Fixed Risk per Trade sizing:</strong> Sticking to 0.5% or 1% preserves emotional equanimity and eliminates panic stop moves.</span>
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Cognitive Traps to Eliminate
          </h4>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">·</span>
              <span><strong>FOMO (Fear of Missing Out):</strong> Chasing scripts mid-candle leads to poor actual entry prices and distorted risk-to-reward ratios.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">·</span>
              <span><strong>Revenge Trading & Frustration:</strong> Taking trades immediately after a stop-loss without multi-timeframe confirmation.</span>
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
};
