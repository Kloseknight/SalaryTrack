
import React, { useState, useEffect, useMemo } from 'react';
import { FinancialEntry, LineItem } from '../types';
import { geminiService } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface InsightsProps {
  entries: FinancialEntry[];
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899'];

const Insights: React.FC<InsightsProps> = ({ entries }) => {
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'1Y' | 'YTD' | 'ALL' | string>('1Y');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    entries.forEach(e => {
      const year = new Date(e.date).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    return [...entries].filter(e => {
      const date = new Date(e.date);
      const year = date.getFullYear();
      if (timeframe === '1Y') {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 12);
        return date >= twelveMonthsAgo;
      } else if (timeframe === 'YTD') {
        return year === currentYear;
      } else if (timeframe !== 'ALL') {
        return year.toString() === timeframe;
      }
      return true;
    });
  }, [entries, timeframe]);

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
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
  };

  const allItemNames = useMemo(() => {
    const names = new Set<string>();
    entries.forEach(e => {
      e.lineItems?.forEach(li => names.add(li.name));
    });
    return Array.from(names).sort();
  }, [entries]);

  useEffect(() => {
    if (allItemNames.length > 0 && !selectedItemName) {
      setSelectedItemName(allItemNames[0]);
    }
  }, [allItemNames]);

  const compositionData = useMemo(() => {
    const totals = filteredEntries.reduce((acc, e) => ({
      net: acc.net + e.amount,
      tax: acc.tax + (e.tax || 0),
      deductions: acc.deductions + (e.deductions || 0)
    }), { net: 0, tax: 0, deductions: 0 });

    return [
      { name: 'Net Take-Home', value: totals.net },
      { name: 'Tax Withheld', value: totals.tax },
      { name: 'Other Deductions', value: totals.deductions }
    ].filter(d => d.value > 0);
  }, [filteredEntries]);

  const yearlySummary = useMemo(() => {
    const years: Record<string, { gross: number, net: number }> = {};
    entries.forEach(e => {
      const y = new Date(e.date).getFullYear().toString();
      if (!years[y]) years[y] = { gross: 0, net: 0 };
      years[y].gross += e.grossAmount || 0;
      years[y].net += e.amount;
    });

    const sortedYears = Object.keys(years).sort().map(y => ({
      year: y,
      ...years[y]
    }));

    return sortedYears.map((curr, idx) => {
      const prev = sortedYears[idx - 1];
      const growth = prev ? ((curr.gross - prev.gross) / prev.gross) * 100 : 0;
      return { ...curr, growth };
    });
  }, [entries]);

  const selectedItemHistory = useMemo(() => {
    if (!selectedItemName) return [];
    return filteredEntries
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => {
        const item = e.lineItems?.find(li => li.name === selectedItemName);
        return {
          date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          amount: item?.amount || 0,
          type: item?.type || 'earning'
        };
      });
  }, [selectedItemName, filteredEntries]);

  const selectedItemTotal = useMemo(() => {
    return selectedItemHistory.reduce((acc, curr) => acc + curr.amount, 0);
  }, [selectedItemHistory]);

  const disbursementStats = useMemo(() => {
    const stats: Record<string, { bankName: string, bankCode: string, accountNo: string, total: number }> = {};
    entries.forEach(e => {
      e.disbursements?.forEach(d => {
        const key = `${d.bankCode}-${d.accountNo}`;
        if (!stats[key]) {
          stats[key] = { bankName: d.bankName, bankCode: d.bankCode, accountNo: d.accountNo, total: 0 };
        }
        stats[key].total += d.amount;
      });
    });
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [entries]);

  const displayedHistory = useMemo(() => {
    const reversed = [...selectedItemHistory].reverse();
    return showAllHistory ? reversed : reversed.slice(0, 5);
  }, [selectedItemHistory, showAllHistory]);

  return (
    <div className="space-y-8 pb-24 px-1 animate-in fade-in duration-600">
      {/* Item Progression Tracker - Expanded Visuals */}
      <div className="bg-white rounded-[2.8rem] p-10 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col space-y-2">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em]">Item Progression</h4>
            <div className="flex items-baseline space-x-4">
              <select 
                value={selectedItemName}
                onChange={(e) => setSelectedItemName(e.target.value)}
                className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none min-w-[250px]"
              >
                {allItemNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <div className="hidden sm:block">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Period Total</p>
                <p className="text-xl font-black text-indigo-600 tracking-tight">{formatCurrency(selectedItemTotal)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-4">
            <div className="flex items-center space-x-2 self-end md:self-auto">
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
            <div className="sm:hidden text-right">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Period Total</p>
              <p className="text-lg font-black text-indigo-600 tracking-tight">{formatCurrency(selectedItemTotal)}</p>
            </div>
          </div>
        </div>

        {selectedItemName && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <LineChart data={selectedItemHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#cbd5e1', fontWeight: 500}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold', padding: '12px' }}
                    formatter={(value: number | undefined) => [formatCurrency(value || 0), 'Recorded Value']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner h-fit">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100/80">
                    <th className="p-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Pay Period</th>
                    <th className="p-5 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedHistory.map((h, i) => (
                    <tr key={i} className="hover:bg-white transition-colors">
                      <td className="p-5 text-xs font-bold text-slate-700">{h.date}</td>
                      <td className={`p-5 text-right text-xs font-extrabold ${h.type === 'deduction' ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {formatCurrency(h.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedItemHistory.length > 5 && (
                <button 
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full py-4 bg-slate-100/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  {showAllHistory ? 'Show Less' : `Show All (${selectedItemHistory.length})`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Earnings Composition Analysis */}
        <div className="bg-white rounded-[2.8rem] p-10 shadow-sm border border-slate-100 flex flex-col">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em] mb-10">Earnings Composition</h4>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-64 w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number | undefined) => formatCurrency(value || 0)}
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {compositionData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Yearly Growth Summary */}
        <div className="bg-white rounded-[2.8rem] p-10 shadow-sm border border-slate-100">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em] mb-10">Yearly Trajectory</h4>
          <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100/80">
                  <th className="p-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Year</th>
                  <th className="p-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Gross Total</th>
                  <th className="p-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yearlySummary.slice().reverse().map((y, i) => (
                  <tr key={i} className="hover:bg-white transition-colors">
                    <td className="p-5 text-xs font-bold text-slate-700">{y.year}</td>
                    <td className="p-5 text-right text-xs font-extrabold text-slate-800">{formatCurrency(y.gross)}</td>
                    <td className={`p-5 text-right text-xs font-extrabold ${y.growth >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {y.growth > 0 ? '+' : ''}{y.growth.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Disbursement Analysis Card */}
      <div className="bg-white rounded-[2.8rem] p-10 shadow-sm border border-slate-100">
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em] mb-10">Disbursement Channels</h4>
        <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100/80">
                <th className="p-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Bank / Account</th>
                <th className="p-5 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Lifetime Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {disbursementStats.map((d, i) => (
                <tr key={i} className="hover:bg-white transition-colors">
                  <td className="p-5">
                    <p className="text-xs font-bold text-slate-700">{d.bankName}</p>
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{d.bankCode} • {d.accountNo}</p>
                  </td>
                  <td className="p-5 text-right text-xs font-extrabold text-indigo-600">
                    {formatCurrency(d.total)}
                  </td>
                </tr>
              ))}
              {disbursementStats.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-10 text-center text-xs text-slate-400 italic">No disbursement data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Insights;
