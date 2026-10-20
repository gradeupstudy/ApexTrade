import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Calculator, 
  Check, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  Trade, 
  TradeType, 
  RiskPercent, 
  SetupQuality, 
  TradeStatus, 
  YesNo, 
  EmotionType 
} from '../types/trade';
import { DatePickerSelector } from './DatePickerSelector';
import { 
  calculatePlannedQuantity, 
  calculateCapitalRequired, 
  calculatePnL, 
  calculateROIPercent,
  formatINR 
} from '../utils/calculations';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  tradeToEdit?: Trade | null;
  totalCapital: number;
  nextSerialNumber: number;
}

const ALL_TRADE_TYPES: TradeType[] = ['QIT', 'MIT', 'WIT', 'DIT', 'QT', 'TBS'];
const ALL_RISK_PERCENTS: RiskPercent[] = ['0.5%', '1%', '2%', '3%'];
const ALL_SETUP_QUALITIES: SetupQuality[] = ['A+', 'A', 'B', 'C'];
const ALL_STATUSES: TradeStatus[] = ['Pending', 'Active', 'Close'];
const ALL_EMOTIONS: EmotionType[] = [
  'Fomo',
  'Greed',
  'Mental Stress',
  'Mental Clarity',
  'Frustration',
  'Calm',
  'Emotion Ready'
];

