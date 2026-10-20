import React from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerSelectorProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  required?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DatePickerSelector: React.FC<DatePickerSelectorProps> = ({
  label,
  value,
  onChange,
  required = false
}) => {
  // Parse current date or default to today
  const parsed = value ? new Date(value) : new Date();
  const currentYear = isNaN(parsed.getFullYear()) ? new Date().getFullYear() : parsed.getFullYear();
  const currentMonth = isNaN(parsed.getMonth()) ? new Date().getMonth() : parsed.getMonth();
  const currentDay = isNaN(parsed.getDate()) ? new Date().getDate() : parsed.getDate();

  const handleDayChange = (day: number) => {
    const formattedDay = day.toString().padStart(2, '0');
    const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
    onChange(`${currentYear}-${formattedMonth}-${formattedDay}`);
  };

  const handleMonthChange = (monthIdx: number) => {
    const formattedMonth = (monthIdx + 1).toString().padStart(2, '0');
    // Adjust day if month has fewer days
    const maxDays = new Date(currentYear, monthIdx + 1, 0).getDate();
    const safeDay = Math.min(currentDay, maxDays).toString().padStart(2, '0');
    onChange(`${currentYear}-${formattedMonth}-${safeDay}`);
  };

  const handleYearChange = (year: number) => {
    const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
    const maxDays = new Date(year, currentMonth + 1, 0).getDate();
    const safeDay = Math.min(currentDay, maxDays).toString().padStart(2, '0');
    onChange(`${year}-${formattedMonth}-${safeDay}`);
  };

  const handleQuickToday = () => {
    onChange(new Date().toISOString().split('T')[0]);
  };

  // Generate days array for current month & year
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Generate year options (2023 - 2030)
  const yearsArray = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium text-slate-300">
        <label className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={handleQuickToday}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono"
        >
          Set Today
        </button>
      </div>

      {/* Structured Day, Month, Year Selectors */}
      <div className="grid grid-cols-3 gap-1.5">
        
        {/* Day Select */}
        <div>
          <select
            value={currentDay}
            onChange={(e) => handleDayChange(parseInt(e.target.value))}
            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500"
          >
            {daysArray.map(d => (
              <option key={d} value={d}>Day: {d.toString().padStart(2, '0')}</option>
            ))}
          </select>
        </div>

        {/* Month Select */}
        <div>
          <select
            value={currentMonth}
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-hidden focus:border-emerald-500 font-medium"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx}>{m.slice(0, 3)}</option>
            ))}
          </select>
        </div>

        {/* Year Select */}
        <div>
          <select
            value={currentYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500"
          >
            {yearsArray.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

      </div>

      {/* ISO Date Preview */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>Selected: {value || 'None'}</span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="opacity-0 w-0 h-0 pointer-events-none"
        />
      </div>
    </div>
  );
};
