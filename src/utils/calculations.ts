import { 
  Trade, 
  RiskPercent, 
  CapitalMetrics, 
  EmotionType, 
  TradeType, 
  SetupQuality, 
  TradeDirection, 
  ScriptSource, 
  EntryType 
} from '../types/trade';

export function parseRiskPercent(riskStr: RiskPercent): number {
  switch (riskStr) {
    case '0.5%':
      return 0.005;
    case '1%':
      return 0.01;
    case '2%':
      return 0.02;
    case '3%':
      return 0.03;
    default:
      return 0.01;
  }
}

/**
 * Quantity calculation as requested:
 * "Quantity - this option value Calculated on the basis of Risk per Trade
 * (If Risk is 0.5% of Total Capital Then Calculate 0.5% Amount of Total Capital and then divide it by Entry Price - Stop Loss.
 * This will give total quantity. Calculate for 1%, 2%, 3% as per option i will select in Risk per trade colomn"
 */
export function calculatePlannedQuantity(
  totalCapital: number,
  riskPercent: RiskPercent,
  entryPrice: number,
  stopLoss: number
): number {
  if (!totalCapital || totalCapital <= 0 || !entryPrice || entryPrice <= 0) return 0;
  const riskAmount = totalCapital * parseRiskPercent(riskPercent);
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  if (riskPerShare <= 0) return 0;
  return Math.floor(riskAmount / riskPerShare);
}

/**
 * Capital Required = Quantity * Entry Price
 */
export function calculateCapitalRequired(quantity: number, entryPrice: number): number {
  if (!quantity || !entryPrice) return 0;
  return Math.round(quantity * entryPrice * 100) / 100;
}

/**
 * Planned Target Profit per unit:
 * Long: Target - Entry Price (e.g. 120 - 100 = +20)
 * Short: Entry Price - Target (e.g. 120 - 90 = +30)
 */
export function calculateProjectedTargetProfit(
  entryPrice: number,
  target: number,
  direction: TradeDirection = 'Long'
): number {
  if (!entryPrice || !target) return 0;
  const diff = direction === 'Short' ? entryPrice - target : target - entryPrice;
  return Math.round(diff * 100) / 100;
}

/**
 * Planned Risk (Stop Loss distance) per unit:
 * Long: Entry Price - Stop Loss (e.g. 100 - 90 = 10)
 * Short: Stop Loss - Entry Price (e.g. 125 - 120 = 5)
 */
export function calculateProjectedRisk(
  entryPrice: number,
  stopLoss: number,
  direction: TradeDirection = 'Long'
): number {
  if (!entryPrice || !stopLoss) return 0;
  const diff = direction === 'Short' ? stopLoss - entryPrice : entryPrice - stopLoss;
  return Math.round(diff * 100) / 100;
}

/**
 * Profit / Loss in Rupee:
 * Long: (Exit Price - Actual Entry Price) * Actual Quantity
 * Short: (Actual Entry Price - Exit Price) * Actual Quantity
 * If positive: profit, if negative: loss
 */
export function calculatePnL(
  exitPrice: number | null,
  actualEntryPrice: number,
  actualQuantity: number,
  direction: TradeDirection = 'Long'
): number {
  if (exitPrice === null || exitPrice === undefined || isNaN(exitPrice)) return 0;
  if (!actualEntryPrice || isNaN(actualEntryPrice)) return 0;
  const qty = actualQuantity > 0 ? actualQuantity : 1;
  const pnl = direction === 'Short'
    ? (actualEntryPrice - exitPrice) * qty
    : (exitPrice - actualEntryPrice) * qty;
  return Math.round(pnl * 100) / 100;
}

/**
 * Return on Investment (ROI in %):
 * Long: ((Exit Price - Actual Entry Price) / Actual Entry Price) * 100
 * Short: ((Actual Entry Price - Exit Price) / Actual Entry Price) * 100
 */
