/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CapitalSummary } from './components/CapitalSummary';
import { Dashboard } from './components/Dashboard';
import { TradeTable } from './components/TradeTable';
import { EmotionalAnalysisView } from './components/EmotionalAnalysisView';
import { StrategyAnalysisView } from './components/StrategyAnalysisView';
import { ChartVaultView } from './components/ChartVaultView';
import { TradeModal } from './components/TradeModal';
import { ChartViewerModal } from './components/ChartViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { LiveTradingViewChart } from './components/LiveTradingViewChart';
import { Trade, TradeStatus } from './types/trade';
import { SAMPLE_TRADES, INITIAL_CAPITAL } from './utils/sampleData';
import { calculateCapitalMetrics } from './utils/calculations';

const STORAGE_KEY_TRADES = 'apextrade_journal_trades_v1';
const STORAGE_KEY_CAPITAL = 'apextrade_journal_capital_v1';

export default function App() {
  // Local storage initialization
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRADES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading trades from storage', e);
    }
    return SAMPLE_TRADES;
  });

  const [totalCapital, setTotalCapital] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CAPITAL);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading capital from storage', e);
    }
    return INITIAL_CAPITAL;
  });

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRADES, JSON.stringify(trades));
    } catch (e) {
      console.error('Error saving trades', e);
    }
  }, [trades]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CAPITAL, totalCapital.toString());
    } catch (e) {
      console.error('Error saving capital', e);
    }
  }, [totalCapital]);

  // Tab & Modal Navigation States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trades' | 'live_chart' | 'emotions' | 'strategy' | 'charts'>('dashboard');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedChartTrade, setSelectedChartTrade] = useState<Trade | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Capital Metrics Calculation
  // Exactly follows prompt formula:
  // Capital Available = Total Capital + (Closed Trades Net PnL) - (Active Trades Capital Required)
  const capitalMetrics = useMemo(() => {
    return calculateCapitalMetrics(trades, totalCapital);
  }, [trades, totalCapital]);

  const nextSerialNumber = useMemo(() => {
    return trades.length + 1;
  }, [trades.length]);

  // Handlers
  const handleOpenNewTrade = () => {
    setTradeToEdit(null);
    setIsTradeModalOpen(true);
  };

  const handleEditTrade = (trade?: Trade) => {
    if (trade) {
      setTradeToEdit(trade);
    } else {
      setTradeToEdit(null);
    }
    setIsTradeModalOpen(true);
  };

  const handleSaveTrade = (savedTrade: Trade) => {
    setTrades(prevTrades => {
      const existsIndex = prevTrades.findIndex(t => t.id === savedTrade.id);
      if (existsIndex >= 0) {
        const copy = [...prevTrades];
        copy[existsIndex] = savedTrade;
        return copy;
      } else {
        const newTradeWithSerial: Trade = {
          ...savedTrade,
          serialNumber: prevTrades.length + 1
        };
        return [...prevTrades, newTradeWithSerial];
      }
    });
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(prev => {
      const filtered = prev.filter(t => t.id !== id);
      return filtered.map((t, idx) => ({
        ...t,
        serialNumber: idx + 1
      }));
    });
  };

  const handleDeleteMultipleTrades = (ids: string[]) => {
    const idSet = new Set(ids);
    setTrades(prev => {
      const filtered = prev.filter(t => !idSet.has(t.id));
      return filtered.map((t, idx) => ({
        ...t,
        serialNumber: idx + 1
      }));
    });
  };

  const handleDuplicateTrade = (trade: Trade) => {
    const duplicated: Trade = {
      ...trade,
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      serialNumber: nextSerialNumber,
      tradeDate: new Date().toISOString().split('T')[0],
      exitPrice: null,
      exitDate: '',
      status: 'Pending',
      pnlRupee: 0,
      roiRupee: 0,
      roiPercent: 0,
      chartAfter: '',
      notes: `Duplicated from #${trade.serialNumber} (${trade.script})`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setTrades(prev => [...prev, duplicated]);
  };

  const handleUpdateStatus = (id: string, newStatus: TradeStatus) => {
    setTrades(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: newStatus,
          updatedAt: Date.now()
        };
      }
      return t;
    }));
  };

  const handleOpenChartModal = (trade: Trade) => {
    setSelectedChartTrade(trade);
    setIsChartModalOpen(true);
  };

  const [appToast, setAppToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAppToast({ message, type });
    setTimeout(() => setAppToast(null), 3500);
  };

  const handleExportCSV = () => {
    if (trades.length === 0) {
      showToast('No trades available to export.', 'info');
      return;
    }

    const headers = [
      'Serial Number',
      'Trade Analysis Date',
      'Script',
      'Trade Direction',
      'Trade Type',
      'Entry Type',
      'Risk per Trade',
      'MTF',
      'Entry Price',
      'Actual Entry Price',
      'Stop Loss',
      'Target',
      'Quantity',
      'Capital Required',
      'Actual Quantity',
      'Exit Price',
      'Exit Date',
      'Script Source',
      'Status',
      'Profit/Loss (in Rupee)',
      'Return on Investment (Rupee)',
      'ROI (%)',
      'Rule Followed',
      'Emotion',
      'Notes'
    ];

    const rows = trades.map(t => [
      t.serialNumber,
      `"${t.tradeDate}"`,
      `"${t.script}"`,
      t.tradeDirection || 'Long',
      t.tradeType,
      t.entryType || 'Direct',
      t.riskPerTrade,
      t.mtf,
      t.entryPrice,
      t.actualEntryPrice || '',
      t.stopLoss,
      t.target,
      t.quantity,
      t.capitalRequired,
      t.actualQuantity,
      t.exitPrice !== null ? t.exitPrice : '',
      `"${t.exitDate || ''}"`,
      t.scriptSource || t.setupQuality || 'HTF Running - I',
      t.status,
      t.pnlRupee,
      t.roiRupee,
      t.roiPercent,
      t.ruleFollowed,
      `"${(t.emotions || []).join('; ')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ApexTrade_Journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded successfully.', 'success');
  };

  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalCapital,
      trades
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ApexTrade_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('JSON backup created.', 'success');
  };

  const handleImportJSON = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.trades && Array.isArray(parsed.trades)) {
        setTrades(parsed.trades);
        if (typeof parsed.totalCapital === 'number' && parsed.totalCapital > 0) {
          setTotalCapital(parsed.totalCapital);
        }
        showToast(`Successfully imported ${parsed.trades.length} trades!`, 'success');
      } else if (Array.isArray(parsed)) {
        setTrades(parsed);
        showToast(`Successfully imported ${parsed.length} trades!`, 'success');
      } else {
        showToast('Invalid trade backup structure.', 'error');
      }
    } catch (e) {
      showToast('Error reading JSON file.', 'error');
    }
  };

  const handleResetToSample = () => {
    setTrades(SAMPLE_TRADES);
    setTotalCapital(INITIAL_CAPITAL);
    showToast('Sample trades loaded.', 'info');
  };

  const handleClearAll = () => {
    setTrades([]);
    showToast('All trade entries cleared.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTrade={handleOpenNewTrade}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        totalCapital={totalCapital}
        capitalAvailable={capitalMetrics.capitalAvailable}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Prominent Capital Management Strip (Total Capital & Capital Available) */}
        <CapitalSummary
          metrics={capitalMetrics}
          onUpdateTotalCapital={setTotalCapital}
        />

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <Dashboard
            trades={trades}
            metrics={capitalMetrics}
            onOpenTradeModal={handleEditTrade}
            onOpenChartModal={handleOpenChartModal}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'trades' && (
          <TradeTable
            trades={trades}
            onOpenTradeModal={handleEditTrade}
            onOpenChartModal={handleOpenChartModal}
            onDeleteTrade={handleDeleteTrade}
            onDeleteMultipleTrades={handleDeleteMultipleTrades}
            onDuplicateTrade={handleDuplicateTrade}
            onUpdateStatus={handleUpdateStatus}
            onExportCSV={handleExportCSV}
            onLoadSampleTrades={handleResetToSample}
          />
        )}

        {activeTab === 'live_chart' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Institutional Real-Time Market Terminal
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live TradingView candlestick chart powered by Indian Stock Market API (India API) and real-time exchange feeds.
                </p>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-xs font-mono text-emerald-400 bg-slate-900 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                <span>India API Settings</span>
              </button>
            </div>

            <LiveTradingViewChart height={580} />
          </div>
        )}

        {activeTab === 'emotions' && (
          <EmotionalAnalysisView trades={trades} />
        )}

        {activeTab === 'strategy' && (
          <StrategyAnalysisView trades={trades} />
        )}

        {activeTab === 'charts' && (
          <ChartVaultView
            trades={trades}
            onOpenChartModal={handleOpenChartModal}
            onOpenTradeModal={handleEditTrade}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#090d16] py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">ApexTrade Pro</span>
            <span>·</span>
            <span>Institutional Trading Journal & Analytics</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Capital Sizing: (Risk% × Capital) / |Entry - SL|</span>
            <span>·</span>
            <span>Margin Locked: Qty × Entry</span>
          </div>
        </div>
      </footer>

      {/* Trade Entry / Edit Modal */}
      {isTradeModalOpen && (
        <TradeModal
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          onSave={handleSaveTrade}
          tradeToEdit={tradeToEdit}
          totalCapital={totalCapital}
          nextSerialNumber={nextSerialNumber}
        />
      )}

      {/* Chart Inspector Modal */}
      {isChartModalOpen && selectedChartTrade && (
        <ChartViewerModal
          isOpen={isChartModalOpen}
          trade={selectedChartTrade}
          onClose={() => {
            setIsChartModalOpen(false);
            setSelectedChartTrade(null);
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          totalCapital={totalCapital}
          onUpdateTotalCapital={setTotalCapital}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onResetToSample={handleResetToSample}
          onClearAll={handleClearAll}
        />
      )}

      {/* App Toast Notifications */}
      {appToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-2xl text-xs font-medium animate-in fade-in slide-in-from-top-3 bg-[#0f172a]/95 backdrop-blur-md text-slate-100 border-slate-700/80">
          <span className={`w-2 h-2 rounded-full ${appToast.type === 'success' ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : appToast.type === 'error' ? 'bg-rose-400 shadow-sm shadow-rose-400' : 'bg-sky-400'}`} />
          <span>{appToast.message}</span>
        </div>
      )}

    </div>
  );
}
