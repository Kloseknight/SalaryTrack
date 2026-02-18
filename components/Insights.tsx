
import React, { useState, useEffect, useMemo } from 'react';
import { FinancialEntry, LineItem } from '../types';
import { geminiService } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface InsightsProps {
  entries: FinancialEntry[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Insights: React.FC<InsightsProps> = ({ entries }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedItemName, setSelectedItemName] = useState<string>('');

  useEffect(() => {
    const fetchInsights = async () => {
      if (entries.length === 0) return;
      setLoading(true);
      try {
        const text = await geminiService.getFinancialInsights(entries);
        setInsights(text);
      } catch (err) {
        setInsights("Career analysis currently unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
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

  const selectedItemHistory = useMemo(() => {
    if (!selectedItemName) return [];
    return [...entries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => {
        const item = e.lineItems?.find(li => li.name === selectedItemName);
        return {
          date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          amount: item?.amount || 0,
          type: item?.type || 'earning'
        };
      });
  }, [selectedItemName, entries]);

  if (entries.length === 0) {
    return (
      <div className="py-32 text-center opacity-40 min-h-[60vh] flex flex-col justify-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Historical Data Required</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 px-1 animate-in fade-in duration-600">
      {/* Item Progression Tracker - Expanded Visuals */}
      <div className="bg-white rounded-[2.8rem] p-10 shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
        <div className="flex flex-col space-y-6 mb-12">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em]">Item Progression</h4>
            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">Growth Engine</span>
          </div>
          <select 
            value={selectedItemName}
            onChange={(e) => setSelectedItemName(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
          >
            {allItemNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {selectedItemName && (
          <div className="flex-1 flex flex-col space-y-12">
            <div className="h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <LineChart data={selectedItemHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#cbd5e1', fontWeight: 500}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold', padding: '12px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Recorded Value']}
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

            <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100/80">
                    <th className="p-5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Pay Period</th>
                    <th className="p-5 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedItemHistory.slice().reverse().map((h, i) => (
                    <tr key={i} className="hover:bg-white transition-colors">
                      <td className="p-5 text-xs font-bold text-slate-700">{h.date}</td>
                      <td className={`p-5 text-right text-xs font-extrabold ${h.type === 'deduction' ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {formatCurrency(h.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Card - Flexible Height */}
      <div className="bg-white rounded-[2.8rem] p-12 shadow-sm border border-slate-100 min-h-[400px] flex flex-col">
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.3em] mb-12">Professional Audit</h4>
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-[0.3em] animate-pulse">Running Career Audit...</p>
          </div>
        ) : (
          <div className="space-y-10 flex-1">
            {insights.split('\n').filter(l => l.trim()).map((line, i) => (
              <div key={i} className="flex gap-6 group">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0 group-hover:scale-150 transition-all duration-300"></div>
                <p className="text-slate-700 text-[15px] leading-relaxed font-medium">{line.replace(/^[*-\s\d.]+\s*/, '')}</p>
              </div>
            ))}
            {insights.length === 0 && (
              <div className="flex-1 flex items-center justify-center opacity-30 italic text-sm">Waiting for trajectory data...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Insights;
