import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Maximize2, 
  Edit, 
  Trash2, 
  Copy, 
  Plus, 
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  Camera,
  Layers,
  Sparkles,
  BarChart2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { 
  Trade, 
  TradeType, 
  TradeDirection,
  ScriptSource,
  EntryType,
  TradeStatus, 
  SetupQuality, 
  EmotionType, 
  YesNo 
} from '../types/trade';
import { formatINR } from '../utils/calculations';

interface TradeTableProps {
  trades: Trade[];
  onOpenTradeModal: (trade?: Trade) => void;
  onOpenChartModal: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  onDeleteMultipleTrades?: (ids: string[]) => void;
  onDuplicateTrade: (trade: Trade) => void;
  onUpdateStatus: (id: string, status: TradeStatus) => void;
  onExportCSV: () => void;
  onLoadSampleTrades: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const TradeTable: React.FC<TradeTableProps> = ({
  trades,
  onOpenTradeModal,
  onOpenChartModal,
  onDeleteTrade,
  onDeleteMultipleTrades,
  onDuplicateTrade,
  onUpdateStatus,
  onExportCSV,
  onLoadSampleTrades
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [entryTypeFilter, setEntryTypeFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [ruleFilter, setRuleFilter] = useState<string>('ALL');
  const [emotionFilter, setEmotionFilter] = useState<string>('ALL');
  
  // Date, Month, Year Filters
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');

  // Multi-selection for batch delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [sortField, setSortField] = useState<keyof Trade>('serialNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Trade) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTrades.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrades.map(t => t.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setShowBatchDeleteModal(true);
  };

  const confirmBatchDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (onDeleteMultipleTrades) {
      onDeleteMultipleTrades(selectedIds);
    } else {
      selectedIds.forEach(id => onDeleteTrade(id));
    }
    setSelectedIds([]);
    setShowBatchDeleteModal(false);
    setToastMessage(`Deleted ${count} selected trade(s) successfully.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const confirmSingleDelete = () => {
    if (tradeToDelete) {
      const scriptLabel = `#${tradeToDelete.serialNumber} (${tradeToDelete.script})`;
      onDeleteTrade(tradeToDelete.id);
      setSelectedIds(prev => prev.filter(id => id !== tradeToDelete.id));
      setTradeToDelete(null);
      setToastMessage(`Deleted trade ${scriptLabel} successfully.`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      // Search
      const matchesSearch = 
        t.script.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.serialNumber.toString().includes(searchTerm) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Direction
      if (directionFilter !== 'ALL' && (t.tradeDirection || 'Long') !== directionFilter) return false;

      // Status
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

      // Trade Type
      if (typeFilter !== 'ALL' && t.tradeType !== typeFilter) return false;

      // Entry Type
      if (entryTypeFilter !== 'ALL' && (t.entryType || 'Direct') !== entryTypeFilter) return false;

      // Script Source (with fallback to setupQuality)
      if (sourceFilter !== 'ALL') {
        const itemSource = t.scriptSource || (
          t.setupQuality === 'A+' || t.setupQuality === 'A' ? 'HTF Running - I' :
          t.setupQuality === 'B' ? 'HTF Running - II' : 'Other'
        );
        if (itemSource !== sourceFilter) return false;
      }

      // Rule
      if (ruleFilter !== 'ALL' && t.ruleFollowed !== ruleFilter) return false;

      // Emotion
      if (emotionFilter !== 'ALL' && !t.emotions?.includes(emotionFilter as EmotionType)) return false;

      // Month & Year Filter
      if (t.tradeDate) {
        const d = new Date(t.tradeDate);
        if (monthFilter !== 'ALL' && (d.getMonth() + 1).toString() !== monthFilter) return false;
        if (yearFilter !== 'ALL' && d.getFullYear().toString() !== yearFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [trades, searchTerm, directionFilter, statusFilter, typeFilter, entryTypeFilter, sourceFilter, ruleFilter, emotionFilter, monthFilter, yearFilter, sortField, sortDirection]);

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-xs">
      
      {/* Header and Controls Bar */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-100">Trade Execution Ledger</h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {filteredTrades.length} of {trades.length} entries
            </span>

            {/* Batch Delete Button when rows are checked */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBatchDeleteClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 border border-rose-400/50 rounded-lg transition-colors shadow-md cursor-pointer animate-pulse"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {trades.length === 0 && (
              <button
                onClick={onLoadSampleTrades}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Trades</span>
              </button>
            )}

            <button
              onClick={() => onOpenTradeModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Trade</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar with Date, Month, Year options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-2 border-t border-slate-800/80">
          
          {/* Search */}
          <div className="relative col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search script, serial #, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-slate-600"
            />
          </div>

          {/* Month Selector Filter */}
          <div>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-slate-600"
            >
              <option value="ALL">Month: All</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={(idx + 1).toString()}>{m.slice(0, 3)}</option>
              ))}
            </select>
          </div>

          {/* Year Selector Filter */}
          <div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-slate-600"
            >
              <option value="ALL">Year: All</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Direction Filter */}
          <div>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-slate-600"
            >
              <option value="ALL">Direction: All</option>
              <option value="Long">Long (Buy)</option>
              <option value="Short">Short (Sell)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-slate-600"
            >
              <option value="ALL">Status: All</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Close">Close</option>
            </select>
          </div>

          {/* Trade Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-slate-600"
            >
              <option value="ALL">Type: All</option>
              <option value="QIT">QIT</option>
              <option value="MIT">MIT</option>
              <option value="WIT">WIT</option>
              <option value="DIT">DIT</option>
              <option value="QT">QT</option>
              <option value="TBS">TBS</option>
            </select>
          </div>

          {/* Entry Type Filter */}
          <div>
            <select
              value={entryTypeFilter}
              onChange={(e) => setEntryTypeFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-slate-600"
            >
              <option value="ALL">Entry: All</option>
              <option value="Direct">Direct</option>
              <option value="TBS">TBS</option>
              <option value="PA">PA</option>
            </select>
          </div>

          {/* Script Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-slate-600"
            >
              <option value="ALL">Source: All</option>
              <option value="HTF Running - I">HTF Running - I</option>
              <option value="HTF Running - II">HTF Running - II</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Rule Followed Filter */}
          <div>
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-hidden focus:border-slate-600"
            >
              <option value="ALL">Rule: All</option>
              <option value="Yes">Rule: Yes</option>
              <option value="No">Rule: No</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#0b0f19] text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px] tracking-wider select-none">
            <tr>
              <th className="py-2.5 px-2.5 text-center w-8">
                <input
                  type="checkbox"
                  checked={filteredTrades.length > 0 && selectedIds.length === filteredTrades.length}
                  onChange={handleToggleSelectAll}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('serialNumber')}>
                <div className="flex items-center gap-1">
                  <span>#</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('tradeDate')}>
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('script')}>
                <div className="flex items-center gap-1">
                  <span>Script</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('tradeDirection')}>
                <div className="flex items-center gap-1">
                  <span>Dir</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('tradeType')}>
                <div className="flex items-center gap-1">
                  <span>Type</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('entryType')}>
                <div className="flex items-center gap-1">
                  <span>Entry</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="py-2.5 px-3">Risk %</th>
              <th className="py-2.5 px-3">MTF</th>
              <th className="py-2.5 px-3 text-right">Plan Entry</th>
              <th className="py-2.5 px-3 text-right">Act. Entry</th>
              <th className="py-2.5 px-3 text-right">Stop Loss</th>
              <th className="py-2.5 px-3 text-right">Target</th>
              <th className="py-2.5 px-3 text-right">Calc Qty</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('capitalRequired')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Cap Req</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Act. Qty</th>
              <th className="py-2.5 px-3 text-right">Exit Price</th>
              <th className="py-2.5 px-3">Exit Date</th>
              <th className="py-2.5 px-3 text-center">Script Source</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort('pnlRupee')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Profit/Loss (₹)</span>
                  <ArrowUpDown className="w-2.5 h-2.5" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">ROI %</th>
              <th className="py-2.5 px-3 text-center">Rule</th>
              <th className="py-2.5 px-3">Emotions</th>
              <th className="py-2.5 px-3 text-center">TradingView Chart</th>
              <th className="py-2.5 px-3 text-right">Delete & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={26} className="text-center py-12 text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-sans text-slate-400">No trades match your filter criteria.</p>
                    <button
                      onClick={() => onOpenTradeModal()}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-sans font-medium"
                    >
                      + Log a new trade to get started
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrades.map(trade => {
                const isClosed = trade.status === 'Close';
                const isPositive = trade.pnlRupee > 0;
                const isNegative = trade.pnlRupee < 0;
                const isSelected = selectedIds.includes(trade.id);
                const isShort = trade.tradeDirection === 'Short';
                const source = trade.scriptSource || (
                  trade.setupQuality === 'A+' || trade.setupQuality === 'A' ? 'HTF Running - I' :
                  trade.setupQuality === 'B' ? 'HTF Running - II' : 'Other'
                );

                return (
                  <tr key={trade.id} className={`transition-colors ${isSelected ? 'bg-emerald-950/20' : 'hover:bg-slate-900/50'}`}>
                    
                    {/* Checkbox for batch actions */}
                    <td className="py-2 px-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(trade.id)}
                        className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Serial Number */}
                    <td className="py-2 px-3 text-slate-400 font-bold tabular-nums">
                      #{trade.serialNumber}
                    </td>

                    {/* Trade Analysis Date */}
                    <td className="py-2 px-3 text-slate-300">
                      {trade.tradeDate}
                    </td>

                    {/* Script */}
                    <td className="py-2 px-3 font-semibold text-slate-100 font-sans">
                      {trade.script}
                    </td>

                    {/* Trade Direction (Long / Short) */}
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        isShort 
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30' 
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isShort ? 'SHORT' : 'LONG'}
                      </span>
                    </td>

                    {/* Trade Type */}
                    <td className="py-2 px-3">
                      <span className="font-bold text-slate-200">{trade.tradeType}</span>
                    </td>

                    {/* Entry Type */}
                    <td className="py-2 px-3">
                      <span className="text-sky-300 font-mono text-[11px] bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-500/20">
                        {trade.entryType || 'Direct'}
                      </span>
                    </td>

                    {/* Risk Per Trade */}
                    <td className="py-2 px-3 text-slate-400">
                      {trade.riskPerTrade}
                    </td>

                    {/* MTF */}
                    <td className="py-2 px-3">
                      <span className={trade.mtf === 'Yes' ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                        {trade.mtf}
                      </span>
                    </td>

                    {/* Plan Entry Price */}
                    <td className="py-2 px-3 text-right text-slate-300 tabular-nums">
                      ₹{trade.entryPrice.toFixed(2)}
                    </td>

                    {/* Actual Entry Price (Shows 'Pending' badge if empty or 0) */}
                    <td className="py-2 px-3 text-right text-slate-200 font-medium tabular-nums">
                      {trade.actualEntryPrice && trade.actualEntryPrice > 0 ? (
                        `₹${trade.actualEntryPrice.toFixed(2)}`
                      ) : trade.status === 'Pending' ? (
                        <span className="text-[10px] text-amber-400 font-mono bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Pending
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Stop Loss */}
                    <td className="py-2 px-3 text-right text-rose-400/90 tabular-nums">
                      ₹{trade.stopLoss.toFixed(2)}
                    </td>

                    {/* Target */}
                    <td className="py-2 px-3 text-right text-emerald-400/90 tabular-nums">
                      ₹{trade.target.toFixed(2)}
                    </td>

                    {/* Quantity (Calculated) */}
                    <td className="py-2 px-3 text-right text-slate-300 tabular-nums">
                      {trade.quantity}
                    </td>

                    {/* Capital Required (Calculated) */}
                    <td className="py-2 px-3 text-right text-sky-400 font-medium tabular-nums">
                      {formatINR(trade.capitalRequired)}
                    </td>

                    {/* Actual Quantity */}
                    <td className="py-2 px-3 text-right text-slate-100 font-medium tabular-nums">
                      {trade.actualQuantity > 0 ? trade.actualQuantity : trade.status === 'Pending' ? '—' : trade.quantity}
                    </td>

                    {/* Exit Price */}
                    <td className="py-2 px-3 text-right text-slate-200 tabular-nums">
                      {trade.exitPrice !== null && trade.exitPrice !== undefined 
                        ? `₹${trade.exitPrice.toFixed(2)}` 
                        : '—'}
                    </td>

                    {/* Exit Date */}
                    <td className="py-2 px-3 text-slate-400">
                      {trade.exitDate || '—'}
                    </td>

                    {/* Script Source */}
                    <td className="py-2 px-3 text-center">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        source === 'HTF Running - I' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' :
                        source === 'HTF Running - II' ? 'bg-sky-950/40 text-sky-300 border-sky-500/30' :
                        'bg-slate-900 text-slate-300 border-slate-800'
                      }`}>
                        {source}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3 text-center">
                      <select
                        value={trade.status}
                        onChange={(e) => onUpdateStatus(trade.id, e.target.value as TradeStatus)}
                        className={`text-[11px] px-2 py-0.5 rounded border focus:outline-hidden font-sans font-medium cursor-pointer ${
                          trade.status === 'Close'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                            : trade.status === 'Active'
                            ? 'bg-sky-950/40 text-sky-300 border-sky-500/30'
                            : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Active">Active</option>
                        <option value="Close">Close</option>
                      </select>
                    </td>

                    {/* Profit/Loss (in Rupee) - GREEN IF POSITIVE, RED IF NEGATIVE */}
                    <td className={`py-2 px-3 text-right font-bold tabular-nums ${
                      isClosed
                        ? isPositive
                          ? 'text-emerald-400'
                          : isNegative
                          ? 'text-rose-400'
                          : 'text-slate-300'
                        : 'text-slate-500'
                    }`}>
                      {isClosed ? (
                        <>
                          {isPositive ? '+' : ''}{formatINR(trade.pnlRupee)}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Return on Investment % */}
                    <td className={`py-2 px-3 text-right tabular-nums ${
                      isClosed
                        ? isPositive
                          ? 'text-emerald-400'
                          : isNegative
                          ? 'text-rose-400'
                          : 'text-slate-300'
                        : 'text-slate-500'
                    }`}>
                      {isClosed ? `${trade.roiPercent > 0 ? '+' : ''}${trade.roiPercent.toFixed(1)}%` : '—'}
                    </td>

                    {/* Rule Followed */}
                    <td className="py-2 px-3 text-center">
                      {trade.ruleFollowed === 'Yes' ? (
                        <span className="text-emerald-400 font-medium">Yes</span>
                      ) : (
                        <span className="text-rose-400 font-medium">No</span>
                      )}
                    </td>

                    {/* Emotions */}
                    <td className="py-2 px-3 font-sans text-[11px] text-slate-300 max-w-[120px] truncate" title={trade.emotions?.join(', ')}>
                      {trade.emotions?.length > 0 ? trade.emotions.join(', ') : '—'}
                    </td>

                    {/* Interactive TradingView Chart button */}
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onOpenChartModal(trade)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 flex items-center justify-center gap-1 mx-auto transition-colors"
                        title="Open TradingView Chart with Target/SL Levels"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span className="font-sans text-[10px] font-semibold">View Chart</span>
                      </button>
                    </td>

                    {/* Prominent Delete & Actions */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        
                        {/* Edit */}
                        <button
                          onClick={() => onOpenTradeModal(trade)}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                          title="Edit Trade"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => onDuplicateTrade(trade)}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                          title="Duplicate Setup"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Explicit, Prominent Delete Button */}
                        <button
                          onClick={() => setTradeToDelete(trade)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition-colors"
                          title="Delete this trade record"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="p-3 border-t border-slate-800 bg-[#0b0f19] flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span>Showing {filteredTrades.length} records</span>
          <span className="text-slate-600">·</span>
          <span>
            Closed Trades P&L:{' '}
            <span className={`font-mono font-bold ${
              filteredTrades.filter(t => t.status === 'Close').reduce((acc, t) => acc + (t.pnlRupee || 0), 0) >= 0
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}>
              {formatINR(filteredTrades.filter(t => t.status === 'Close').reduce((acc, t) => acc + (t.pnlRupee || 0), 0))}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Green: Profit</span>
          <span>·</span>
          <span>Red: Loss</span>
          <span>·</span>
          <span>Multi-select batch delete enabled</span>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="mx-4 mt-3 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-lg flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white p-1"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-rose-500/30 rounded-xl max-w-md w-full p-5 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-400 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Delete {selectedIds.length} Selected Trades?</h3>
                <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              You are about to permanently delete <span className="text-white font-bold font-mono">{selectedIds.length} trade record(s)</span>. Available Capital and journal statistics will recalculate automatically.
            </p>

            {/* List of affected trades */}
            <div className="max-h-40 overflow-y-auto bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 mb-4 space-y-1.5">
              {trades
                .filter(t => selectedIds.includes(t.id))
                .map(t => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-slate-900/60 border border-slate-800/80">
                    <span className="font-semibold text-slate-200">
                      #{t.serialNumber} {t.script} <span className="text-slate-500 font-normal">({t.tradeType})</span>
                    </span>
                    <span className={t.status === 'Close' ? (t.pnlRupee >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold') : 'text-slate-400'}>
                      {t.status} {t.status === 'Close' ? `(₹${t.pnlRupee >= 0 ? '+' : ''}${t.pnlRupee})` : ''}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBatchDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1.5 shadow-md shadow-rose-950 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Trade Delete Confirmation Modal */}
      {tradeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-rose-500/30 rounded-xl max-w-sm w-full p-5 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-400 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Trade Record?</h3>
                <p className="text-[11px] text-slate-400">Permanent ledger removal</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 mb-3">
              Are you sure you want to delete trade <span className="text-white font-bold font-mono">#{tradeToDelete.serialNumber} ({tradeToDelete.script})</span>?
            </p>

            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 mb-4 text-[11px] font-mono space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Type / Source:</span>
                <span className="text-slate-200 font-semibold">{tradeToDelete.tradeType} · {tradeToDelete.scriptSource || tradeToDelete.setupQuality || 'HTF Running - I'}</span>
              </div>
              <div className="flex justify-between">
                <span>Entry / SL:</span>
                <span className="text-slate-200">₹{tradeToDelete.actualEntryPrice || tradeToDelete.entryPrice} / ₹{tradeToDelete.stopLoss}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={tradeToDelete.status === 'Close' ? 'text-emerald-400' : 'text-sky-400'}>{tradeToDelete.status}</span>
              </div>
              {tradeToDelete.status === 'Close' && (
                <div className="flex justify-between font-bold pt-1 border-t border-slate-800">
                  <span>P&L:</span>
                  <span className={tradeToDelete.pnlRupee >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    ₹{tradeToDelete.pnlRupee >= 0 ? '+' : ''}{tradeToDelete.pnlRupee}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTradeToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSingleDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Trade</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