export function calculateROIPercent(
  exitPrice: number | null,
  actualEntryPrice: number,
  direction: TradeDirection = 'Long'
): number {
  if (exitPrice === null || exitPrice === undefined || isNaN(exitPrice)) return 0;
  if (!actualEntryPrice || actualEntryPrice <= 0) return 0;
  const roi = direction === 'Short'
    ? ((actualEntryPrice - exitPrice) / actualEntryPrice) * 100
    : ((exitPrice - actualEntryPrice) / actualEntryPrice) * 100;
  return Math.round(roi * 100) / 100;
}

/**
 * Capital Available Calculation:
 * "In Capital Available option - Check all trade Profit/Loss Colomn whose status is closed
 * If profit then add if Loss then substract the amount from the total capital and Check all the trades
 * whose status are active check the colomn "Capital Required" and substract these amount.
 * so that i can calculate the total Remaining amount for next trade."
 */
export function calculateCapitalMetrics(trades: Trade[], totalCapital: number): CapitalMetrics {
  const safeCapital = totalCapital > 0 ? totalCapital : 0;
  
  let closedPnL = 0;
  let capitalDeployed = 0;
  let activeTradesCount = 0;
  let closedTradesCount = 0;
  let pendingTradesCount = 0;

  for (const trade of trades) {
    if (trade.status === 'Close') {
      closedTradesCount++;
      closedPnL += trade.pnlRupee || 0;
    } else if (trade.status === 'Active') {
      activeTradesCount++;
      capitalDeployed += trade.capitalRequired || 0;
    } else if (trade.status === 'Pending') {
      pendingTradesCount++;
    }
  }

  // Capital Available = Total Capital + (Closed Trades Net PnL) - (Active Trades Capital Required)
  const capitalAvailable = safeCapital + closedPnL - capitalDeployed;
  const totalEquity = safeCapital + closedPnL;

  return {
    totalCapital: safeCapital,
    capitalAvailable: Math.round(capitalAvailable * 100) / 100,
    capitalDeployed: Math.round(capitalDeployed * 100) / 100,
    closedPnL: Math.round(closedPnL * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    activeTradesCount,
    closedTradesCount,
    pendingTradesCount
  };
}

export function formatINR(val: number): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(absVal);
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatINRCompact(val: number): string {
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  if (absVal >= 10000000) {
    return `${isNegative ? '-' : ''}₹${(absVal / 10000000).toFixed(2)} Cr`;
  }
  if (absVal >= 100000) {
    return `${isNegative ? '-' : ''}₹${(absVal / 100000).toFixed(2)} L`;
  }
  if (absVal >= 1000) {
    return `${isNegative ? '-' : ''}₹${(absVal / 1000).toFixed(1)}k`;
  }
  return formatINR(val);
}

export interface AnalyticsSummary {
  totalTrades: number;
  closedTrades: number;
  activeTrades: number;
  pendingTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number; // percentage 0-100
  lossRate: number;
  grossProfits: number;
  grossLosses: number;
  netPnL: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRealized: number;
  largestWin: number;
  largestLoss: number;
  avgReturnPercent: number;
  ruleFollowedWinRate: number;
  ruleViolatedWinRate: number;
  ruleFollowedPnL: number;
  ruleViolatedPnL: number;
}

export function calculateAnalyticsSummary(trades: Trade[]): AnalyticsSummary {
  const closed = trades.filter(t => t.status === 'Close');
  const active = trades.filter(t => t.status === 'Active');
  const pending = trades.filter(t => t.status === 'Pending');

  let winningTrades = 0;
  let losingTrades = 0;
  let breakEvenTrades = 0;
  let grossProfits = 0;
  let grossLosses = 0;
  let netPnL = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalRoiPercent = 0;

  let ruleFollowedWins = 0;
  let ruleFollowedTotal = 0;
  let ruleFollowedPnL = 0;

  let ruleViolatedWins = 0;
  let ruleViolatedTotal = 0;
  let ruleViolatedPnL = 0;

  for (const t of closed) {
    const pnl = t.pnlRupee || 0;
    netPnL += pnl;
    totalRoiPercent += t.roiPercent || 0;

    if (pnl > 0) {
      winningTrades++;
      grossProfits += pnl;
      if (pnl > largestWin) largestWin = pnl;
    } else if (pnl < 0) {
      losingTrades++;
      grossLosses += Math.abs(pnl);
      if (pnl < largestLoss) largestLoss = pnl;
    } else {
      breakEvenTrades++;
    }

    if (t.ruleFollowed === 'Yes') {
      ruleFollowedTotal++;
      ruleFollowedPnL += pnl;
      if (pnl > 0) ruleFollowedWins++;
    } else {
      ruleViolatedTotal++;
      ruleViolatedPnL += pnl;
      if (pnl > 0) ruleViolatedWins++;
    }
  }

  const closedCount = closed.length;
  const winRate = closedCount > 0 ? (winningTrades / closedCount) * 100 : 0;
  const lossRate = closedCount > 0 ? (losingTrades / closedCount) * 100 : 0;
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 99.9 : 0;
  const avgWin = winningTrades > 0 ? grossProfits / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLosses / losingTrades : 0;
  const riskRewardRealized = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;
  const avgReturnPercent = closedCount > 0 ? totalRoiPercent / closedCount : 0;

  const ruleFollowedWinRate = ruleFollowedTotal > 0 ? (ruleFollowedWins / ruleFollowedTotal) * 100 : 0;
  const ruleViolatedWinRate = ruleViolatedTotal > 0 ? (ruleViolatedWins / ruleViolatedTotal) * 100 : 0;

  return {
    totalTrades: trades.length,
    closedTrades: closedCount,
    activeTrades: active.length,
    pendingTrades: pending.length,
    winningTrades,
    losingTrades,
    breakEvenTrades,
    winRate: Math.round(winRate * 10) / 10,
    lossRate: Math.round(lossRate * 10) / 10,
    grossProfits: Math.round(grossProfits),
    grossLosses: Math.round(grossLosses),
    netPnL: Math.round(netPnL),
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin),
    avgLoss: Math.round(avgLoss),
    riskRewardRealized: Math.round(riskRewardRealized * 100) / 100,
    largestWin: Math.round(largestWin),
    largestLoss: Math.round(largestLoss),
    avgReturnPercent: Math.round(avgReturnPercent * 10) / 10,
    ruleFollowedWinRate: Math.round(ruleFollowedWinRate * 10) / 10,
    ruleViolatedWinRate: Math.round(ruleViolatedWinRate * 10) / 10,
    ruleFollowedPnL: Math.round(ruleFollowedPnL),
    ruleViolatedPnL: Math.round(ruleViolatedPnL)
  };
}

