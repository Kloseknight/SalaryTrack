
import React, { useState, useRef } from 'react';
import { FinancialEntry, LineItem } from '../types';
import { geminiService } from '../services/geminiService';

interface AddEntryProps {
  onEntryAdded: (entry: FinancialEntry) => void;
}

const AddEntry: React.FC<AddEntryProps> = ({ onEntryAdded }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<FinancialEntry>>({
    source: '',
    amount: 0,
    grossAmount: 0,
    tax: 0,
    deductions: 0,
    date: new Date().toISOString().split('T')[0],
    currency: 'USD',
    jobTitle: '',
    department: '',
    lineItems: []
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setLoading(true);
      try {
        const extracted = await geminiService.extractSalaryFromImage(base64, file.type);
        setForm(prev => ({ ...prev, ...extracted }));
      } catch (err) {
        alert("Digitization failed. Please check the file.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addManualLineItem = () => {
    setForm(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), { name: 'New Item', amount: 0, type: 'earning' }]
    }));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...(form.lineItems || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, lineItems: newItems });
  };

  const removeLineItem = (index: number) => {
    setForm({ ...form, lineItems: form.lineItems?.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.source) {
      alert("Please provide the Employer and Net Amount.");
      return;
    }

    const newEntry: FinancialEntry = {
      id: crypto.randomUUID(),
      type: 'income',
      date: form.date!,
      source: form.source!,
      category: 'Salary',
      amount: Number(form.amount),
      grossAmount: Number(form.grossAmount || 0),
      tax: Number(form.tax || 0),
      deductions: Number(form.deductions || 0),
      currency: form.currency || 'USD',
      jobTitle: form.jobTitle,
      department: form.department,
      lineItems: form.lineItems || []
    };

    onEntryAdded(newEntry);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-8 text-center">Digitize Document</h3>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-12 border-2 border-dashed border-indigo-100 rounded-[2rem] flex flex-col items-center justify-center space-y-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Choose Pay Stub</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Image or PDF (Safe Area)</p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf,image/*" className="hidden" />
        </button>
        {loading && (
          <div className="mt-8 flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest animate-pulse">Extracting Data...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.8rem] p-10 shadow-sm border border-slate-100 space-y-8">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Employer Entity</label>
            <input 
              value={form.source} 
              onChange={e => setForm({...form, source: e.target.value})} 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none" 
              placeholder="e.g. Acme Corp"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest ml-1 mb-3 block">Net Take-Home</label>
              <input 
                type="number" 
                value={form.amount || ''} 
                onChange={e => setForm({...form, amount: Number(e.target.value)})} 
                className="w-full px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-sm font-bold outline-none" 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-3 block">Gross Total</label>
              <input 
                type="number" 
                value={form.grossAmount || ''} 
                onChange={e => setForm({...form, grossAmount: Number(e.target.value)})} 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm font-bold outline-none" 
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1 mb-3 block">Tax Withheld</label>
              <input 
                type="number" 
                value={form.tax || ''} 
                onChange={e => setForm({...form, tax: Number(e.target.value)})} 
                className="w-full px-6 py-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm font-bold outline-none" 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-3 block">Other Deductions</label>
              <input 
                type="number" 
                value={form.deductions || ''} 
                onChange={e => setForm({...form, deductions: Number(e.target.value)})} 
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 text-sm font-bold outline-none" 
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Itemized Ledger</h4>
            <button 
              type="button" 
              onClick={addManualLineItem} 
              className="text-[9px] font-bold text-indigo-600 uppercase px-3 py-1.5 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors"
            >
              + Add Entry
            </button>
          </div>
          <div className="space-y-4">
            {form.lineItems?.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between gap-4 border border-slate-100 group">
                <input 
                  value={item.name} 
                  onChange={(e) => updateLineItem(idx, 'name', e.target.value)} 
                  className="bg-transparent border-none p-0 text-xs font-bold text-slate-700 w-full focus:ring-0" 
                />
                <div className="flex items-center gap-3 shrink-0">
                  <input 
                    type="number" 
                    value={item.amount} 
                    onChange={(e) => updateLineItem(idx, 'amount', Number(e.target.value))} 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold w-20 text-right text-slate-600 outline-none" 
                  />
                  <button 
                    onClick={() => removeLineItem(idx)} 
                    className="text-slate-300 hover:text-rose-500 transition-colors text-xl font-light"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full py-6 bg-slate-900 text-white rounded-3xl font-bold text-sm shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
        >
          Submit Entry
        </button>
      </form>
    </div>
  );
};

export default AddEntry;
