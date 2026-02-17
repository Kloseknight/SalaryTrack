
import React, { useState, useEffect } from 'react';
import { FinancialEntry } from '../types';
import { geminiService } from '../services/geminiService';

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
        setInsights("Unable to generate insights at this moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [entries]);

  const retentionRate = entries.length > 0 ? (entries.reduce((a, b) => a + b.amount, 0) / entries.reduce((a, b) => a + (b.grossAmount || b.amount), 0) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2 tracking-tight">Wealth Advisor</h3>
          <p className="text-slate-400 text-sm leading-relaxed">AI analysis of your career earnings, deductions, and labor efficiency.</p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-50 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processing Career Data...</p>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-slate-400 py-10">Add salary slips to unlock lifetime growth analysis.</p>
        ) : (
          <div className="prose prose-sm prose-slate">
            <div className="whitespace-pre-wrap text-slate-600 leading-relaxed font-medium">
              {insights.split('\n').map((line, i) => {
                if (line.startsWith('*') || line.startsWith('-')) {
                  return (
                    <div key={i} className="flex space-x-4 mb-6 group">
                      <div className="shrink-0 mt-1">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform"></div>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{line.replace(/^[*-\s]+/, '')}</p>
                    </div>
                  );
                }
                return line.trim() ? <p key={i} className="mb-6 text-slate-700 font-bold">{line}</p> : null;
              })}
            </div>
          </div>
        )}
      </div>

      {!loading && entries.length > 0 && (
        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-start space-x-4">
          <div className="shrink-0 text-emerald-600 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest mb-1">Retention Insight</p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              On average, you keep <strong>{retentionRate}%</strong> of your gross salary after all deductions. Your tracking history is safely archived locally in your Portfolio.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;