export interface EmotionMetric {
  emotion: EmotionType;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netPnL: number;
  avgPnL: number;
}

export function calculateEmotionAnalytics(trades: Trade[]): EmotionMetric[] {
  const allEmotions: EmotionType[] = [
    'Fomo',
    'Greed',
    'Mental Stress',
    'Mental Clarity',
    'Frustration',
    'Calm',
    'Emotion Ready'
  ];

  const closed = trades.filter(t => t.status === 'Close');

  return allEmotions.map(emotion => {
    const matchingTrades = closed.filter(t => t.emotions?.includes(emotion));
    const tradeCount = matchingTrades.length;
    let winCount = 0;
    let lossCount = 0;
    let netPnL = 0;

    for (const t of matchingTrades) {
      const pnl = t.pnlRupee || 0;
      netPnL += pnl;
      if (pnl > 0) winCount++;
      else if (pnl < 0) lossCount++;
    }

    const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
    const avgPnL = tradeCount > 0 ? netPnL / tradeCount : 0;

    return {
      emotion,
      tradeCount,
      winCount,
      lossCount,
      winRate: Math.round(winRate * 10) / 10,
      netPnL: Math.round(netPnL),
      avgPnL: Math.round(avgPnL)
    };
  });
}

export interface StrategyMetric {
  tradeType: TradeType;
  tradeCount: number;
  winCount: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
}

