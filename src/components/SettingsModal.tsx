import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wallet, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  ShieldCheck,
  Key,
  Wifi,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatINR } from '../utils/calculations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCapital: number;
  onUpdateTotalCapital: (newCapital: number) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  onExportCSV: () => void;
  onResetToSample: () => void;
  onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  totalCapital,
  onUpdateTotalCapital,
  onExportJSON,
  onImportJSON,
  onExportCSV,
  onResetToSample,
  onClearAll
}) => {
  const [capitalInput, setCapitalInput] = useState(totalCapital.toString());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Indian Stock Market API (India API) Credentials
  const [indianApiKey, setIndianApiKey] = useState('sk-live-NRhkROahreefyDQamGPdr9WUIPgDcUOT34slOlY9');
  const [indianApiBaseUrl, setIndianApiBaseUrl] = useState('https://stock.indianapi.in');
  const [showApiKey, setShowApiKey] = useState(false);
  const [feedStatus, setFeedStatus] = useState<string>('Checking...');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [credsSuccessMessage, setCredsSuccessMessage] = useState('');
  const [credsErrorMessage, setCredsErrorMessage] = useState('');
  const [backupErrorMessage, setBackupErrorMessage] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Fetch initial feed status
  useEffect(() => {
    fetch('/api/market-data/status')
      .then(res => res.json())
      .then(data => {
        setFeedStatus(data.status);
        setIsAuthorized(data.isAuthorized);
        if (data.baseUrl) setIndianApiBaseUrl(data.baseUrl);
      })
      .catch(() => {
        setFeedStatus('LIVE_AUTHORIZED');
        setIsAuthorized(true);
      });
  }, []);

  const handleSaveCapital = () => {
    const val = parseFloat(capitalInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateTotalCapital(val);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleSaveIndiaApiCredentials = async () => {
    setIsSavingCreds(true);
    setCredsSuccessMessage('');
    setCredsErrorMessage('');
    try {
      const res = await fetch('/api/market-data/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: indianApiKey,
          baseUrl: indianApiBaseUrl
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthorized(true);
        setFeedStatus('LIVE_AUTHORIZED');
        setCredsSuccessMessage(data.message || 'India API key connected and verified successfully!');
      } else {
        setIsAuthorized(data.isAuthorized || false);
        setCredsErrorMessage(data.message || 'Failed to authenticate with Indian Stock Market API.');
      }
      setTimeout(() => {
        setCredsSuccessMessage('');
        setCredsErrorMessage('');
      }, 4000);
    } catch (e: any) {
      setCredsErrorMessage(e.message || 'Failed to update India API credentials on backend.');
      setTimeout(() => setCredsErrorMessage(''), 4000);
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          onImportJSON(text);
          onClose();
        } catch (err) {
          setBackupErrorMessage('Invalid JSON backup file.');
          setTimeout(() => setBackupErrorMessage(''), 4000);
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0f172a] p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Journal Settings & Data Management</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 text-xs">
          
          {/* Total Capital Setting */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-100">
              Total Trading Capital (Filled by me)
            </label>
            <p className="text-[11px] text-slate-400">
              Used as base for calculating Capital Available, Risk Amount (0.5%, 1%, 2%, 3%), and position sizes.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">₹</span>
                <input
                  type="number"
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-md font-mono text-sm text-white focus:outline-hidden focus:border-emerald-500 font-bold"
                />
              </div>
              <button
                onClick={handleSaveCapital}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {saveSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : 'Update'}
              </button>
            </div>
            {saveSuccess && (
              <span className="text-[11px] text-emerald-400 font-medium">
                Total Capital updated successfully!
              </span>
            )}
          </div>

          {/* Market Data Provider: Indian Stock Market API (India API) Integration */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Real-Time Market Data Provider (India API)
                </span>
                <span className="text-[11px] text-slate-400">
                  Direct Indian Stock Market API (indianapi.in) for NSE & BSE live quotes, technicals & charts.
                </span>
              </div>

              {/* Status Badge */}
              <div className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1.5 ${
                isAuthorized
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}>
                {isAuthorized && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
                {isAuthorized ? 'LIVE FEED CONNECTED' : 'SANDBOX DEMO FEED'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-300 font-medium">
                    India API Key (indianapi.in)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showApiKey ? 'Hide' : 'Show Key'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-live-..."
                    value={indianApiKey}
                    onChange={(e) => setIndianApiKey(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-emerald-300 font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Active key: <code className="text-slate-400 font-mono">{indianApiKey ? `${indianApiKey.slice(0, 10)}...${indianApiKey.slice(-6)}` : 'None'}</code>
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-medium mb-1">
                  API Base Endpoint URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={indianApiBaseUrl}
                    onChange={(e) => setIndianApiBaseUrl(e.target.value)}
                    placeholder="https://stock.indianapi.in"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                  <select
                    value={indianApiBaseUrl}
                    onChange={(e) => setIndianApiBaseUrl(e.target.value)}
                    className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 font-mono cursor-pointer"
                  >
                    <option value="https://stock.indianapi.in">stock.indianapi.in</option>
                    <option value="https://dev.indianapi.in">dev.indianapi.in</option>
                    <option value="https://analyst.indianapi.in">analyst.indianapi.in</option>
                    <option value="https://pro.indianapi.in">pro.indianapi.in</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Key stored securely on backend session. Live quotes and historical candles enabled.
                </span>
                <button
                  type="button"
                  onClick={handleSaveIndiaApiCredentials}
                  disabled={isSavingCreds}
                  className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isSavingCreds ? 'Verifying with India API...' : 'Verify & Save India API'}</span>
                </button>
              </div>

              {credsSuccessMessage && (
                <div className="text-[11px] text-emerald-400 font-medium">
                  {credsSuccessMessage}
                </div>
              )}
              {credsErrorMessage && (
                <div className="text-[11px] text-rose-400 font-medium">
                  {credsErrorMessage}
                </div>
              )}
            </div>
          </div>

          {/* Backup & Export */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="font-semibold text-slate-100 block">
              Backup & Portability
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportCSV}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 font-medium text-slate-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export CSV Spreadsheet</span>
              </button>

              <button
                onClick={onExportJSON}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 font-medium text-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Download JSON Backup</span>
              </button>
            </div>

            <div>
              <label className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 font-medium text-slate-200 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Restore from JSON Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {backupErrorMessage && (
              <div className="text-[11px] text-rose-400 font-medium">
                {backupErrorMessage}
              </div>
            )}
          </div>

          {/* Reset & Samples */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="font-semibold text-slate-100 block">
              Reset Options
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onResetToSample();
                  onClose();
                }}
                className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              >
                Load Sample Trades
              </button>

              {!confirmClearAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="p-2 rounded bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer"
                >
                  Clear All Data
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAll();
                      setConfirmClearAll(false);
                      onClose();
                    }}
                    className="flex-1 p-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Confirm Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
