import { Trade } from '../types/trade';

// High-fidelity SVG chart data URLs for pre & post trade screenshots
function createSvgChart(title: string, type: 'bullish' | 'bearish' | 'breakout' | 'reversal', isPost: boolean): string {
  const isUp = type === 'bullish' || (type === 'breakout' && !isPost);
  const strokeColor = isUp ? '#10b981' : '#ef4444';
  const fillGradient = isUp ? 'url(#greenGrad)' : 'url(#redGrad)';
  
  const pathD = type === 'bullish'
    ? 'M 20 180 Q 80 160 140 170 T 260 130 T 380 90 T 500 40 L 500 220 L 20 220 Z'
    : type === 'breakout'
    ? 'M 20 150 L 120 145 L 200 152 L 280 142 L 340 110 L 420 70 L 500 45 L 500 220 L 20 220 Z'
    : type === 'reversal'
    ? 'M 20 50 L 100 80 L 180 120 L 260 170 L 340 160 L 420 120 L 500 70 L 500 220 L 20 220 Z'
    : 'M 20 50 Q 80 70 140 60 T 260 110 T 380 150 T 500 190 L 500 220 L 20 220 Z';

  const lineD = type === 'bullish'
    ? 'M 20 180 Q 80 160 140 170 T 260 130 T 380 90 T 500 40'
    : type === 'breakout'
    ? 'M 20 150 L 120 145 L 200 152 L 280 142 L 340 110 L 420 70 L 500 45'
    : type === 'reversal'
    ? 'M 20 50 L 100 80 L 180 120 L 260 170 L 340 160 L 420 120 L 500 70'
    : 'M 20 50 Q 80 70 140 60 T 260 110 T 380 150 T 500 190';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 240" width="100%" height="100%" style="background:#0f172a; font-family: sans-serif;">
    <defs>
      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
      </linearGradient>
      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ef4444" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#ef4444" stop-opacity="0.0"/>
      </linearGradient>
    </defs>
    <!-- Grid lines -->
    <line x1="20" y1="60" x2="500" y2="60" stroke="#1e293b" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="20" y1="110" x2="500" y2="110" stroke="#1e293b" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="20" y1="160" x2="500" y2="160" stroke="#1e293b" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="140" y1="20" x2="140" y2="210" stroke="#1e293b" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="280" y1="20" x2="280" y2="210" stroke="#1e293b" stroke-width="1" stroke-dasharray="3 3"/>
    <line x1="420" y1="20" x2="420" y2="210" stroke="#1e293b" stroke-width="1" stroke-dasharray="3 3"/>
    
    <!-- Area & Line -->
    <path d="${pathD}" fill="${fillGradient}" />
    <path d="${lineD}" fill="none" stroke="${strokeColor}" stroke-width="2.5" />
    
    <!-- Levels -->
    <line x1="20" y1="140" x2="500" y2="140" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4 4"/>
    <text x="25" y="135" fill="#38bdf8" font-size="10" font-weight="600">ENTRY ZONE</text>
    
    <!-- Header -->
    <rect x="0" y="0" width="520" height="34" fill="#090d16" fill-opacity="0.9"/>
    <text x="18" y="22" fill="#e2e8f0" font-size="12" font-weight="700">${title.toUpperCase()}</text>
    <text x="440" y="22" fill="${isPost ? '#38bdf8' : '#94a3b8'}" font-size="11" font-weight="600">${isPost ? 'POST TRADE' : 'PRE SETUP'}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_CAPITAL = 500000; // ₹5,00,000

export const SAMPLE_TRADES: Trade[] = [
  {
    id: 'tr-01',
    serialNumber: 1,
    tradeDate: '2026-10-02',
    script: 'NIFTY 25800 CE',
    tradeDirection: 'Long',
    tradeType: 'WIT',
    entryType: 'Direct',
    riskPerTrade: '1%',
    mtf: 'Yes',
    entryPrice: 145.0,
    actualEntryPrice: 146.5,
    stopLoss: 125.0,
    target: 195.0,
    quantity: 250, // (500000 * 0.01) / 20 = 250
    capitalRequired: 36250,
    actualQuantity: 250,
    exitPrice: 192.0,
    exitDate: '2026-10-04',
    scriptSource: 'HTF Running - I',
    setupQuality: 'A+',
    chartBefore: createSvgChart('NIFTY 25800 CE - Breakout Structure', 'breakout', false),
    chartAfter: createSvgChart('NIFTY 25800 CE - Target Achieved', 'breakout', true),
    status: 'Close',
    pnlRupee: 11375, // (192.0 - 146.5) * 250
    roiRupee: 11375,
    roiPercent: 31.06,
    ruleFollowed: 'Yes',
    emotions: ['Calm', 'Mental Clarity'],
    notes: 'Multi-timeframe demand zone bounce with clean confluence on 15m and 1h.',
    createdAt: 1727827200000,
    updatedAt: 1728000000000
  },
  {
    id: 'tr-02',
    serialNumber: 2,
    tradeDate: '2026-10-05',
    script: 'RELIANCE',
    tradeDirection: 'Long',
    tradeType: 'QIT',
    entryType: 'PA',
    riskPerTrade: '2%',
    mtf: 'Yes',
    entryPrice: 2980.0,
    actualEntryPrice: 2985.0,
    stopLoss: 2930.0,
    target: 3120.0,
    quantity: 200, // (500000 * 0.02) / 50 = 200
    capitalRequired: 596000,
    actualQuantity: 150,
    exitPrice: 3095.0,
    exitDate: '2026-10-10',
    scriptSource: 'HTF Running - I',
    setupQuality: 'A',
    chartBefore: createSvgChart('RELIANCE - Institutional Accumulation', 'bullish', false),
    chartAfter: createSvgChart('RELIANCE - Swing Target Booked', 'bullish', true),
    status: 'Close',
    pnlRupee: 16500, // (3095 - 2985) * 150
    roiRupee: 16500,
    roiPercent: 3.69,
    ruleFollowed: 'Yes',
    emotions: ['Calm', 'Emotion Ready'],
    notes: 'Quarterly trend continuation following earnings announcement and strong volumes.',
    createdAt: 1728086400000,
    updatedAt: 1728518400000
  },
  {
    id: 'tr-03',
    serialNumber: 3,
    tradeDate: '2026-10-08',
    script: 'BANKNIFTY 54000 PE',
    tradeDirection: 'Short',
    tradeType: 'DIT',
    entryType: 'TBS',
    riskPerTrade: '1%',
    mtf: 'No',
    entryPrice: 120.0,
    actualEntryPrice: 120.0,
    stopLoss: 125.0,
    target: 90.0,
    quantity: 1000, // (500000 * 0.01) / 5 = 1000
    capitalRequired: 120000,
    actualQuantity: 1000,
    exitPrice: 90.0,
    exitDate: '2026-10-08',
    scriptSource: 'Other',
    setupQuality: 'C',
    chartBefore: createSvgChart('BANKNIFTY 54000 PE - Rejection scalp', 'bearish', false),
    chartAfter: createSvgChart('BANKNIFTY 54000 PE - Short Target Hit', 'bearish', true),
    status: 'Close',
    pnlRupee: 30000, // Short: (120 - 90) * 1000 = +30,000 profit
    roiRupee: 30000,
    roiPercent: 25.0,
    ruleFollowed: 'Yes',
    emotions: ['Calm'],
    notes: 'Short trade executed at 120, SL 125, Target 90. Full target booked at 90 (+30/unit).',
    createdAt: 1728345600000,
    updatedAt: 1728349200000
  },
  {
    id: 'tr-04',
    serialNumber: 4,
    tradeDate: '2026-10-11',
    script: 'TATASTEEL',
    tradeDirection: 'Long',
    tradeType: 'MIT',
    entryType: 'Direct',
    riskPerTrade: '0.5%',
    mtf: 'Yes',
    entryPrice: 162.0,
    actualEntryPrice: 162.2,
    stopLoss: 157.0,
    target: 175.0,
    quantity: 500, // (500000 * 0.005) / 5 = 500
    capitalRequired: 81000,
    actualQuantity: 500,
    exitPrice: 174.0,
    exitDate: '2026-10-15',
    scriptSource: 'HTF Running - I',
    setupQuality: 'A',
    chartBefore: createSvgChart('TATASTEEL - Base breakout on daily', 'breakout', false),
    chartAfter: createSvgChart('TATASTEEL - Target reached at resistance', 'breakout', true),
    status: 'Close',
    pnlRupee: 5900, // (174.0 - 162.2) * 500
    roiRupee: 5900,
    roiPercent: 7.27,
    ruleFollowed: 'Yes',
    emotions: ['Mental Clarity', 'Calm'],
    notes: 'Clean sector rotation into metal stocks. Trailed SL faithfully.',
    createdAt: 1728604800000,
    updatedAt: 1728950400000
  },
  {
    id: 'tr-05',
    serialNumber: 5,
    tradeDate: '2026-10-13',
    script: 'INFY',
    tradeDirection: 'Short',
    tradeType: 'TBS',
    entryType: 'TBS',
    riskPerTrade: '1%',
    mtf: 'No',
    entryPrice: 1890.0,
    actualEntryPrice: 1890.0,
    stopLoss: 1915.0,
    target: 1840.0,
    quantity: 200, // (500000 * 0.01) / 25 = 200
    capitalRequired: 378000,
    actualQuantity: 150,
    exitPrice: 1920.0,
    exitDate: '2026-10-14',
    scriptSource: 'HTF Running - II',
    setupQuality: 'B',
    chartBefore: createSvgChart('INFY - Time breakdown scalp', 'bearish', false),
    chartAfter: createSvgChart('INFY - Hit SL in morning gap down', 'bearish', true),
    status: 'Close',
    pnlRupee: -4500, // Short: (1890 - 1920) * 150 = -4500 loss
    roiRupee: -4500,
    roiPercent: -1.59,
    ruleFollowed: 'No',
    emotions: ['Mental Stress', 'Frustration'],
    notes: 'Short trade stopped out above swing high. Disciplined exit.',
    createdAt: 1728777600000,
    updatedAt: 1728864000000
  },
  {
    id: 'tr-06',
    serialNumber: 6,
    tradeDate: '2026-10-16',
    script: 'HDFCBANK',
    tradeDirection: 'Long',
    tradeType: 'QT',
    entryType: 'PA',
    riskPerTrade: '1%',
    mtf: 'Yes',
    entryPrice: 1680.0,
    actualEntryPrice: 1681.5,
    stopLoss: 1640.0,
    target: 1790.0,
    quantity: 125, // (500000 * 0.01) / 40 = 125
    capitalRequired: 210000,
    actualQuantity: 125,
    exitPrice: null,
    exitDate: '',
    scriptSource: 'HTF Running - I',
    setupQuality: 'A+',
    chartBefore: createSvgChart('HDFCBANK - Weekly Demand Zone Test', 'bullish', false),
    chartAfter: '',
    status: 'Active',
    pnlRupee: 0,
    roiRupee: 0,
    roiPercent: 0,
    ruleFollowed: 'Yes',
    emotions: ['Emotion Ready', 'Calm'],
    notes: 'Positional quarterly swing trade. Stop Loss placed below weekly swing low at 1640.',
    createdAt: 1729036800000,
    updatedAt: 1729036800000
  },
  {
    id: 'tr-07',
    serialNumber: 7,
    tradeDate: '2026-10-18',
    script: 'LT',
    tradeDirection: 'Long',
    tradeType: 'WIT',
    entryType: 'Direct',
    riskPerTrade: '0.5%',
    mtf: 'Yes',
    entryPrice: 3620.0,
    actualEntryPrice: 3620.0,
    stopLoss: 3570.0,
    target: 3750.0,
    quantity: 50, // (500000 * 0.005) / 50 = 50
    capitalRequired: 181000,
    actualQuantity: 50,
    exitPrice: null,
    exitDate: '',
    scriptSource: 'HTF Running - I',
    setupQuality: 'A',
    chartBefore: createSvgChart('LT - Order Flow Breakout', 'breakout', false),
    chartAfter: '',
    status: 'Active',
    pnlRupee: 0,
    roiRupee: 0,
    roiPercent: 0,
    ruleFollowed: 'Yes',
    emotions: ['Mental Clarity'],
    notes: 'Capital required 1,81,000 currently active and locking risk at 0.5%.',
    createdAt: 1729209600000,
    updatedAt: 1729209600000
  },
  {
    id: 'tr-08',
    serialNumber: 8,
    tradeDate: '2026-10-20',
    script: 'NIFTY 26000 PE',
    tradeDirection: 'Short',
    tradeType: 'DIT',
    entryType: 'PA',
    riskPerTrade: '0.5%',
    mtf: 'Yes',
    entryPrice: 110.0,
    actualEntryPrice: 0, // Pending: No actual entry price yet!
    stopLoss: 125.0,
    target: 70.0,
    quantity: 166, // (500000 * 0.005) / 15 = 166
    capitalRequired: 18260,
    actualQuantity: 0,
    exitPrice: null,
    exitDate: '',
    scriptSource: 'HTF Running - II',
    setupQuality: 'B',
    chartBefore: createSvgChart('NIFTY 26000 PE - Retest Setup', 'reversal', false),
    chartAfter: '',
    status: 'Pending',
    pnlRupee: 0,
    roiRupee: 0,
    roiPercent: 0,
    ruleFollowed: 'Yes',
    emotions: ['Calm'],
    notes: 'Limit sell order placed at 110. Status is Pending so Actual Entry Price is not yet executed.',
    createdAt: 1729382400000,
    updatedAt: 1729382400000
  }
];
