import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  createChart, 
  CandlestickSeries,
  HistogramSeries,
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  HistogramData,
  ColorType
} from 'lightweight-charts';
import { 
  Clock, 
  Activity, 
  Search, 
  ChevronDown, 
  Settings, 
  ShieldCheck, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Maximize2,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { TimeFrame, MarketCandle, MarketQuote, InstrumentItem } from '../services/marketData/types';
import { IndiaApiMarketDataProvider } from '../services/marketData/indiaApiAdapter';
import { searchUniverse, findInstrument } from '../services/marketData/instrumentUniverse';
import { formatINR } from '../utils/calculations';

interface LiveTradingViewChartProps {
  initialSymbol?: string;
  tradeOverlay?: {
    entryPrice?: number;
    actualEntryPrice?: number;
    stopLoss?: number;
    target?: number;
    exitPrice?: number | null;
    script?: string;
  };
  onSymbolChange?: (symbol: string) => void;
  height?: number;
}

const TIMEFRAMES: { label: string; value: TimeFrame }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '1D', value: '1D' }
];

export const LiveTradingViewChart: React.FC<LiveTradingViewChartProps> = ({
  initialSymbol = 'NSE:RELIANCE-EQ',
  tradeOverlay,
  onSymbolChange,
  height = 480
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastCandleRef = useRef<MarketCandle | null>(null);
  const priceLinesRef = useRef<any[]>([]);

  const [currentSymbol, setCurrentSymbol] = useState<string>(() => {
    if (tradeOverlay?.script) {
      const match = findInstrument(tradeOverlay.script);
      if (match) return match.symbol;
    }
    return initialSymbol;
  });

  const [timeframe, setTimeframe] = useState<TimeFrame>('15m');
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [feedStatus, setFeedStatus] = useState<string>('CONNECTING');
  const [feedMessage, setFeedMessage] = useState<string>('Connecting to Indian Stock Market API stream...');
  const [lastTickTime, setLastTickTime] = useState<number>(Date.now());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InstrumentItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Initialize Provider
  const providerRef = useRef<IndiaApiMarketDataProvider>(new IndiaApiMarketDataProvider());

  // Search instruments
  useEffect(() => {
    setSearchResults(searchUniverse(searchQuery));
  }, [searchQuery]);

  // Setup TradingView Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create Chart Instance
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace"
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)', style: 2 },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)', style: 2 }
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: '#475569',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b'
        },
        horzLine: {
          color: '#475569',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b'
        }
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2
        }
      }
    });

    // Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444'
    });

    // Add Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#334155',
      priceFormat: {
        type: 'volume'
      },
      priceScaleId: '', // Overlay over same scale
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Responsive resize listener
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [height]);

  // Load historical candles
  const loadCandles = useCallback(async (sym: string, tf: TimeFrame) => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    setIsLoadingHistory(true);

    try {
      const now = Math.floor(Date.now() / 1000);
      const daysBack = tf === '1m' ? 3 : tf === '5m' ? 7 : tf === '15m' ? 14 : tf === '1h' ? 30 : 90;
      const from = now - (daysBack * 86400);

      const candles = await providerRef.current.getHistoricalCandles(sym, tf, from, now);

      if (candles.length > 0) {
        const tvCandles: CandlestickData[] = candles.map((c: MarketCandle) => ({
          time: c.time as any,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }));

        const tvVolumes: HistogramData[] = candles.map((c: MarketCandle) => ({
          time: c.time as any,
          value: c.volume || 1000,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        }));

        candleSeriesRef.current.setData(tvCandles);
        volumeSeriesRef.current.setData(tvVolumes);
        lastCandleRef.current = candles[candles.length - 1];

        // Draw Trade Overlay Price Lines if provided
        if (tradeOverlay && chartRef.current && candleSeriesRef.current) {
          // Remove old price lines first
          priceLinesRef.current.forEach(line => {
            try {
              candleSeriesRef.current?.removePriceLine(line);
            } catch (err) {}
          });
          priceLinesRef.current = [];

          // Planned Entry
          if (tradeOverlay.entryPrice) {
            const line = candleSeriesRef.current.createPriceLine({
              price: tradeOverlay.entryPrice,
              color: '#38bdf8',
              lineWidth: 1,
              lineStyle: 2, // Dashed
              axisLabelVisible: true,
              title: 'PLAN ENTRY'
            });
            priceLinesRef.current.push(line);
          }
          // Actual Entry
          if (tradeOverlay.actualEntryPrice && tradeOverlay.actualEntryPrice !== tradeOverlay.entryPrice) {
            const line = candleSeriesRef.current.createPriceLine({
              price: tradeOverlay.actualEntryPrice,
              color: '#818cf8',
              lineWidth: 1,
              lineStyle: 0, // Solid
              axisLabelVisible: true,
              title: 'ACTUAL ENTRY'
            });
            priceLinesRef.current.push(line);
          }
          // Stop Loss
          if (tradeOverlay.stopLoss) {
            const line = candleSeriesRef.current.createPriceLine({
              price: tradeOverlay.stopLoss,
              color: '#ef4444',
              lineWidth: 2,
              lineStyle: 0,
              axisLabelVisible: true,
              title: 'STOP LOSS'
            });
            priceLinesRef.current.push(line);
          }
          // Target
          if (tradeOverlay.target) {
            const line = candleSeriesRef.current.createPriceLine({
              price: tradeOverlay.target,
              color: '#10b981',
              lineWidth: 2,
              lineStyle: 0,
              axisLabelVisible: true,
              title: 'TARGET'
            });
            priceLinesRef.current.push(line);
          }
          // Exit Price
          if (tradeOverlay.exitPrice) {
            const line = candleSeriesRef.current.createPriceLine({
              price: tradeOverlay.exitPrice,
              color: '#f59e0b',
              lineWidth: 1,
              lineStyle: 1,
              axisLabelVisible: true,
              title: 'EXIT'
            });
            priceLinesRef.current.push(line);
          }
        }

        chartRef.current?.timeScale().fitContent();
      }
    } catch (e) {
      console.error('Failed to load historical candles:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [tradeOverlay]);

  // Fetch initial quote & reload candles on symbol/timeframe change
  useEffect(() => {
    loadCandles(currentSymbol, timeframe);
    providerRef.current.getQuote(currentSymbol).then((q: MarketQuote) => {
      setQuote(q);
      setLastTickTime(Date.now());
    });
  }, [currentSymbol, timeframe, loadCandles]);

  // WebSocket Live Streaming & Tick Management
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let isMounted = true;

    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/market-data`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!isMounted) return;
        setFeedStatus('LIVE_STREAMING');
        // Subscribe to current symbol
        ws?.send(JSON.stringify({
          type: 'subscribe',
          symbol: currentSymbol
        }));
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'feed_status') {
            setFeedStatus(msg.status);
            setFeedMessage(msg.message);
            setLastTickTime(msg.timestamp);
          } else if (msg.type === 'tick' && msg.data?.symbol === currentSymbol) {
            const tick = msg.data;
            setLastTickTime(tick.timestamp || Date.now());

            // Update live quote
            setQuote((prev: MarketQuote | null) => prev ? {
              ...prev,
              ltp: tick.ltp,
              chg: tick.chg,
              chgPercent: tick.chgPercent,
              timestamp: tick.timestamp
            } : null);

            // Update current candle without full reload
            if (candleSeriesRef.current && lastCandleRef.current) {
              const last = lastCandleRef.current;
              const updatedCandle: MarketCandle = {
                time: last.time,
                open: last.open,
                high: Math.max(last.high, tick.ltp),
                low: Math.min(last.low, tick.ltp),
                close: tick.ltp,
                volume: (last.volume || 1000) + 10
              };
              lastCandleRef.current = updatedCandle;
              candleSeriesRef.current.update(updatedCandle as any);
            }
          }
        } catch (e) {
          console.error('Error parsing market data tick:', e);
        }
      };

      ws.onerror = () => {
        if (!isMounted) return;
        setFeedStatus('ERROR_RETRYING');
        setFeedMessage('Reconnecting to market data feed...');
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setFeedStatus('OFFLINE_DISCONNECTED');
        setFeedMessage('Disconnected. Reconnecting in 3s...');
        reconnectTimeout = setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [currentSymbol]);

  const handleSelectInstrument = (inst: InstrumentItem) => {
    setCurrentSymbol(inst.symbol);
    setIsSearchOpen(false);
    if (onSymbolChange) onSymbolChange(inst.symbol);
  };

  const instrument = findInstrument(currentSymbol);
  const isUp = (quote?.chg || 0) >= 0;

  return (
    <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      
      {/* Chart Control Bar */}
      <div className="p-3 bg-[#0b0f19] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Symbol Selector & Live Quote */}
        <div className="flex items-center gap-3">
          
          {/* Symbol Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-100 font-mono text-xs font-bold transition-colors"
            >
              <span>{instrument?.displayName || currentSymbol}</span>
              <span className="text-[10px] text-slate-400 font-normal">({instrument?.exchange || 'NSE'})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Symbol Search Modal / Popover */}
            {isSearchOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-2 border-b border-slate-800">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search NSE/BSE cash, F&O..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 text-xs">
                  {searchResults.map((inst: InstrumentItem) => (
                    <button
                      key={inst.symbol}
                      onClick={() => handleSelectInstrument(inst)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-800 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold font-mono text-slate-100">{inst.displayName}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">{inst.companyName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-400">
                          {inst.segment}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">{inst.headquarters.zone}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Price & Change */}
          {quote && (
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-base font-bold text-white tabular-nums">
                ₹{quote.ltp.toFixed(2)}
              </span>
              <span className={`flex items-center font-semibold tabular-nums ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? '+' : ''}{quote.chg.toFixed(2)} ({isUp ? '+' : ''}{quote.chgPercent.toFixed(2)}%)
              </span>
            </div>
          )}

          {isLoadingHistory && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
              <span>Loading candles...</span>
            </div>
          )}
        </div>

        {/* Right: Timeframe Selectors & Provider Feed Status */}
        <div className="flex items-center gap-3">
          
          {/* Timeframe Buttons */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  timeframe === tf.value
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Provider Feed Status Banner */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
            {feedStatus === 'LIVE_AUTHORIZED' || feedStatus === 'LIVE_STREAMING' ? (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
                <span className="font-semibold">INDIA API LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-400">
                <Activity className="w-3.5 h-3.5" />
                <span className="font-semibold">SANDBOX FEED</span>
              </div>
            )}
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 tabular-nums">
              {new Date(lastTickTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

        </div>

      </div>

      {/* Chart Canvas */}
      <div 
        ref={chartContainerRef} 
        className="w-full relative bg-[#090d16]" 
        style={{ height }}
      />

      {/* Bottom Chart Footer Strip with Levels & Disclaimers */}
      <div className="p-2.5 bg-[#0b0f19] border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span> Plan Entry
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Stop Loss
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Target
          </span>
          {tradeOverlay?.exitPrice && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Exit
            </span>
          )}
        </div>

        <div className="text-[10px] text-slate-500">
          TradingView Lightweight Charts™ · Feed: {feedMessage}
        </div>
      </div>

    </div>
  );
};
