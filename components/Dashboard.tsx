
import React, { useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FinancialEntry } from '../types';
import { storageService } from '../services/storageService';

interface DashboardProps {
  entries: FinancialEntry[];
  onDataRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ entries, onDataRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [timeframe, setTimeframe] = useState<'1Y' | 'ALL' | 'YTD' | string>('1Y');
  
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    entries.forEach(e => {
      const year = new Date(e.date).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const rawCurrency = entries[0]?.currency || 'USD';
  const currency = useMemo(() => {
    if (typeof rawCurrency !== 'string' || rawCurrency.length !== 3) return 'USD';
    const upper = rawCurrency.toUpperCase();
    return /^[A-Z]{3}$/.test(upper) ? upper : 'USD';
  }, [rawCurrency]);
  
  const formatCurrency = (val: number, compact = false) => {
    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency, 
        maximumFractionDigits: 0,
        notation: compact ? 'compact' : 'standard'
      }).format(val);
    } catch (e) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    }
  };

  const chartData = useMemo(() => {
    const months: Record<string, { month: string, gross: number, net: number, timestamp: number }> = {};
    const now = new Date();
    const currentYear = now.getFullYear();

    [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(e => {
      const date = new Date(e.date);
      const m = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const year = date.getFullYear();
      
      // Filter based on timeframe
      if (timeframe === '1Y') {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 12);
        if (date < twelveMonthsAgo) return;
      } else if (timeframe === 'YTD') {
        if (year !== currentYear) return;
      } else if (timeframe !== 'ALL') {
        // Specific year selected
        if (year.toString() !== timeframe) return;
      }

      if (!months[m]) months[m] = { month: m, gross: 0, net: 0, timestamp: date.getTime() };
      months[m].gross += e.grossAmount || 0;
      months[m].net += e.amount;
    });

    let result = Object.values(months).sort((a, b) => a.timestamp - b.timestamp);
    
    // If ALL and too many points, we might want to aggregate further, 
    // but for now let's just show them. 
    // If it's from 2021, that's ~4 years = 48 points. Still manageable in a bar chart.
    return result;
  }, [entries, timeframe]);

  const recentEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [entries]);

  const stats = useMemo(() => {
    const totalNet = entries.reduce((acc, e) => acc + e.amount, 0);
    const totalGross = entries.reduce((acc, e) => acc + (e.grossAmount || 0), 0);
    const totalDeductions = entries.reduce((acc, e) => acc + (e.deductions || 0) + (e.tax || 0), 0);
    const totalBenefits = entries.reduce((acc, e) => acc + (e.totalBenefits || 0), 0);
    return { totalNet, totalGross, totalDeductions, totalBenefits };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="py-24 text-center animate-in fade-in duration-700 min-h-[60vh] flex flex-col justify-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Portfolio Ready</h3>
        <p className="text-sm text-slate-400 mt-2 mb-10 max-w-[250px] mx-auto">Upload your first pay stub to start tracking your trajectory.</p>
        <button onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-slate-900 text-white rounded-3xl font-bold text-sm shadow-xl active:scale-95 transition-all mx-auto">Import Backup</button>
        <input type="file" ref={fileInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => { if (storageService.importData(ev.target?.result as string)) onDataRefresh(); };
            reader.readAsText(file);
          }
        }} className="hidden" accept=".json" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Section: Balance and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Balance Card */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-4 opacity-80">Total Gross Earnings</p>
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-12">{formatCurrency(stats.totalGross)}</h2>
            
            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
              <div>
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Net Take-Home</p>
                <p className="text-2xl md:text-3xl font-bold tracking-tight">{formatCurrency(stats.totalNet)}</p>
                <p className="text-[8px] text-white/40 mt-1 italic">Total cash received</p>
              </div>
              <div>
                <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Taxes & Deductions</p>
                <p className="text-2xl md:text-3xl font-bold tracking-tight">{formatCurrency(stats.totalDeductions)}</p>
                <p className="text-[8px] text-white/40 mt-1 italic">Total leakage from gross</p>
              </div>
            </div>
          </div>
          
          {/* Abstract Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] -ml-24 -mb-24"></div>
        </div>

        {/* Side Stats Card */}
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Compensation Summary</h4>
            <div className="space-y-6">
              <div>
                <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-1">Company Benefits</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(stats.totalBenefits)}</p>
                <p className="text-[9px] text-slate-400 mt-1">Non-cash value provided by employer</p>
              </div>
              <div className="pt-6 border-t border-slate-50">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Profile Status</p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <p className="text-xs font-bold text-slate-800 uppercase">Verified Professional</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'add' }))}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              New Entry
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Chart Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-10 px-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Earnings Velocity</h3>
            <div className="flex items-center space-x-2">
              <select 
                value={availableYears.includes(timeframe) ? timeframe : ''} 
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-50 border-none text-[9px] font-bold text-slate-500 rounded-lg px-2 py-1 outline-none"
              >
                <option value="" disabled>Year</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                {(['1Y', 'YTD', 'ALL'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-[9px] font-bold rounded-lg transition-all ${
                      timeframe === tf ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#cbd5e1', fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '12px' }}
                />
                <Bar dataKey="gross" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={16} />
                <Bar dataKey="net" fill="#10b981" radius={[8, 8, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Activity Table */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Recent Activity</h3>
            <button onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'history' }))} className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">View All</button>
          </div>
          <div className="space-y-4">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors rounded-xl px-2">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-500 shrink-0">
                    <span className="text-[8px] font-bold uppercase">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-sm font-black">{new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric' })}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 truncate max-w-[150px] md:max-w-[200px]">{entry.source}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{entry.jobTitle || 'Salary'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">+{formatCurrency(entry.amount, true)}</p>
                  <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Net</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <button onClick={() => storageService.exportData()} className="flex-1 py-5 bg-slate-900 text-white rounded-3xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-200 hover:bg-slate-800">Export Portfolio Data</button>
        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-5 bg-white text-slate-500 rounded-3xl text-[11px] font-bold uppercase tracking-widest border border-slate-100 active:scale-95 transition-all hover:bg-slate-50">Import Backup Archive</button>
      </div>
    </div>
  );
};

export default Dashboard;