export function calculateStrategyAnalytics(trades: Trade[]): StrategyMetric[] {
  const types: TradeType[] = ['QIT', 'MIT', 'WIT', 'DIT', 'QT', 'TBS'];
  const closed = trades.filter(t => t.status === 'Close');

  return types.map(tradeType => {
    const list = closed.filter(t => t.tradeType === tradeType);
    const tradeCount = list.length;
    let winCount = 0;
    let grossWins = 0;
    let grossLosses = 0;
    let netPnL = 0;

    for (const t of list) {
      const pnl = t.pnlRupee || 0;
      netPnL += pnl;
      if (pnl > 0) {
        winCount++;
        grossWins += pnl;
      } else if (pnl < 0) {
        grossLosses += Math.abs(pnl);
      }
    }

    const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 99.9 : 0;

    return {
      tradeType,
      tradeCount,
      winCount,
      winRate: Math.round(winRate * 10) / 10,
      netPnL: Math.round(netPnL),
      profitFactor: Math.round(profitFactor * 100) / 100
    };
  });
}

export interface ScriptSourceMetric {
  source: ScriptSource;
  tradeCount: number;
  winCount: number;
  winRate: number;
  netPnL: number;
}

export function calculateScriptSourceAnalytics(trades: Trade[]): ScriptSourceMetric[] {
  const sources: ScriptSource[] = ['HTF Running - I', 'HTF Running - II', 'Other'];
  const closed = trades.filter(t => t.status === 'Close');

  return sources.map(source => {
    const list = closed.filter(t => {
      if (t.scriptSource) return t.scriptSource === source;
      // Fallback for legacy trades
      if (source === 'HTF Running - I') return t.setupQuality === 'A+' || t.setupQuality === 'A';
      if (source === 'HTF Running - II') return t.setupQuality === 'B';
      return t.setupQuality === 'C';
    });
    const tradeCount = list.length;
    let winCount = 0;
    let netPnL = 0;

    for (const t of list) {
      const pnl = t.pnlRupee || 0;
      netPnL += pnl;
      if (pnl > 0) winCount++;
    }

    const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;

    return {
      source,
      tradeCount,
      winCount,
      winRate: Math.round(winRate * 10) / 10,
      netPnL: Math.round(netPnL)
    };
  });
}

export interface EntryTypeMetric {
  entryType: EntryType;
  tradeCount: number;
  winCount: number;
  winRate: number;
  netPnL: number;
}

export function calculateEntryTypeAnalytics(trades: Trade[]): EntryTypeMetric[] {
  const types: EntryType[] = ['Direct', 'TBS', 'PA'];
  const closed = trades.filter(t => t.status === 'Close');

  return types.map(entryType => {
    const list = closed.filter(t => (t.entryType || 'Direct') === entryType);
    const tradeCount = list.length;
    let winCount = 0;
    let netPnL = 0;

    for (const t of list) {
      const pnl = t.pnlRupee || 0;
      netPnL += pnl;
      if (pnl > 0) winCount++;
    }

    const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;

    return {
      entryType,
      tradeCount,
      winCount,
      winRate: Math.round(winRate * 10) / 10,
      netPnL: Math.round(netPnL)
    };
  });
}

// Backward-compatible alias for existing components
export interface SetupQualityMetric {
  quality: SetupQuality;
  tradeCount: number;
  winCount: number;
  winRate: number;
  netPnL: number;
}

