
import React, { useMemo, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { FinancialEntry } from '../types';
import { storageService } from '../services/storageService';

interface DashboardProps {
  entries: FinancialEntry[];
  onDataRefresh: () => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const METRIC_DEFS = {
  momentum: {
    title: "Income Momentum",
    calc: "((Avg Gross L3M - Avg Gross S3M) / Avg Gross S3M) * 100",
    desc: "Velocity of your career growth. Compares your most recent 3 paychecks vs your first 3. Positive momentum signifies raises, promotions, or successful job hops."
  },
  hourly: {
    title: "Labor Value (Gross)",
    calc: "Gross Income / Hours Worked",
    desc: "Your true efficiency. Tracking this ensures that a salary increase is actually a raise, not just working more hours. It's the 'price' of your time."
  },
  keepRate: {
    title: "Keep Rate (Efficiency)",
    calc: "(Net Pay / Gross Income) * 100",
    desc: "The percentage of earnings that actually hits your bank account. High leakage suggests high taxes or deduction-heavy benefits."
  },
  assets: {
    title: "Lifetime Liquidity",
    calc: "Sum of all Net Deposits",
    desc: "The total amount of cash that has passed through your control. This is the seed capital for your entire lifetime investment strategy."
  }
};

const Dashboard: React.FC<DashboardProps> = ({ entries, onDataRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'income' | 'wealth'>('income');
  const [activeInfo, setActiveInfo] = useState<keyof typeof METRIC_DEFS | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'total' | 'name'; direction: 'asc' | 'desc' }>({ key: 'total', direction: 'desc' });

  const currency = entries[0]?.currency || 'USD';
  
  const formatCurrency = (val: number, compact = false) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0,
      notation: compact ? 'compact' : 'standard'
    }).format(val);
  };

  const chartData = useMemo(() => {
    const months: Record<string, { month: string, gross: number, net: number, [key: string]: any }> = {};
    
    [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(e => {
      const m = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[m]) months[m] = { month: m, gross: 0, net: 0 };
      
      const gross = e.grossAmount || e.amount + (e.tax || 0) + (e.deductions || 0);
      months[m].gross += gross;
      months[m].net += e.amount;

      e.disbursements?.forEach(d => {
        const key = `${d.bankName} (${d.accountNo.slice(-4)})`;
        months[m][key] = (months[m][key] || 0) + d.amount;
      });
    });

    return Object.values(months).slice(-12);
  }, [entries]);

  const stats = useMemo(() => {
    const totalNet = entries.reduce((acc, e) => acc + e.amount, 0);
    const totalGross = entries.reduce((acc, e) => acc + (e.grossAmount || e.amount + (e.tax || 0) + (e.deductions || 0)), 0);
    const totalDeductions = totalGross - totalNet;
    
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first3 = sorted.slice(0, 3);
    const last3 = sorted.slice(-3);
    
    const avgFirst3 = first3.length ? first3.reduce((a, b) => a + (b.grossAmount || b.amount), 0) / first3.length : 0;
    const avgLast3 = last3.length ? last3.reduce((a, b) => a + (b.grossAmount || b.amount), 0) / last3.length : 0;
    const momentum = avgFirst3 ? ((avgLast3 - avgFirst3) / avgFirst3) * 100 : 0;
    
    const keepRate = totalGross ? (totalNet / totalGross) * 100 : 0;
    
    const entriesWithHours = entries.filter(e => (e.workedHours || 0) > 0);
    const effectiveHourly = entriesWithHours.length 
      ? entriesWithHours.reduce((acc, e) => acc + ((e.grossAmount || e.amount) / (e.workedHours || 1)), 0) / entriesWithHours.length 
      : 0;

    return { totalNet, totalGross, totalDeductions, momentum, keepRate, effectiveHourly };
  }, [entries]);

  const disbursementTotals = useMemo(() => {
    const totals: Record<string, { name: string, total: number, account: string }> = {};
    entries.forEach(e => {
      e.disbursements?.forEach(d => {
        const id = `${d.bankName}-${d.accountNo}`;
        if (!totals[id]) totals[id] = { name: d.bankName, total: 0, account: d.accountNo };
        totals[id].total += d.amount;
      });
    });
    
    const result = Object.values(totals);
    
    return result.sort((a, b) => {
      const isAsc = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.key === 'total') {
        return (a.total - b.total) * isAsc;
      }
      return a.name.localeCompare(b.name) * isAsc;
    });
  }, [entries, sortConfig]);

  const handleSort = (key: 'total' | 'name') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const InfoModal = () => {
    if (!activeInfo) return null;
    const def = METRIC_DEFS[activeInfo];
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-20 sm:items-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-md" onClick={() => setActiveInfo(null)}></div>
        <div className="relative bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>
          <h4 className="text-2xl font-bold text-slate-900 mb-2">{def.title}</h4>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-6">Logic: {def.calc}</p>
          <p className="text-sm text-slate-500 leading-relaxed mb-10">{def.desc}</p>
          <button 
            onClick={() => setActiveInfo(null)}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-lg shadow-slate-200"
          >Dismiss Analysis</button>
        </div>
      </div>
    );
  };

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Start Your Legacy</h3>
        <p className="text-sm text-slate-400 max-w-[200px] mx-auto mt-2 mb-8 leading-relaxed">Scan your first pay stub to begin your career financial audit.</p>
        <button onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-95 transition-all">Import Backup</button>
        <input type="file" ref={fileInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (storageService.importData(event.target?.result as string)) onDataRefresh();
            };
            reader.readAsText(file);
          }
        }} accept=".json" className="hidden" />
      </div>
    );
  }

  const uniqueChannels = Array.from(new Set(entries.flatMap(e => e.disbursements?.map(d => `${d.bankName} (${d.accountNo.slice(-4)})`) || [])));

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <InfoModal />
      
      {/* Top Level Metric Grid */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-1 relative z-10">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Momentum</p>
            <button onClick={() => setActiveInfo('momentum')} className="p-1 -mr-2 -mt-1 text-slate-200 hover:text-indigo-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
          <h4 className={`text-2xl font-bold relative z-10 ${stats.momentum >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {stats.momentum >= 0 ? '+' : ''}{stats.momentum.toFixed(1)}%
          </h4>
          <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        </div>

        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-1 relative z-10">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hourly</p>
            <button onClick={() => setActiveInfo('hourly')} className="p-1 -mr-2 -mt-1 text-slate-200 hover:text-indigo-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
          <h4 className="text-2xl font-bold text-indigo-600 relative z-10">{formatCurrency(stats.effectiveHourly)}</h4>
          <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        </div>
      </div>

      {/* Hero Financial Totals */}
      <div className="bg-slate-900 rounded-[2.8rem] p-10 text-white shadow-2xl relative overflow-hidden mx-2">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em]">
              {viewMode === 'income' ? 'Gross Career Yield' : 'Net Disbursement Flow'}
            </p>
            <div className="bg-white/5 p-1.5 rounded-2xl flex border border-white/5">
              <button onClick={() => setViewMode('income')} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${viewMode === 'income' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Income</button>
              <button onClick={() => setViewMode('wealth')} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${viewMode === 'wealth' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Wealth</button>
            </div>
          </div>

          {viewMode === 'income' ? (
            <>
              <h2 className="text-5xl font-bold tracking-tighter mb-10">{formatCurrency(stats.totalGross)}</h2>
              <div className="grid grid-cols-2 gap-10 border-t border-white/10 pt-10">
                <div onClick={() => setActiveInfo('assets')} className="cursor-help">
                  <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net Flow</p>
                  <p className="text-2xl font-semibold tracking-tight">{formatCurrency(stats.totalNet)}</p>
                </div>
                <div onClick={() => setActiveInfo('keepRate')} className="cursor-help">
                  <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1">Leakage</p>
                  <p className="text-2xl font-semibold tracking-tight">-{formatCurrency(stats.totalDeductions)}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <div className="h-44 w-full relative min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <PieChart>
                    <Pie data={disbursementTotals} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}>
                      {disbursementTotals.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Disbursement Table */}
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th 
                        onClick={() => handleSort('name')}
                        className="p-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Bank Channel</span>
                          {sortConfig.key === 'name' && (
                            <span className="text-indigo-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('total')}
                        className="p-4 text-right text-[9px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Total Flow</span>
                          {sortConfig.key === 'total' && (
                            <span className="text-indigo-400">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {disbursementTotals.map((d, i) => (
                      <tr key={`${d.name}-${d.account}`} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                            <div className="truncate">
                              <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">{d.name}</p>
                              <p className="text-[9px] text-slate-500 font-medium">**** {d.account.slice(-4)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <p className="text-[11px] font-bold text-indigo-400 group-hover:scale-105 origin-right transition-transform">{formatCurrency(d.total, true)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] -mr-40 -mt-40"></div>
      </div>

      {/* Visual Analytics Card */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mx-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 px-2">
          {viewMode === 'income' ? 'Historic Income Velocity' : 'Distribution Trajectory'}
        </h3>
        <div className="h-64 w-full relative min-w-0">
          <ResponsiveContainer width="100%" height="100%" debounce={100}>
            {viewMode === 'income' ? (
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                <Bar dataKey="gross" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={14} />
                <Bar dataKey="net" fill="#10b981" radius={[8, 8, 0, 0]} barSize={14} />
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#cbd5e1'}} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '10px' }} />
                {uniqueChannels.map((channel, i) => (
                  <Area key={channel} type="monotone" dataKey={channel} stackId="1" stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.6} strokeWidth={2} />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Actions */}
      <div className="px-4 grid grid-cols-2 gap-4">
        <button onClick={() => storageService.exportData()} className="py-5 bg-slate-900 text-white rounded-[1.8rem] text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-200">Archive Export</button>
        <button onClick={() => fileInputRef.current?.click()} className="py-5 bg-white text-slate-600 rounded-[1.8rem] text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all border border-slate-100 shadow-sm">Restore Data</button>
      </div>
    </div>
  );
};

export default Dashboard;
