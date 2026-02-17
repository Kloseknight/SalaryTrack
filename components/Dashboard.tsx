
import React, { useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FinancialEntry } from '../types';
import { storageService } from '../services/storageService';

interface DashboardProps {
  entries: FinancialEntry[];
  onDataRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ entries, onDataRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chartData = useMemo(() => {
    const months: Record<string, { month: string, gross: number, net: number, deductions: number }> = {};
    
    [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(e => {
      const m = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[m]) months[m] = { month: m, gross: 0, net: 0, deductions: 0 };
      
      const gross = e.grossAmount || e.amount + (e.tax || 0) + (e.deductions || 0);
      const deductions = (e.tax || 0) + (e.deductions || 0);
      
      months[m].gross += gross;
      months[m].net += e.amount;
      months[m].deductions += deductions;
    });

    return Object.values(months).slice(-6);
  }, [entries]);

  const stats = useMemo(() => {
    const totalNet = entries.reduce((acc, e) => acc + e.amount, 0);
    const totalGross = entries.reduce((acc, e) => acc + (e.grossAmount || e.amount + (e.tax || 0) + (e.deductions || 0)), 0);
    const totalDeductions = totalGross - totalNet;
    return { totalNet, totalGross, totalDeductions };
  }, [entries]);

  // Helper to ensure currency code is valid ISO 4217
  const getSafeCurrency = (code?: string) => {
    if (!code || typeof code !== 'string' || code.length !== 3) return 'USD';
    const upper = code.toUpperCase();
    // Basic regex check for 3-letter code
    return /^[A-Z]{3}$/.test(upper) ? upper : 'USD';
  };

  const currency = getSafeCurrency(entries[0]?.currency);
  
  const formatCurrency = (val: number) => {
    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency, 
        maximumFractionDigits: 0 
      }).format(val);
    } catch (e) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        maximumFractionDigits: 0 
      }).format(val);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storageService.importData(content)) {
        alert("Backup restored successfully!");
        onDataRefresh();
      } else {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative">
             <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Lifetime Salary Tracker</h3>
          <p className="text-sm text-slate-400 px-12 mt-3 leading-relaxed">Your data is stored securely on your iPhone. Upload your first slip to start building your career portfolio.</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold hover:bg-indigo-100 transition-all uppercase tracking-widest"
          >
            Import Previous Backup
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Persistence Badge */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Saved Locally to Device</span>
        </div>
      </div>

      {/* Salary Overview Card */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Cumulative Net Income</p>
          <h2 className="text-5xl font-bold tracking-tighter mb-8 group-active:scale-95 transition-transform duration-300">
            {formatCurrency(stats.totalNet)}
          </h2>
          
          <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total Gross</p>
              <p className="text-2xl font-semibold">{formatCurrency(stats.totalGross)}</p>
            </div>
            <div>
              <p className="text-rose-400 text-[10px] font-bold uppercase mb-1">Deductions</p>
              <p className="text-2xl font-semibold">-{formatCurrency(stats.totalDeductions)}</p>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all"></div>
      </div>

      {/* Earnings vs Deductions Chart */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Earnings Breakdown</h3>
          <span className="text-[9px] font-bold bg-slate-50 text-slate-400 px-3 py-1 rounded-full uppercase">Last 6 Slips</span>
        </div>
        {/* Added min-width and fixed height to ensure ResponsiveContainer has dimensions */}
        <div className="h-52 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#cbd5e1'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="gross" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="net" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cloud & Portability */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data Persistence</h3>
          <span className="text-[9px] font-medium text-slate-300">v2.1 Archive</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => storageService.exportData()}
            className="flex items-center justify-center space-x-2 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-xl shadow-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Backup</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold active:scale-95 transition-all border border-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Restore</span>
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        
        <p className="text-[10px] text-slate-400 text-center px-6 leading-relaxed">
          Your data never leaves this device. To move your history to a new iPhone, use the <strong>Export</strong> feature and save the file to iCloud.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
