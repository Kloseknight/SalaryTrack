
import React, { useState } from 'react';
import { FinancialEntry } from '../types';

interface HistoryProps {
  entries: FinancialEntry[];
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ entries, onDelete }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const formatCurrency = (val: number, currencyCode: string) => {
    // Sanitize currency code
    const getSafeCurrency = (code: string) => {
      if (!code || typeof code !== 'string' || code.length !== 3) return 'USD';
      const upper = code.toUpperCase();
      return /^[A-Z]{3}$/.test(upper) ? upper : 'USD';
    };

    const currency = getSafeCurrency(currencyCode);
    
    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: currency 
      }).format(val);
    } catch (e) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(val);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Salary Ledger</h3>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{entries.length} RECORDS</span>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-[1.5rem] border border-slate-50 shadow-sm overflow-hidden transition-all duration-300">
            <div 
              className="p-5 flex items-center justify-between group cursor-pointer active:bg-slate-50 transition-colors"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center bg-indigo-50 text-indigo-600 font-bold leading-none">
                  <span className="text-[8px] uppercase opacity-70">{new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric' })}</span>
                  <span className="text-[9px] uppercase">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  <span className="text-base">{new Date(entry.date).toLocaleDateString('en-US', { day: 'numeric' })}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{entry.source}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{entry.jobTitle || 'Employment Record'}</p>
                </div>
              </div>
              
              <div className="text-right flex items-center space-x-4">
                <div>
                  <p className="text-sm font-bold text-emerald-600">
                    +{formatCurrency(entry.amount, entry.currency)}
                  </p>
                  <p className="text-[9px] text-slate-300 font-bold uppercase">Net Amount</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  className="p-2 text-slate-200 hover:text-rose-500 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {expandedId === entry.id && (
              <div className="px-5 pb-8 pt-2 border-t border-slate-50 bg-slate-50/30 space-y-6 animate-in slide-in-from-top-2">
                {/* Summary Header */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Gross</p>
                    <p className="text-[10px] font-bold text-slate-700">{formatCurrency(entry.grossAmount || 0, entry.currency)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-bold text-rose-400 uppercase tracking-widest mb-1">Deductions</p>
                    <p className="text-[10px] font-bold text-rose-600">-{formatCurrency((entry.tax || 0) + (entry.deductions || 0), entry.currency)}</p>
                  </div>
                   <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Benefits</p>
                    <p className="text-[10px] font-bold text-indigo-600">{formatCurrency(entry.totalBenefits || 0, entry.currency)}</p>
                  </div>
                </div>

                {/* EVERY Line Item */}
                {entry.lineItems && entry.lineItems.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Complete Payroll Breakdown</h4>
                    <div className="space-y-3">
                      {entry.lineItems.map((li, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                          <div>
                            <p className="font-bold text-slate-800">{li.name}</p>
                            <p className="text-[8px] text-slate-400 uppercase tracking-wider">{li.type}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${li.type === 'earning' ? 'text-emerald-600' : li.type === 'benefit' ? 'text-indigo-600' : 'text-rose-500'}`}>
                              {li.type === 'earning' ? '+' : li.type === 'benefit' ? '+' : '-'}{formatCurrency(Math.abs(li.amount), entry.currency)}
                            </p>
                            {li.ytd && <p className="text-[8px] text-slate-300">YTD: {formatCurrency(li.ytd, entry.currency)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disbursement Table */}
                {entry.disbursements && entry.disbursements.length > 0 && (
                  <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                    <h4 className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Disbursement Channels</h4>
                    <div className="space-y-3">
                      {entry.disbursements.map((d, i) => (
                        <div key={i} className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-slate-800">{d.bankName}</p>
                            <p className="text-[8px] text-slate-400 uppercase">Code: {d.bankCode} • Acc: {d.accountNo}</p>
                          </div>
                          <p className="text-xs font-bold text-indigo-600">{formatCurrency(d.amount, entry.currency)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center px-2">
                  <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">System Ref: {entry.id.slice(0,12)}</p>
                  <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">{entry.department || 'General'}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {entries.length === 0 && (
          <div className="py-24 text-center text-slate-400 text-sm italic">No salary records archived.</div>
        )}
      </div>
    </div>
  );
};

export default History;