export function calculateQualityAnalytics(trades: Trade[]): SetupQualityMetric[] {
  const scriptSources = calculateScriptSourceAnalytics(trades);
  return scriptSources.map(s => ({
    quality: s.source as SetupQuality,
    tradeCount: s.tradeCount,
    winCount: s.winCount,
    winRate: s.winRate,
    netPnL: s.netPnL
  }));
}

export interface EquityCurvePoint {
  date: string;
  serialNumber: number;
  script: string;
  pnl: number;
  cumulativePnL: number;
  equity: number;
  tradeType: TradeType;
}

export function calculateEquityCurve(trades: Trade[], startingCapital: number): EquityCurvePoint[] {
  const closed = trades
    .filter(t => t.status === 'Close')
    .sort((a, b) => {
      const dateA = new Date(a.exitDate || a.tradeDate).getTime();
      const dateB = new Date(b.exitDate || b.tradeDate).getTime();
      return dateA - dateB || a.serialNumber - b.serialNumber;
    });

  let cumulativePnL = 0;
  const points: EquityCurvePoint[] = [];

  // Start point
  if (closed.length > 0) {
    points.push({
      date: 'Start',
      serialNumber: 0,
      script: 'Initial Balance',
      pnl: 0,
      cumulativePnL: 0,
      equity: startingCapital,
      tradeType: 'DIT'
    });
  }

  for (const t of closed) {
    const pnl = t.pnlRupee || 0;
    cumulativePnL += pnl;
    points.push({
      date: t.exitDate || t.tradeDate,
      serialNumber: t.serialNumber,
      script: t.script,
      pnl,
      cumulativePnL: Math.round(cumulativePnL),
      equity: Math.round(startingCapital + cumulativePnL),
      tradeType: t.tradeType
    });
  }

  return points;
}

export interface MTFStockMetric {
  script: string;
  tradeCount: number;
  winCount: number;
  winRate: number;
  netPnL: number;
  capitalDeployed: number;
  avgReturnPercent: number;
  lastTradeDate: string;
}

export interface MTFAnalytics {
  yesTradesCount: number;
  yesClosedCount: number;
  yesWins: number;
  yesWinRate: number;
  yesNetPnL: number;
  yesGrossProfit: number;
  yesGrossLoss: number;
  yesProfitFactor: number;
  yesCapitalDeployed: number;
  noTradesCount: number;
  noClosedCount: number;
  noWins: number;
  noWinRate: number;
  noNetPnL: number;
  noProfitFactor: number;
  noCapitalDeployed: number;
  mtfStocks: MTFStockMetric[];
}