const COMMON_SCRIPTS = [
  'NIFTY 25800 CE', 
  'BANKNIFTY 54000 PE', 
  'RELIANCE', 
  'TATASTEEL', 
  'INFY', 
  'HDFCBANK', 
  'LT',
  'TCS'
];

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tradeToEdit,
  totalCapital,
  nextSerialNumber
}) => {
  // Form states
  const [formError, setFormError] = useState<string | null>(null);
  const [serialNumber, setSerialNumber] = useState<number>(
    tradeToEdit ? tradeToEdit.serialNumber : nextSerialNumber
  );
  const [tradeDate, setTradeDate] = useState<string>(
    tradeToEdit ? tradeToEdit.tradeDate : new Date().toISOString().split('T')[0]
  );
  const [script, setScript] = useState<string>(tradeToEdit ? tradeToEdit.script : '');
  const [tradeType, setTradeType] = useState<TradeType>(tradeToEdit ? tradeToEdit.tradeType : 'DIT');
  const [riskPerTrade, setRiskPerTrade] = useState<RiskPercent>(tradeToEdit ? tradeToEdit.riskPerTrade : '1%');
  const [mtf, setMtf] = useState<YesNo>(tradeToEdit ? tradeToEdit.mtf : 'Yes');
  
  const [entryPrice, setEntryPrice] = useState<string>(
    tradeToEdit ? tradeToEdit.entryPrice.toString() : ''
  );
  const [actualEntryPrice, setActualEntryPrice] = useState<string>(
    tradeToEdit ? tradeToEdit.actualEntryPrice.toString() : ''
  );
  const [stopLoss, setStopLoss] = useState<string>(
    tradeToEdit ? tradeToEdit.stopLoss.toString() : ''
  );
  const [target, setTarget] = useState<string>(
    tradeToEdit ? tradeToEdit.target.toString() : ''
  );

  const [actualQuantity, setActualQuantity] = useState<string>(
    tradeToEdit ? tradeToEdit.actualQuantity.toString() : ''
  );

  const [exitPrice, setExitPrice] = useState<string>(
    tradeToEdit && tradeToEdit.exitPrice !== null ? tradeToEdit.exitPrice.toString() : ''
  );
  const [exitDate, setExitDate] = useState<string>(
    tradeToEdit ? tradeToEdit.exitDate : ''
  );

  const [setupQuality, setSetupQuality] = useState<SetupQuality>(
    tradeToEdit ? tradeToEdit.setupQuality : 'A'
  );
  const [status, setStatus] = useState<TradeStatus>(
    tradeToEdit ? tradeToEdit.status : 'Pending'
  );
  const [ruleFollowed, setRuleFollowed] = useState<YesNo>(
    tradeToEdit ? tradeToEdit.ruleFollowed : 'Yes'
  );
  const [emotions, setEmotions] = useState<EmotionType[]>(
    tradeToEdit ? tradeToEdit.emotions : ['Calm']
  );
  const [notes, setNotes] = useState<string>(tradeToEdit ? tradeToEdit.notes || '' : '');

  // Charts
  const [chartBefore, setChartBefore] = useState<string>(tradeToEdit ? tradeToEdit.chartBefore : '');
  const [chartAfter, setChartAfter] = useState<string>(tradeToEdit ? tradeToEdit.chartAfter : '');

  // Real-time calculated values
  const numEntry = parseFloat(entryPrice) || 0;
  const numStopLoss = parseFloat(stopLoss) || 0;
  const numActualEntry = parseFloat(actualEntryPrice) || numEntry;
  const numExit = exitPrice !== '' ? parseFloat(exitPrice) : null;

  // Auto-calculated Quantity based on Risk % & Total Capital
  const calculatedQuantity = calculatePlannedQuantity(
    totalCapital,
    riskPerTrade,
    numEntry,
    numStopLoss
  );

  // Auto-calculated Capital Required = Quantity * Entry Price
  const calculatedCapitalRequired = calculateCapitalRequired(calculatedQuantity, numEntry);

  // Actual quantity used for PnL
  const effectiveActualQty = parseFloat(actualQuantity) || calculatedQuantity || 1;

  // Live PnL in Rupee
  const livePnL = calculatePnL(numExit, numActualEntry, effectiveActualQty);
  const liveROI = calculateROIPercent(numExit, numActualEntry);

  // Auto-fill actual entry price and actual qty if empty when typing entry price
  useEffect(() => {
    if (!tradeToEdit && actualEntryPrice === '' && entryPrice !== '') {
      setActualEntryPrice(entryPrice);
    }
  }, [entryPrice]);

  useEffect(() => {
    if (!tradeToEdit && actualQuantity === '' && calculatedQuantity > 0) {
      setActualQuantity(calculatedQuantity.toString());
    }
  }, [calculatedQuantity]);

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isBefore: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (isBefore) setChartBefore(result);
        else setChartAfter(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent, isBefore: boolean) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (isBefore) setChartBefore(result);
            else setChartAfter(result);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const toggleEmotion = (emotion: EmotionType) => {
    if (emotions.includes(emotion)) {
      setEmotions(emotions.filter(e => e !== emotion));
    } else {
      setEmotions([...emotions, emotion]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!script.trim()) {
      setFormError('Please enter a Script / Symbol name.');
      return;
    }
    if (numEntry <= 0) {
      setFormError('Please enter a valid Entry Price greater than 0.');
      return;
    }
    if (numStopLoss <= 0) {
      setFormError('Please enter a valid Stop Loss greater than 0.');
      return;
    }
    setFormError(null);

    const trade: Trade = {
      id: tradeToEdit ? tradeToEdit.id : `trade-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      serialNumber: serialNumber || nextSerialNumber,
      tradeDate,
      script: script.trim().toUpperCase(),
      tradeType,
      riskPerTrade,
      mtf,
      entryPrice: numEntry,
      actualEntryPrice: numActualEntry,
      stopLoss: numStopLoss,
      target: parseFloat(target) || 0,
      quantity: calculatedQuantity,
      capitalRequired: calculatedCapitalRequired,
      actualQuantity: effectiveActualQty,
      exitPrice: numExit,
      exitDate: exitDate || (status === 'Close' ? tradeDate : ''),
      setupQuality,
      chartBefore,
      chartAfter,
      status,
      pnlRupee: status === 'Close' ? livePnL : 0,
      roiRupee: status === 'Close' ? livePnL : 0,
      roiPercent: status === 'Close' ? liveROI : 0,
      ruleFollowed,
      emotions: emotions.length > 0 ? emotions : ['Calm'],
      notes,
      createdAt: tradeToEdit ? tradeToEdit.createdAt : Date.now(),
      updatedAt: Date.now()
    };

    onSave(trade);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-slate-200 my-auto">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#0f172a] border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {tradeToEdit ? `Edit Trade Entry #${tradeToEdit.serialNumber}` : 'Log New Institutional Trade'}
              </h2>
              <p className="text-xs text-slate-400">
                Quantity and Capital Required are auto-calculated from your Risk % & Total Capital ({formatINR(totalCapital)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-rose-400 hover:text-white text-xs px-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Core Trade Metadata */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono block mb-3">
              01. Setup & Identification
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Serial Number */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Serial Number
                </label>
                <input
                  type="number"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-mono focus:outline-hidden focus:border-slate-600"
                  required
                />
              </div>

              {/* Trade Analysis Date with Choose Option (Date, Month, Year) */}
              <div className="sm:col-span-2">
                <DatePickerSelector
                  label="Trade Analysis Date (Choose Day, Month, Year)"
                  value={tradeDate}
                  onChange={setTradeDate}
                  required
                />
              </div>

              {/* Script / Symbol */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Script / Symbol (Fill by me)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NIFTY 25800 CE, RELIANCE"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-medium focus:outline-hidden focus:border-emerald-500"
                  required
                />
                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {COMMON_SCRIPTS.slice(0, 3).map(sc => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setScript(sc)}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Strategy, Risk & MTF */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono block mb-3">
              02. Strategy, Risk Sizing & Confluence
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Trade Type */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trade Type
                </label>
                <select
                  value={tradeType}
                  onChange={(e) => setTradeType(e.target.value as TradeType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white focus:outline-hidden focus:border-slate-600"
                >
                  {ALL_TRADE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  QIT, MIT, WIT, DIT, QT, TBS
                </span>
              </div>

              {/* Risk per Trade */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Risk per Trade
                </label>
                <select
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(e.target.value as RiskPercent)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-mono focus:outline-hidden focus:border-slate-600"
                >
                  {ALL_RISK_PERCENTS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Amount: {formatINR(totalCapital * (parseFloat(riskPerTrade) / 100))}
                </span>
              </div>

              {/* MTF (Multi-Time Frame) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  MTF (Multi-Timeframe)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMtf('Yes')}
                    className={`py-2 text-xs font-semibold rounded-md border transition-colors ${
                      mtf === 'Yes'
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setMtf('No')}
                    className={`py-2 text-xs font-semibold rounded-md border transition-colors ${
                      mtf === 'No'
                        ? 'bg-rose-950/50 text-rose-300 border-rose-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Setup Quality */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Setup Quality
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {ALL_SETUP_QUALITIES.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSetupQuality(q)}
                      className={`py-2 text-xs font-bold rounded border transition-colors ${
                        setupQuality === q
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Pricing, Sizing & Auto-Calculated Values */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono block mb-3">
              03. Execution Pricing & Position Sizing
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Entry Price */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Entry Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 145.00"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-mono focus:outline-hidden focus:border-slate-600"
                  required
                />
              </div>

              {/* Actual Entry Price */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Actual Entry Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 146.50"
                  value={actualEntryPrice}
                  onChange={(e) => setActualEntryPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-mono focus:outline-hidden focus:border-slate-600"
                  required
                />
              </div>

              {/* Stop Loss */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Stop Loss (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 125.00"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-mono focus:outline-hidden focus:border-slate-600"
                  required
                />
              </div>

              {/* Target */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 195.00"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-mono focus:outline-hidden focus:border-slate-600"
                  required
                />
              </div>

            </div>

            {/* Auto-Calculated Output Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 mt-3 rounded-lg bg-slate-900/90 border border-slate-800">
              
              {/* Calculated Quantity */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Calculated Quantity (Formula)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Risk% / |Entry-SL|</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {calculatedQuantity} units
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Risk Amount {formatINR(totalCapital * (parseFloat(riskPerTrade) / 100))} ÷ ₹{Math.abs(numEntry - numStopLoss).toFixed(2)}
                </p>
              </div>

              {/* Capital Required */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Capital Required</span>
                  <span className="text-[10px] text-sky-400 font-mono">Qty × Entry</span>
                </div>
                <div className="text-lg font-bold font-mono text-sky-400 tabular-nums">
                  {formatINR(calculatedCapitalRequired)}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Locked margin while trade is Active
                </p>
              </div>

              {/* Actual Quantity Field */}
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">
                  Actual Quantity Filled (by me)
                </label>
                <input
                  type="number"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(e.target.value)}
                  placeholder={calculatedQuantity.toString()}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

            </div>
          </div>

          {/* Section 4: Exit & Outcome (For Active/Closed Trades) */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono block mb-3">
              04. Exit Execution & Performance Outcome
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Trade Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TradeStatus)}
                  className={`w-full px-3 py-2 border rounded-md text-xs font-semibold focus:outline-hidden ${
                    status === 'Close'
                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                      : status === 'Active'
                      ? 'bg-sky-950/40 text-sky-300 border-sky-500/40'
                      : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Exit Price */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Exit Price (₹) (Fill by me)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 192.00"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-mono focus:outline-hidden focus:border-slate-600"
                />
              </div>

              {/* Exit Date */}
              <div className="sm:col-span-1">
                <DatePickerSelector
                  label="Exit Date (Choose D/M/Y)"
                  value={exitDate}
                  onChange={setExitDate}
                />
              </div>

              {/* Rule Followed */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Rule Followed
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRuleFollowed('Yes')}
                    className={`py-2 text-xs font-semibold rounded-md border transition-colors ${
                      ruleFollowed === 'Yes'
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleFollowed('No')}
                    className={`py-2 text-xs font-semibold rounded-md border transition-colors ${
                      ruleFollowed === 'No'
                        ? 'bg-rose-950/50 text-rose-300 border-rose-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

            </div>

            {/* Calculated Profit / Loss & ROI Highlight */}
            {numExit !== null && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 mt-3 rounded-lg bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Profit/Loss (in Rupee) · (Exit - Actual Entry) × Qty
                  </span>
                  <div className={`text-xl font-bold font-mono tabular-nums ${
                    livePnL > 0 ? 'text-emerald-400' : livePnL < 0 ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    {livePnL > 0 ? '+' : ''}{formatINR(livePnL)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Calculated in Rupee as requested (Green for Profit, Red for Loss)
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Return on Investment (ROI)
                  </span>
                  <div className={`text-xl font-bold font-mono tabular-nums ${
                    liveROI > 0 ? 'text-emerald-400' : liveROI < 0 ? 'text-rose-400' : 'text-slate-200'
                  }`}>
                    {liveROI > 0 ? '+' : ''}{liveROI.toFixed(2)}%
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Net Percentage Return over entry price
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Emotional Analysis (Multi-select) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                05. Psychology & Emotions (Select one or more)
              </span>
              <span className="text-xs text-slate-400">
                Selected: {emotions.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ALL_EMOTIONS.map(emotion => {
                const isSelected = emotions.includes(emotion);
                const isNegative = ['Fomo', 'Greed', 'Mental Stress', 'Frustration'].includes(emotion);

                return (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    className={`py-2 px-2 text-xs font-medium rounded-md border text-center transition-all ${
                      isSelected
                        ? isNegative
                          ? 'bg-rose-950/60 text-rose-300 border-rose-500/50 shadow-xs'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{emotion}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Chart Before & Chart After Trade Screenshot Upload */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono block mb-3">
              06. Chart Screenshots (Pre-Analysis & Post-Trade)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Chart Before Trade */}
              <div 
                onPaste={(e) => handlePaste(e, true)}
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 relative group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                    Chart Before Trade (Pre-Analysis)
                  </span>
                  {chartBefore && (
                    <button
                      type="button"
                      onClick={() => setChartBefore('')}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {chartBefore ? (
                  <div className="h-40 rounded bg-slate-900 overflow-hidden relative border border-slate-800">
                    <img 
                      src={chartBefore} 
                      alt="Chart Before Trade" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-800 hover:border-slate-600 rounded-lg cursor-pointer bg-slate-900/30 hover:bg-slate-900/50 transition-colors p-4 text-center">
                    <Upload className="w-6 h-6 text-slate-500 mb-2" />
                    <span className="text-xs font-medium text-slate-300">Click to upload image format (PNG, JPG, WEBP)</span>
                    <span className="text-[10px] text-slate-500 mt-1">or paste from clipboard (Ctrl+V)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Chart After Trade */}
              <div 
                onPaste={(e) => handlePaste(e, false)}
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 relative group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    Chart After Trade (Post-Trade Execution)
                  </span>
                  {chartAfter && (
                    <button
                      type="button"
                      onClick={() => setChartAfter('')}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {chartAfter ? (
                  <div className="h-40 rounded bg-slate-900 overflow-hidden relative border border-slate-800">
                    <img 
                      src={chartAfter} 
                      alt="Chart After Trade" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-800 hover:border-slate-600 rounded-lg cursor-pointer bg-slate-900/30 hover:bg-slate-900/50 transition-colors p-4 text-center">
                    <Upload className="w-6 h-6 text-slate-500 mb-2" />
                    <span className="text-xs font-medium text-slate-300">Click to upload image format (PNG, JPG, WEBP)</span>
                    <span className="text-[10px] text-slate-500 mt-1">or paste from clipboard (Ctrl+V)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

            </div>
          </div>

          {/* Section 7: Notes & Learnings */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Trade Learnings & Setup Rationale
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key observations, order flow confluence, reason for exit or execution mistakes..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-slate-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg shadow-sm transition-all"
            >
              {tradeToEdit ? 'Save Changes' : 'Record Trade'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
