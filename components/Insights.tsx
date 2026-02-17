
import React, { useState, useEffect, useMemo } from 'react';
import { FinancialEntry } from '../types';
import { geminiService } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InsightsProps {
  entries: FinancialEntry[];
}

const Insights: React.FC<InsightsProps> = ({ entries }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (entries.length === 0) return;
      setLoading(true);
      try {
        const text = await geminiService.getFinancialInsights(entries);
        setInsights(text);
      } catch (err) {
        setInsights("Career analysis engine paused. Retrying connectivity...");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [entries]);

  const currency = entries[0]?.currency || 'USD';

  const analysis = useMemo(() => {
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sorted[sorted.length - 1];
    const first = sorted[0];
    
    // Efficiency calculation
    const retentionRate = (entries.reduce((a, b) => a + b.amount, 0) / entries.reduce((a, b) => a + (b.grossAmount || b.amount), 0) * 100);
    const hourlyRate = entries.filter(e => (e.workedHours || 0) > 0).length 
      ? entries.filter(e => (e.workedHours || 0) > 0).reduce((acc, e) => acc + ((e.grossAmount || 0) / (e.workedHours || 1)), 0) / entries.filter(e => (e.workedHours || 0) > 0).length
      : 0;

    // Projection calculation (Hypothetical career target)
    // Assume 35 years of work total if not enough data
    const monthsDiff = (new Date(latest.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const avgMonthlyGross = entries.reduce((a, b) => a + (b.grossAmount || b.amount), 0) / (monthsDiff || 1);
    const lifetimeProjection = avgMonthlyGross * 12 * 35; // 35 year career estimate

    const hourlyTrendData = sorted.map(e => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short' }),
      hourly: (e.workedHours || 0) > 0 ? (e.grossAmount || e.amount) / e.workedHours : 0
    })).slice(-12);

    return { retentionRate, hourlyRate, lifetimeProjection, hourlyTrendData, latest };
  }, [entries]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency,
      maximumFractionDigits: 0,
      notation: val > 999999 ? 'compact' : 'standard'
    }).format(val);
  };

  return (
    <div className="space-y-6 pb-24 px-2">
      {/* High-Level Scorecard */}
      <div className="bg-slate-900 rounded-[2.8rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-8 tracking-tight">Career Scorecard</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-sm">
               <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-[0.2em] mb-2">Efficiency</p>
               <p className="text-2xl font-bold tracking-tight">{(analysis?.hourlyRate || 0).toFixed(2)}</p>
               <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{currency}/hr value</p>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-sm">
               <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-[0.2em] mb-2">Keep Grade</p>
               <p className="text-2xl font-bold tracking-tight">{(analysis?.retentionRate || 0).toFixed(0)}%</p>
               <span className={`text-[8px] font-bold px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-widest ${analysis?.retentionRate && analysis.retentionRate > 75 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {analysis?.retentionRate && analysis.retentionRate > 75 ? 'Optimal' : 'Leakage'}
               </span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-[100px]"></div>
      </div>

      {/* Projection & Target Engine */}
      {analysis && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Wealth Velocity Projection</h4>
            <span className="text-[8px] font-bold bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full uppercase tracking-widest">35Y Forecast</span>
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-3xl font-bold text-slate-900 tracking-tighter">{formatCurrency(analysis.lifetimeProjection)}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Est. Lifetime Gross Yield</p>
            </div>
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
               </svg>
            </div>
          </div>

          <div className="h-44 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={analysis.hourlyTrendData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#cbd5e1'}} />
                 <YAxis hide />
                 <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '10px'}} />
                 <Area type="monotone" dataKey="hourly" stroke="#6366f1" fill="#6366f1" fillOpacity={0.05} strokeWidth={3} />
               </AreaChart>
             </ResponsiveContainer>
             <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">Labor Value Momentum (L12M)</p>
          </div>
        </div>
      )}

      {/* Strategic AI Insights */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-50 min-h-[400px]">
        <div className="flex items-center justify-between mb-10">
           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Strategic Audit (Gemini)</h4>
           <div className="flex space-x-1.5">
              <div className="w-2 h-2 bg-indigo-200 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:150ms]"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse [animation-delay:300ms]"></div>
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-6 py-24">
            <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.3em] animate-pulse">Analyzing Trajectory...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 opacity-40">
             <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Archival History Required</p>
          </div>
        ) : (
          <div className="space-y-10">
            {insights.split('\n').filter(l => l.trim()).slice(0, 4).map((line, i) => (
              <div key={i} className="flex space-x-6 group">
                <div className="shrink-0 mt-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full group-hover:scale-150 group-hover:bg-indigo-600 transition-all duration-300"></div>
                </div>
                <p className="text-slate-700 text-sm leading-[1.7] font-medium">
                  {line.replace(/^[*-\s\d.]+\s*/, '')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 bg-indigo-50/50 rounded-[2.2rem] border border-indigo-100 text-center">
        <p className="text-[10px] text-indigo-500 leading-relaxed font-bold uppercase tracking-[0.15em]">
          Strategy Focus: Maximize "Hourly Value" while maintaining a "Keep Grade" above 80% to accelerate lifetime wealth targets.
        </p>
      </div>
    </div>
  );
};

export default Insights;