export function calculateMTFAnalytics(trades: Trade[]): MTFAnalytics {
  const mtfYesAll = trades.filter(t => t.mtf === 'Yes');
  const mtfNoAll = trades.filter(t => t.mtf === 'No');

  const mtfYesClosed = mtfYesAll.filter(t => t.status === 'Close');
  const mtfNoClosed = mtfNoAll.filter(t => t.status === 'Close');

  let yesWins = 0;
  let yesGrossProfit = 0;
  let yesGrossLoss = 0;
  let yesNetPnL = 0;
  let yesCapitalDeployed = 0;

  for (const t of mtfYesClosed) {
    const pnl = t.pnlRupee || 0;
    yesNetPnL += pnl;
    if (pnl > 0) {
      yesWins++;
      yesGrossProfit += pnl;
    } else {
      yesGrossLoss += Math.abs(pnl);
    }
  }

  for (const t of mtfYesAll) {
    yesCapitalDeployed += t.capitalRequired || 0;
  }

  const yesTradesCount = mtfYesAll.length;
  const yesClosedCount = mtfYesClosed.length;
  const yesWinRate = yesClosedCount > 0 ? (yesWins / yesClosedCount) * 100 : 0;
  const yesProfitFactor = yesGrossLoss > 0 ? (yesGrossProfit / yesGrossLoss) : (yesGrossProfit > 0 ? 99.9 : 1.0);

  let noWins = 0;
  let noGrossProfit = 0;
  let noGrossLoss = 0;
  let noNetPnL = 0;
  let noCapitalDeployed = 0;

  for (const t of mtfNoClosed) {
    const pnl = t.pnlRupee || 0;
    noNetPnL += pnl;
    if (pnl > 0) {
      noWins++;
      noGrossProfit += pnl;
    } else {
      noGrossLoss += Math.abs(pnl);
    }
  }

  for (const t of mtfNoAll) {
    noCapitalDeployed += t.capitalRequired || 0;
  }

  const noTradesCount = mtfNoAll.length;
  const noClosedCount = mtfNoClosed.length;
  const noWinRate = noClosedCount > 0 ? (noWins / noClosedCount) * 100 : 0;
  const noProfitFactor = noGrossLoss > 0 ? (noGrossProfit / noGrossLoss) : (noGrossProfit > 0 ? 99.9 : 1.0);

  // Group stocks marked MTF === 'Yes'
  const stockMap = new Map<string, {
    tradeCount: number;
    winCount: number;
    netPnL: number;
    capitalDeployed: number;
    roiSum: number;
    lastTradeDate: string;
  }>();

  for (const t of mtfYesAll) {
    const existing = stockMap.get(t.script) || {
      tradeCount: 0,
      winCount: 0,
      netPnL: 0,
      capitalDeployed: 0,
      roiSum: 0,
      lastTradeDate: t.tradeDate
    };
    existing.tradeCount++;
    existing.capitalDeployed += t.capitalRequired || 0;
    if (t.status === 'Close') {
      const pnl = t.pnlRupee || 0;
      existing.netPnL += pnl;
      if (pnl > 0) existing.winCount++;
      existing.roiSum += t.roiPercent || 0;
    }
    if (t.tradeDate > existing.lastTradeDate) {
      existing.lastTradeDate = t.tradeDate;
    }
    stockMap.set(t.script, existing);
  }

  const mtfStocks: MTFStockMetric[] = Array.from(stockMap.entries()).map(([script, data]) => ({
    script,
    tradeCount: data.tradeCount,
    winCount: data.winCount,
    winRate: data.tradeCount > 0 ? Math.round((data.winCount / data.tradeCount) * 100) : 0,
    netPnL: Math.round(data.netPnL),
    capitalDeployed: Math.round(data.capitalDeployed),
    avgReturnPercent: data.tradeCount > 0 ? Math.round((data.roiSum / data.tradeCount) * 10) / 10 : 0,
    lastTradeDate: data.lastTradeDate
  })).sort((a, b) => b.netPnL - a.netPnL);

  return {
    yesTradesCount,
    yesClosedCount,
    yesWins,
    yesWinRate: Math.round(yesWinRate * 10) / 10,
    yesNetPnL: Math.round(yesNetPnL),
    yesGrossProfit: Math.round(yesGrossProfit),
    yesGrossLoss: Math.round(yesGrossLoss),
    yesProfitFactor: Math.round(yesProfitFactor * 100) / 100,
    yesCapitalDeployed: Math.round(yesCapitalDeployed),
    noTradesCount,
    noClosedCount,
    noWins,
    noWinRate: Math.round(noWinRate * 10) / 10,
    noNetPnL: Math.round(noNetPnL),
    noProfitFactor: Math.round(noProfitFactor * 100) / 100,
    noCapitalDeployed: Math.round(noCapitalDeployed),
    mtfStocks
  };
}

export interface TimeCyclePoint {
  periodLabel: string;
  sortKey: string;
  tradeCount: number;
  winCount: number;
  winRate: number;
  netPnL: number;
  grossProfit: number;
  grossLoss: number;
  cumulativePnL: number;
}

export interface TimeCycleData {
  weekly: TimeCyclePoint[];
  monthly: TimeCyclePoint[];
  yearly: TimeCyclePoint[];
}

