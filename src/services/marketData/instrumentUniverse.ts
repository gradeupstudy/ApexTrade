import { InstrumentItem } from './types';

export const INSTRUMENT_UNIVERSE: InstrumentItem[] = [
  // Indices
  {
    symbol: 'NSE:NIFTY50-INDEX',
    displayName: 'NIFTY 50',
    companyName: 'Nifty 50 Benchmark Index',
    exchange: 'NSE',
    segment: 'INDEX',
    lotSize: 25,
    tickSize: 0.05,
    sector: 'Broad Market Index',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'NSE:NIFTYBANK-INDEX',
    displayName: 'BANKNIFTY',
    companyName: 'Nifty Bank Banking Index',
    exchange: 'NSE',
    segment: 'INDEX',
    lotSize: 15,
    tickSize: 0.05,
    sector: 'Banking & Financials',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'BSE:SENSEX-INDEX',
    displayName: 'SENSEX',
    companyName: 'BSE Sensex 30 Index',
    exchange: 'BSE',
    segment: 'INDEX',
    lotSize: 10,
    tickSize: 0.05,
    sector: 'Broad Market Index',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },

  // Large Cap Equities - Western Hub (Mumbai / Gujarat / Maharashtra)
  {
    symbol: 'NSE:RELIANCE-EQ',
    displayName: 'RELIANCE',
    companyName: 'Reliance Industries Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Energy & Petrochemicals',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'NSE:HDFCBANK-EQ',
    displayName: 'HDFCBANK',
    companyName: 'HDFC Bank Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Banking & Financials',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'NSE:TCS-EQ',
    displayName: 'TCS',
    companyName: 'Tata Consultancy Services Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Information Technology',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'NSE:LT-EQ',
    displayName: 'LT',
    companyName: 'Larsen & Toubro Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Infrastructure & Capital Goods',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'NSE:SBIN-EQ',
    displayName: 'SBIN',
    companyName: 'State Bank of India',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Banking & Financials',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'NSE:ADANIENT-EQ',
    displayName: 'ADANIENT',
    companyName: 'Adani Enterprises Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Conglomerate & Mining',
    headquarters: {
      city: 'Ahmedabad',
      state: 'Gujarat',
      zone: 'Western Hub'
    }
  },

  // Southern Hub (Karnataka / Tamil Nadu / Telangana / Andhra)
  {
    symbol: 'NSE:INFY-EQ',
    displayName: 'INFY',
    companyName: 'Infosys Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Information Technology',
    headquarters: {
      city: 'Bengaluru',
      state: 'Karnataka',
      zone: 'Southern Hub'
    }
  },
  {
    symbol: 'NSE:WIPRO-EQ',
    displayName: 'WIPRO',
    companyName: 'Wipro Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Information Technology',
    headquarters: {
      city: 'Bengaluru',
      state: 'Karnataka',
      zone: 'Southern Hub'
    }
  },
  {
    symbol: 'NSE:TITAN-EQ',
    displayName: 'TITAN',
    companyName: 'Titan Company Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Consumer Discretionary & Jewellery',
    headquarters: {
      city: 'Bengaluru',
      state: 'Karnataka',
      zone: 'Southern Hub'
    }
  },
  {
    symbol: 'NSE:DRREDDY-EQ',
    displayName: 'DRREDDY',
    companyName: "Dr. Reddy's Laboratories Ltd",
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Pharmaceuticals & Healthcare',
    headquarters: {
      city: 'Hyderabad',
      state: 'Telangana',
      zone: 'Southern Hub'
    }
  },

  // Eastern Hub (West Bengal / Odisha / Jharkhand)
  {
    symbol: 'NSE:TATASTEEL-EQ',
    displayName: 'TATASTEEL',
    companyName: 'Tata Steel Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Metals & Mining',
    headquarters: {
      city: 'Kolkata',
      state: 'West Bengal',
      zone: 'Eastern Hub'
    }
  },
  {
    symbol: 'NSE:ITC-EQ',
    displayName: 'ITC',
    companyName: 'ITC Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'FMCG & Conglomerate',
    headquarters: {
      city: 'Kolkata',
      state: 'West Bengal',
      zone: 'Eastern Hub'
    }
  },
  {
    symbol: 'NSE:COALINDIA-EQ',
    displayName: 'COALINDIA',
    companyName: 'Coal India Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Metals & Mining',
    headquarters: {
      city: 'Kolkata',
      state: 'West Bengal',
      zone: 'Eastern Hub'
    }
  },

  // Northern Hub (Delhi NCR / Haryana / Punjab)
  {
    symbol: 'NSE:MARUTI-EQ',
    displayName: 'MARUTI',
    companyName: 'Maruti Suzuki India Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Automobile & Transport',
    headquarters: {
      city: 'New Delhi',
      state: 'Delhi NCR',
      zone: 'Northern Hub'
    }
  },
  {
    symbol: 'NSE:BHARTIARTL-EQ',
    displayName: 'BHARTIARTL',
    companyName: 'Bharti Airtel Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Telecommunications',
    headquarters: {
      city: 'New Delhi',
      state: 'Delhi NCR',
      zone: 'Northern Hub'
    }
  },
  {
    symbol: 'NSE:HCLTECH-EQ',
    displayName: 'HCLTECH',
    companyName: 'HCL Technologies Ltd',
    exchange: 'NSE',
    segment: 'EQUITY',
    lotSize: 1,
    tickSize: 0.05,
    sector: 'Information Technology',
    headquarters: {
      city: 'Noida',
      state: 'Delhi NCR',
      zone: 'Northern Hub'
    }
  },

  // Options & Derivatives
  {
    symbol: 'NSE:NIFTY26OCT25800CE',
    displayName: 'NIFTY 25800 CE',
    companyName: 'Nifty Options 25800 Call Option',
    exchange: 'NSE',
    segment: 'OPTIONS',
    lotSize: 25,
    tickSize: 0.05,
    expiryDate: '2026-10-29',
    strikePrice: 25800,
    optionType: 'CE',
    sector: 'Derivatives / Options',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'NSE:BANKNIFTY26OCT54000PE',
    displayName: 'BANKNIFTY 54000 PE',
    companyName: 'Bank Nifty Options 54000 Put Option',
    exchange: 'NSE',
    segment: 'OPTIONS',
    lotSize: 15,
    tickSize: 0.05,
    expiryDate: '2026-10-29',
    strikePrice: 54000,
    optionType: 'PE',
    sector: 'Derivatives / Options',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  },
  {
    symbol: 'NSE:NIFTY26OCT26000PE',
    displayName: 'NIFTY 26000 PE',
    companyName: 'Nifty Options 26000 Put Option',
    exchange: 'NSE',
    segment: 'OPTIONS',
    lotSize: 25,
    tickSize: 0.05,
    expiryDate: '2026-10-29',
    strikePrice: 26000,
    optionType: 'PE',
    sector: 'Derivatives / Options',
    headquarters: {
      city: 'Mumbai',
      state: 'Maharashtra',
      zone: 'Western Hub'
    }
  }
];

export function findInstrument(queryOrSymbol: string): InstrumentItem | undefined {
  if (!queryOrSymbol) return undefined;
  const clean = queryOrSymbol.trim().toUpperCase();
  return INSTRUMENT_UNIVERSE.find(inst => 
    inst.symbol === clean ||
    inst.displayName === clean ||
    clean.includes(inst.displayName) ||
    inst.displayName.includes(clean)
  );
}

export function searchUniverse(term: string): InstrumentItem[] {
  if (!term.trim()) return INSTRUMENT_UNIVERSE.slice(0, 8);
  const q = term.toLowerCase().trim();
  return INSTRUMENT_UNIVERSE.filter(item =>
    item.symbol.toLowerCase().includes(q) ||
    item.displayName.toLowerCase().includes(q) ||
    item.companyName.toLowerCase().includes(q) ||
    item.sector.toLowerCase().includes(q)
  );
}
