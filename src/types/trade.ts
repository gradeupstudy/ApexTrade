export type TradeType = 'QIT' | 'MIT' | 'WIT' | 'DIT' | 'QT' | 'TBS';

export type TradeDirection = 'Long' | 'Short';

export type ScriptSource = 'HTF Running - I' | 'HTF Running - II' | 'Other';

export type EntryType = 'Direct' | 'TBS' | 'PA';

export type RiskPercent = '0.5%' | '1%' | '2%' | '3%';

// Legacy alias for backward compatibility
export type SetupQuality = 'A+' | 'A' | 'B' | 'C' | ScriptSource;

export type TradeStatus = 'Pending' | 'Active' | 'Close';

export type YesNo = 'Yes' | 'No';

export type EmotionType = 
  | 'Fomo' 
  | 'Greed' 
  | 'Mental Stress' 
  | 'Mental Clarity' 
  | 'Frustration' 
  | 'Calm' 
  | 'Emotion Ready';

export interface Trade {
  id: string;
  serialNumber: number;
  tradeDate: string; // YYYY-MM-DD
  script: string;
  tradeDirection: TradeDirection; // 'Long' | 'Short'
  tradeType: TradeType;
  entryType: EntryType; // 'Direct' | 'TBS' | 'PA'
  riskPerTrade: RiskPercent;
  mtf: YesNo;
  entryPrice: number;
  actualEntryPrice: number; // 0 or executed price (optional for Pending trades)
  stopLoss: number;
  target: number;
  quantity: number; // Calculated: (Risk% * Total Capital) / |Entry Price - Stop Loss|
  capitalRequired: number; // Calculated: Quantity * Entry Price
  actualQuantity: number;
  exitPrice: number | null;
  exitDate: string;
  scriptSource: ScriptSource; // 'HTF Running - I' | 'HTF Running - II' | 'Other'
  setupQuality?: SetupQuality; // Backward compatibility
  chartBefore: string; // Base64 data URL or image link
  chartAfter: string;  // Base64 data URL or image link
  status: TradeStatus;
  pnlRupee: number; // Calculated based on Long (Exit - Entry) or Short (Entry - Exit)
  roiRupee: number; // Return on Investment in Rupee
  roiPercent: number; // Return on Investment percentage
  ruleFollowed: YesNo;
  emotions: EmotionType[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface JournalSettings {
  totalCapital: number;
  currencySymbol: string;
  traderName: string;
}

export interface CapitalMetrics {
  totalCapital: number;
  capitalAvailable: number; // Total Capital + Closed Trades PnL - Active Trades Capital Required
  capitalDeployed: number;  // Active Trades Capital Required
  closedPnL: number;        // Sum of all closed trades PnL
  totalEquity: number;      // Total Capital + closedPnL
  activeTradesCount: number;
  closedTradesCount: number;
  pendingTradesCount: number;
}
