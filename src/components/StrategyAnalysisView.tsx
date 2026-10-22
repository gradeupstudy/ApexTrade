import React, { useState } from 'react';
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
  MapPin,
  Globe,
  Compass
} from 'lucide-react';
import { Trade, TradeType, ScriptSource, EntryType, YesNo, RiskPercent } from '../types/trade';
import { 
  calculateStrategyAnalytics, 
  calculateScriptSourceAnalytics, 
  calculateEntryTypeAnalytics,
  formatINR, 
  formatINRCompact 
} from '../utils/calculations';
import { findInstrument, INSTRUMENT_UNIVERSE } from '../services/marketData/instrumentUniverse';

interface StrategyAnalysisViewProps {
  trades: Trade[];
}

interface GeographicZoneMetric {
  zone: 'Western Hub' | 'Southern Hub' | 'Northern Hub' | 'Eastern Hub';
  states: string;
  keyCenters: string;
  tradeCount: number;
  winCount: number;
  winRate: number;
  netPnL: number;
  capitalDeployed: number;
  topTradeTypes: string[];
}

export const StrategyAnalysisView: React.FC<StrategyAnalysisViewProps> = ({ trades }) => {
  const closedTrades = trades.filter(t => t.status === 'Close');
  const strategyStats = calculateStrategyAnalytics(trades);
  const sourceStats = calculateScriptSourceAnalytics(trades);
  const entryTypeStats = calculateEntryTypeAnalytics(trades);

  const [selectedZone, setSelectedZone] = useState<string>('Western Hub');

  // MTF Breakdown
  const mtfYesTrades = closedTrades.filter(t => t.mtf === 'Yes');
  const mtfNoTrades = closedTrades.filter(t => t.mtf === 'No');

  const mtfYesWins = mtfYesTrades.filter(t => t.pnlRupee > 0).length;
  const mtfNoWins = mtfNoTrades.filter(t => t.pnlRupee > 0).length;

  const mtfYesWinRate = mtfYesTrades.length > 0 ? (mtfYesWins / mtfYesTrades.length) * 100 : 0;
  const mtfNoWinRate = mtfNoTrades.length > 0 ? (mtfNoWins / mtfNoTrades.length) * 100 : 0;

  const mtfYesPnL = mtfYesTrades.reduce((acc, t) => acc + (t.pnlRupee || 0), 0);
  const mtfNoPnL = mtfNoTrades.reduce((acc, t) => acc + (t.pnlRupee || 0), 0);

  // Rule Followed Breakdown
  const ruleYesTrades = closedTrades.filter(t => t.ruleFollowed === 'Yes');
  const ruleNoTrades = closedTrades.filter(t => t.ruleFollowed === 'No');

  const ruleYesWins = ruleYesTrades.filter(t => t.pnlRupee > 0).length;
  const ruleNoWins = ruleNoTrades.filter(t => t.pnlRupee > 0).length;

  const ruleYesWinRate = ruleYesTrades.length > 0 ? (ruleYesWins / ruleYesTrades.length) * 100 : 0;
  const ruleNoWinRate = ruleNoTrades.length > 0 ? (ruleNoWins / ruleNoTrades.length) * 100 : 0;

  const ruleYesPnL = ruleYesTrades.reduce((acc, t) => acc + (t.pnlRupee || 0), 0);
  const ruleNoPnL = ruleNoTrades.reduce((acc, t) => acc + (t.pnlRupee || 0), 0);

  // Script ranking
  const scriptMap = new Map<string, { count: number; pnl: number; wins: number }>();
  for (const t of closedTrades) {
    const existing = scriptMap.get(t.script) || { count: 0, pnl: 0, wins: 0 };
    existing.count++;
    existing.pnl += t.pnlRupee || 0;
    if (t.pnlRupee > 0) existing.wins++;
    scriptMap.set(t.script, existing);
  }

  const scriptList = Array.from(scriptMap.entries())
    .map(([script, data]) => ({
      script,
      count: data.count,
      pnl: data.pnl,
      winRate: Math.round((data.wins / data.count) * 100)
    }))
    .sort((a, b) => b.pnl - a.pnl);

  const bestTradeType = [...strategyStats].sort((a, b) => b.netPnL - a.netPnL)[0];

  // GEOGRAPHICAL REPRESENTATION COMPUTATION
  const zones: { 
    zone: 'Western Hub' | 'Southern Hub' | 'Northern Hub' | 'Eastern Hub';
    states: string;
    keyCenters: string;
  }[] = [
    { zone: 'Western Hub', states: 'Maharashtra, Gujarat', keyCenters: 'Mumbai, BKC, Ahmedabad' },
    { zone: 'Southern Hub', states: 'Karnataka, Telangana, Tamil Nadu', keyCenters: 'Bengaluru, Hyderabad, Chennai' },
    { zone: 'Eastern Hub', states: 'West Bengal, Jharkhand, Odisha', keyCenters: 'Kolkata, Jamshedpur' },
    { zone: 'Northern Hub', states: 'Delhi NCR, Haryana, Punjab', keyCenters: 'New Delhi, Gurgaon, Noida' }
  ];

  const geoMetrics: GeographicZoneMetric[] = zones.map(z => {
    // Match trades by mapped instrument headquarters
    const matchingTrades = closedTrades.filter(t => {
      const inst = findInstrument(t.script);
      if (inst) {
        return inst.headquarters.zone === z.zone;
      }
      // Fallback heuristics
      if (z.zone === 'Western Hub') return t.script.includes('NIFTY') || t.script.includes('RELIANCE') || t.script.includes('HDFC');
      if (z.zone === 'Southern Hub') return t.script.includes('INFY') || t.script.includes('TITAN') || t.script.includes('WIPRO');
      if (z.zone === 'Eastern Hub') return t.script.includes('TATASTEEL') || t.script.includes('COAL') || t.script.includes('ITC');
      if (z.zone === 'Northern Hub') return t.script.includes('MARUTI') || t.script.includes('AIRTEL');
      return false;
    });

    const tradeCount = matchingTrades.length;
    let winCount = 0;
    let netPnL = 0;
    let capitalDeployed = 0;
    const typeCounts: Record<string, number> = {};

    for (const t of matchingTrades) {
      const pnl = t.pnlRupee || 0;
      netPnL += pnl;
      capitalDeployed += t.capitalRequired || 0;
      if (pnl > 0) winCount++;
      typeCounts[t.tradeType] = (typeCounts[t.tradeType] || 0) + 1;
    }

    const winRate = tradeCount > 0 ? Math.round((winCount / tradeCount) * 100) : 0;
    const topTradeTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    return {
      zone: z.zone,
      states: z.states,
      keyCenters: z.keyCenters,
      tradeCount,
      winCount,
      winRate,
      netPnL,
      capitalDeployed,
      topTradeTypes: topTradeTypes.length > 0 ? topTradeTypes : ['QIT', 'DIT']
    };
  });

  const activeGeo = geoMetrics.find(g => g.zone === selectedZone) || geoMetrics[0];

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            Strategy & Multi-Timeframe (MTF) Edge Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quantitative evaluation across trade timeframes (QIT, MIT, WIT, DIT, QT, TBS) and geographical market representation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-sky-400 bg-sky-950/40 border border-sky-500/30 px-3 py-1 rounded-md">
            Strategy Intelligence
          </span>
        </div>
      </div>

      {/* GEOGRAPHICAL REPRESENTATION IN TRADE TYPE STRATEGY (Requested by user) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Geographical Representation in Trade Strategy Performance
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded">
            Indian Regional Capital Allocation
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Map & Zone Selector */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-3">
                Geographic analysis correlates instrument origins, corporate headquarters, and regional sectoral clusters with your execution profitability.
              </p>

              {/* Zone Selector Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {geoMetrics.map(g => (
                  <button
                    key={g.zone}
                    onClick={() => setSelectedZone(g.zone)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedZone === g.zone
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-xs'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{g.zone}</span>
                      <MapPin className={`w-3.5 h-3.5 ${selectedZone === g.zone ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{g.tradeCount} trades</span>
                      <span className={`font-semibold ${g.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatINRCompact(g.netPnL)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Stylized Indian Subcontinent Regional Schematic Map */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              <svg viewBox="0 0 400 320" className="w-full h-56 select-none">
                <defs>
                  <pattern id="geoGrid" width={20} height={20} patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth={0.5}/>
                  </pattern>
                </defs>
                <rect width={400} height={320} fill="url(#geoGrid)" opacity={0.3} />

                {/* Regional Connected Hubs */}
                {/* Northern Hub */}
                <g 
                  onClick={() => setSelectedZone('Northern Hub')}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle cx={190} cy={70} r={selectedZone === 'Northern Hub' ? 28 : 22} fill="#0284c7" fillOpacity={selectedZone === 'Northern Hub' ? 0.4 : 0.2} stroke="#38bdf8" strokeWidth={2} />
                  <circle cx={190} cy={70} r={5} fill="#38bdf8" />
                  <text x={190} y={55} fill="#e2e8f0" fontSize={10} fontWeight="700" textAnchor="middle">NORTHERN HUB</text>
                  <text x={190} y={88} fill="#94a3b8" fontSize={8} fontFamily="JetBrains Mono" textAnchor="middle">Delhi NCR · Auto/Infra</text>
                </g>

                {/* Western Hub */}
                <g 
                  onClick={() => setSelectedZone('Western Hub')}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle cx={110} cy={165} r={selectedZone === 'Western Hub' ? 32 : 25} fill="#10b981" fillOpacity={selectedZone === 'Western Hub' ? 0.4 : 0.2} stroke="#10b981" strokeWidth={2} />
                  <circle cx={110} cy={165} r={5} fill="#10b981" />
                  <text x={110} y={150} fill="#e2e8f0" fontSize={10} fontWeight="700" textAnchor="middle">WESTERN HUB</text>
                  <text x={110} y={182} fill="#94a3b8" fontSize={8} fontFamily="JetBrains Mono" textAnchor="middle">Mumbai · Financial / Energy</text>
                </g>

                {/* Eastern Hub */}
                <g 
                  onClick={() => setSelectedZone('Eastern Hub')}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle cx={280} cy={160} r={selectedZone === 'Eastern Hub' ? 28 : 22} fill="#f59e0b" fillOpacity={selectedZone === 'Eastern Hub' ? 0.4 : 0.2} stroke="#f59e0b" strokeWidth={2} />
                  <circle cx={280} cy={160} r={5} fill="#f59e0b" />
                  <text x={280} y={145} fill="#e2e8f0" fontSize={10} fontWeight="700" textAnchor="middle">EASTERN HUB</text>
                  <text x={280} y={177} fill="#94a3b8" fontSize={8} fontFamily="JetBrains Mono" textAnchor="middle">Kolkata · Metals / Mining</text>
                </g>

                {/* Southern Hub */}
                <g 
                  onClick={() => setSelectedZone('Southern Hub')}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <circle cx={180} cy={250} r={selectedZone === 'Southern Hub' ? 30 : 24} fill="#a855f7" fillOpacity={selectedZone === 'Southern Hub' ? 0.4 : 0.2} stroke="#a855f7" strokeWidth={2} />
                  <circle cx={180} cy={250} r={5} fill="#a855f7" />
                  <text x={180} y={235} fill="#e2e8f0" fontSize={10} fontWeight="700" textAnchor="middle">SOUTHERN HUB</text>
                  <text x={180} y={268} fill="#94a3b8" fontSize={8} fontFamily="JetBrains Mono" textAnchor="middle">Bengaluru · Tech / Pharma</text>
                </g>

                {/* Inter-Hub Corridor Connectors */}
                <line x1={190} y1={70} x2={110} y2={165} stroke="#334155" strokeWidth={1} strokeDasharray="3 3" />
                <line x1={190} y1={70} x2={280} y2={160} stroke="#334155" strokeWidth={1} strokeDasharray="3 3" />
                <line x1={110} y1={165} x2={180} y2={250} stroke="#334155" strokeWidth={1} strokeDasharray="3 3" />
                <line x1={280} y1={160} x2={180} y2={250} stroke="#334155" strokeWidth={1} strokeDasharray="3 3" />
                <line x1={110} y1={165} x2={280} y2={160} stroke="#334155" strokeWidth={1} strokeDasharray="3 3" />
              </svg>
            </div>
          </div>

          {/* Right Column: Zone Deep Dive Details & Trade Type Matrix */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            
            {/* Active Zone Metrics Header */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{activeGeo.zone}</span>
                    <span className="text-xs font-mono text-slate-400">({activeGeo.states})</span>
                  </div>
                  <span className="text-xs text-slate-500">Key Centers: {activeGeo.keyCenters}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-mono">Realized Regional P&L</span>
                  <span className={`text-xl font-bold font-mono tabular-nums ${
                    activeGeo.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {activeGeo.netPnL >= 0 ? '+' : ''}{formatINR(activeGeo.netPnL)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block">Win Rate</span>
                  <span className="text-sm font-bold text-slate-100">{activeGeo.winRate}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Executions</span>
                  <span className="text-sm font-bold text-slate-100">{activeGeo.tradeCount} trades</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Capital Deployed</span>
                  <span className="text-sm font-bold text-sky-400">{formatINRCompact(activeGeo.capitalDeployed)}</span>
                </div>
              </div>
            </div>

            {/* Trade Type Strategy Breakdown by Region */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center justify-between">
                <span>Trade Type Allocation in {activeGeo.zone}</span>
                <span className="text-[11px] text-emerald-400 font-normal">Primary: {activeGeo.topTradeTypes.join(', ')}</span>
              </h4>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                {(['QIT', 'MIT', 'WIT', 'DIT', 'QT', 'TBS'] as TradeType[]).map(type => {
                  const matchingInZone = closedTrades.filter(t => {
                    const inst = findInstrument(t.script);
                    const isInZone = inst?.headquarters.zone === activeGeo.zone || 
                      (activeGeo.zone === 'Western Hub' && (t.script.includes('NIFTY') || t.script.includes('RELIANCE')));
                    return isInZone && t.tradeType === type;
                  });

                  const count = matchingInZone.length;
                  const pnl = matchingInZone.reduce((a, c) => a + (c.pnlRupee || 0), 0);

                  return (
                    <div key={type} className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="font-bold text-slate-200 block">{type}</span>
                      <span className="text-[10px] text-slate-500 block">{count} trades</span>
                      <span className={`text-[10px] font-semibold block mt-0.5 ${
                        pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-slate-600'
                      }`}>
                        {formatINRCompact(pnl)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographical Performance Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-1.5 px-2">Geographic Zone</th>
                    <th className="py-1.5 px-2 text-right">Trades</th>
                    <th className="py-1.5 px-2 text-right">Win Rate</th>
                    <th className="py-1.5 px-2 text-right">Total P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {geoMetrics.map(g => (
                    <tr 
                      key={g.zone} 
                      onClick={() => setSelectedZone(g.zone)}
                      className={`cursor-pointer hover:bg-slate-900/60 ${selectedZone === g.zone ? 'bg-slate-900/40' : ''}`}
                    >
                      <td className="py-1.5 px-2 font-medium text-slate-200">{g.zone}</td>
                      <td className="py-1.5 px-2 text-right text-slate-400">{g.tradeCount}</td>
                      <td className="py-1.5 px-2 text-right text-slate-300">{g.winRate}%</td>
                      <td className={`py-1.5 px-2 text-right font-bold ${g.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatINR(g.netPnL)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </div>

      {/* Trade Type Detailed Grid (QIT, MIT, WIT, DIT, QT, TBS) */}
      <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100 mb-4 flex items-center justify-between">
          <span>Trade Type Strategy Performance</span>
          <span className="text-xs font-mono text-slate-400 font-normal">All 6 Input Types</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {strategyStats.map(item => {
            const isPos = item.netPnL >= 0;
            const fullLabels: Record<TradeType, string> = {
              QIT: 'Quarterly Income Trade',
              MIT: 'Monthly Income Trade',
              WIT: 'Weekly Income Trade',
              DIT: 'Daily Income Trade',
              QT: 'Quarterly Positional Trade',
              TBS: 'Time Based / Trend Breakdown Setup'
            };

            return (
              <div key={item.tradeType} className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-bold font-mono text-white">{item.tradeType}</span>
                    <span className={`text-xs font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{formatINR(item.netPnL)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    {fullLabels[item.tradeType]}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Executions:</span>
                    <span className="text-slate-200 font-semibold">{item.tradeCount} trades</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Win Rate:</span>
                    <span className="text-slate-200 font-semibold">{item.winRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Profit Factor:</span>
                    <span className="text-sky-400 font-semibold">{item.profitFactor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Script Source & Entry Type vs Script Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Script Source Performance (HTF Running - I, HTF Running - II, Other) */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Script Source Analysis (HTF Running - I, HTF Running - II, Other)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Analyze trade performance segregated by institutional HTF sources vs discretionary setups.
            </p>

            <div className="space-y-3">
              {sourceStats.map(s => (
                <div key={s.source} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${
                        s.source === 'HTF Running - I' ? 'text-emerald-400' :
                        s.source === 'HTF Running - II' ? 'text-sky-400' : 'text-amber-400'
                      }`}>
                        {s.source}
                      </span>
                      <span className="text-slate-500">({s.tradeCount} trades)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-300">{s.winRate}% Win</span>
                      <span className={`font-bold ${s.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {s.netPnL >= 0 ? '+' : ''}{formatINR(s.netPnL)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        s.source === 'HTF Running - I' ? 'bg-emerald-500' :
                        s.source === 'HTF Running - II' ? 'bg-sky-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${s.winRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entry Type Performance (Direct, TBS, PA) */}
          <div className="pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-200 mb-2 font-mono uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Entry Type Performance (Direct, TBS, PA)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {entryTypeStats.map(e => (
                <div key={e.entryType} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-xs font-bold text-white font-mono block">{e.entryType}</span>
                  <span className="text-[11px] font-mono text-slate-400 block mt-0.5">{e.winRate}% Win</span>
                  <span className="text-[10px] text-slate-500 block">{e.tradeCount} trades</span>
                  <span className={`text-[11px] font-mono font-bold block mt-1 ${
                    e.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {e.netPnL >= 0 ? '+' : ''}{formatINRCompact(e.netPnL)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Script Ranking */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            Script-Level Profitability Leaderboard
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Identify which instruments generate consistent returns versus which waste capital.
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {scriptList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No closed trades recorded yet.</p>
            ) : (
              scriptList.map(item => (
                <div key={item.script} className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="font-bold text-slate-100 font-sans block">{item.script}</span>
                    <span className="text-[10px] text-slate-500">{item.count} trades · {item.winRate}% Win</span>
                  </div>
                  <div className={`font-bold text-sm ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.pnl >= 0 ? '+' : ''}{formatINR(item.pnl)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
