
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
    const months: Record<string, { month: string, gross: number, net: number }> = {};
    [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(e => {
      const m = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[m]) months[m] = { month: m, gross: 0, net: 0 };
      months[m].gross += e.grossAmount || 0;
      months[m].net += e.amount;
    });
    return Object.values(months).slice(-12);
  }, [entries]);

  const stats = useMemo(() => {
    const totalNet = entries.reduce((acc, e) => acc + e.amount, 0);
    const totalGross = entries.reduce((acc, e) => acc + (e.grossAmount || 0), 0);
    const totalDeductions = entries.reduce((acc, e) => acc + (e.deductions || 0) + (e.tax || 0), 0);
    return { totalNet, totalGross, totalDeductions };
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
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Primary Balance Card */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden mx-1">
        <div className="relative z-10">
          <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-4 opacity-80">Total Gross Earnings</p>
          <h2 className="text-5xl font-extrabold tracking-tighter mb-12">{formatCurrency(stats.totalGross)}</h2>
          
          <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
            <div>
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Net Flow</p>
              <p className="text-2xl font-bold tracking-tight">{formatCurrency(stats.totalNet)}</p>
            </div>
            <div>
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Total Leakage</p>
              <p className="text-2xl font-bold tracking-tight">{formatCurrency(stats.totalDeductions)}</p>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] -ml-24 -mb-24"></div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mx-1">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-10 px-2">Earnings Velocity</h3>
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
      
      {/* Action Grid */}
      <div className="px-4 grid grid-cols-2 gap-4">
        <button onClick={() => storageService.exportData()} className="py-5 bg-slate-900 text-white rounded-3xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-200">Export PDF</button>
        <button onClick={() => fileInputRef.current?.click()} className="py-5 bg-white text-slate-500 rounded-3xl text-[11px] font-bold uppercase tracking-widest border border-slate-100 active:scale-95 transition-all">Import Backup</button>
      </div>
    </div>
  );
};

export default Dashboard;
