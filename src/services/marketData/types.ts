export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '1D';

export interface MarketCandle {
  time: number; // Unix timestamp in seconds for lightweight-charts
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MarketQuote {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'MCX';
  ltp: number;
  chg: number;
  chgPercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  timestamp: number; // millisecond epoch
}

export interface InstrumentItem {
  symbol: string; // e.g. NSE:RELIANCE-EQ
  displayName: string; // e.g. RELIANCE
  companyName: string; // e.g. Reliance Industries Ltd
  exchange: 'NSE' | 'BSE' | 'MCX';
  segment: 'EQUITY' | 'FUTURES' | 'OPTIONS' | 'INDEX';
  lotSize: number;
  tickSize: number;
  expiryDate?: string;
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
  // Geographical and Sectoral Mapping
  headquarters: {
    city: string;
    state: string;
    zone: 'Western Hub' | 'Southern Hub' | 'Northern Hub' | 'Eastern Hub' | 'Central Hub';
  };
  sector: string;
}

export type FeedStatus = 'LIVE_AUTHORIZED' | 'CONNECTING' | 'RECONNECTING' | 'SANDBOX_DEMO' | 'OFFLINE_DISCONNECTED' | 'ERROR_RATE_LIMITED';

export interface MarketDataFeedState {
  provider: string; // e.g. 'India API (Indian Stock Market API)'
  status: FeedStatus;
  statusMessage: string;
  isAuthorized: boolean;
  lastUpdatedTimestamp: number;
  connectedSymbols: string[];
}

export interface IndiaApiCredentials {
  apiKey: string;
  baseUrl?: string;
}

export interface IMarketDataProvider {
  readonly id: string;
  readonly name: string;
  initialize(credentials?: Partial<IndiaApiCredentials>): Promise<boolean>;
  getQuote(symbol: string): Promise<MarketQuote>;
  getHistoricalCandles(symbol: string, timeframe: TimeFrame, from: number, to: number): Promise<MarketCandle[]>;
  searchInstruments(query: string): Promise<InstrumentItem[]>;
  getFeedStatus(): MarketDataFeedState;
}
