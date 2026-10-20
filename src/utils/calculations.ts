import { Trade, RiskPercent, CapitalMetrics, EmotionType, TradeType, SetupQuality } from '../types/trade';

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
 * Profit / Loss in Rupee:
 * Based on (Exit Price - Actual Entry Price) * Actual Quantity
 * If positive: profit, if negative: loss
 */
export function calculatePnL(
  exitPrice: number | null,
  actualEntryPrice: number,
  actualQuantity: number
): number {
  if (exitPrice === null || exitPrice === undefined || isNaN(exitPrice)) return 0;
  if (!actualEntryPrice || isNaN(actualEntryPrice)) return 0;
  const qty = actualQuantity > 0 ? actualQuantity : 1;
  const pnl = (exitPrice - actualEntryPrice) * qty;
  return Math.round(pnl * 100) / 100;
}

/**
 * Return on Investment (ROI in %):
 * ((Exit Price - Actual Entry Price) / Actual Entry Price) * 100
 */
export function calculateROIPercent(
  exitPrice: number | null,
  actualEntryPrice: number
): number {
  if (exitPrice === null || exitPrice === undefined || isNaN(exitPrice)) return 0;
  if (!actualEntryPrice || actualEntryPrice <= 0) return 0;
  const roi = ((exitPrice - actualEntryPrice) / actualEntryPrice) * 100;
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

export interface SetupQualityMetric {
  quality: SetupQuality;
  tradeCount: number;
  winCount: number;
  winRate: number;
  netPnL: number;
}

export function calculateQualityAnalytics(trades: Trade[]): SetupQualityMetric[] {
  const qualities: SetupQuality[] = ['A+', 'A', 'B', 'C'];
  const closed = trades.filter(t => t.status === 'Close');

  return qualities.map(quality => {
    const list = closed.filter(t => t.setupQuality === quality);
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
      quality,
      tradeCount,
      winCount,
      winRate: Math.round(winRate * 10) / 10,
      netPnL: Math.round(netPnL)
    };
  });
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