function getWeekNumber(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'W00';
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function calculateTimeCycleAnalytics(trades: Trade[]): TimeCycleData {
  const closedTrades = trades
    .filter(t => t.status === 'Close')
    .sort((a, b) => {
      const dateA = a.exitDate || a.tradeDate;
      const dateB = b.exitDate || b.tradeDate;
      return dateA.localeCompare(dateB);
    });

  // Group helpers
  const groupWeekly = new Map<string, { trades: number; wins: number; pnl: number; grossProfit: number; grossLoss: number }>();
  const groupMonthly = new Map<string, { trades: number; wins: number; pnl: number; grossProfit: number; grossLoss: number }>();
  const groupYearly = new Map<string, { trades: number; wins: number; pnl: number; grossProfit: number; grossLoss: number }>();

  for (const t of closedTrades) {
    const rawDate = t.exitDate || t.tradeDate || '2026-01-01';
    const weekKey = getWeekNumber(rawDate);
    const monthKey = rawDate.slice(0, 7); // YYYY-MM
    const yearKey = rawDate.slice(0, 4); // YYYY

    const pnl = t.pnlRupee || 0;
    const isWin = pnl > 0;
    const gProf = isWin ? pnl : 0;
    const gLoss = !isWin ? Math.abs(pnl) : 0;

    // Weekly
    const w = groupWeekly.get(weekKey) || { trades: 0, wins: 0, pnl: 0, grossProfit: 0, grossLoss: 0 };
    w.trades++;
    w.pnl += pnl;
    w.grossProfit += gProf;
    w.grossLoss += gLoss;
    if (isWin) w.wins++;
    groupWeekly.set(weekKey, w);

    // Monthly
    const m = groupMonthly.get(monthKey) || { trades: 0, wins: 0, pnl: 0, grossProfit: 0, grossLoss: 0 };
    m.trades++;
    m.pnl += pnl;
    m.grossProfit += gProf;
    m.grossLoss += gLoss;
    if (isWin) m.wins++;
    groupMonthly.set(monthKey, m);

    // Yearly
    const y = groupYearly.get(yearKey) || { trades: 0, wins: 0, pnl: 0, grossProfit: 0, grossLoss: 0 };
    y.trades++;
    y.pnl += pnl;
    y.grossProfit += gProf;
    y.grossLoss += gLoss;
    if (isWin) y.wins++;
    groupYearly.set(yearKey, y);
  }

  // Convert map to cumulative points
  const buildCyclePoints = (
    map: Map<string, { trades: number; wins: number; pnl: number; grossProfit: number; grossLoss: number }>,
    formatLabel: (key: string) => string
  ): TimeCyclePoint[] => {
    const sortedKeys = Array.from(map.keys()).sort();
    let cumulative = 0;
    return sortedKeys.map(key => {
      const val = map.get(key)!;
      cumulative += val.pnl;
      return {
        sortKey: key,
        periodLabel: formatLabel(key),
        tradeCount: val.trades,
        winCount: val.wins,
        winRate: val.trades > 0 ? Math.round((val.wins / val.trades) * 100) : 0,
        netPnL: Math.round(val.pnl),
        grossProfit: Math.round(val.grossProfit),
        grossLoss: Math.round(val.grossLoss),
        cumulativePnL: Math.round(cumulative)
      };
    });
  };

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return {
    weekly: buildCyclePoints(groupWeekly, k => {
      const parts = k.split('-W');
      return `W${parts[1]} '${parts[0]?.slice(2)}`;
    }),
    monthly: buildCyclePoints(groupMonthly, k => {
      const [year, mStr] = k.split('-');
      const mIdx = parseInt(mStr, 10) - 1;
      return `${MONTH_NAMES[mIdx] || mStr} ${year}`;
    }),
    yearly: buildCyclePoints(groupYearly, k => `Year ${k}`)
  };
}
