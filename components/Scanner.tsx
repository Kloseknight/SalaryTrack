
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
    workedHours: 0,
    ytdGross: 0,
    ytdNet: 0,
    lineItems: [],
    disbursements: []
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const mimeType = file.type;
      
      setLoading(true);
      try {
        const extracted = await geminiService.extractSalaryFromImage(base64, mimeType);
        setForm(prev => ({
          ...prev,
          ...extracted,
          category: 'Salary'
        }));
      } catch (err) {
        alert("Extraction failed. Please check the file format.");
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
      alert("Please fill in basic details.");
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
      workedHours: Number(form.workedHours || 0),
      ytdGross: Number(form.ytdGross || 0),
      ytdNet: Number(form.ytdNet || 0),
      lineItems: form.lineItems || [],
      disbursements: form.disbursements || []
    };

    onEntryAdded(newEntry);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 px-2 text-center">Scan Salary Document</h3>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-12 border-2 border-dashed border-indigo-100 rounded-3xl flex flex-col items-center justify-center space-y-4 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
        >
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">Upload Pay Stub</p>
            <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Supports PDF or Photo</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="application/pdf,image/*" 
            className="hidden" 
          />
        </button>
        {loading && (
          <div className="mt-8 flex flex-col items-center space-y-3">
             <div className="flex space-x-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
             </div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">AI Digitizing Document</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8 pb-12">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payroll Verification</h3>
          {form.source && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold uppercase tracking-tighter">Verified</span>}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Employer / Institution</label>
            <input 
              value={form.source} 
              onChange={e => setForm({...form, source: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 focus:outline-none font-bold"
              placeholder="e.g. Acme Corp Ltd"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Job Description</label>
              <input 
                value={form.jobTitle || ''} 
                onChange={e => setForm({...form, jobTitle: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 focus:outline-none text-xs font-semibold"
                placeholder="Job Role"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Department</label>
              <input 
                value={form.department || ''} 
                onChange={e => setForm({...form, department: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 focus:outline-none text-xs font-semibold"
                placeholder="Business Unit"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
             <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Net Take-Home Pay</label>
             <input 
              type="number"
              value={form.amount || ''} 
              onChange={e => setForm({...form, amount: Number(e.target.value)})}
              className="w-full bg-transparent text-4xl font-bold text-indigo-600 focus:outline-none placeholder-indigo-200"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Total Gross</label>
              <input 
                type="number"
                value={form.grossAmount || ''} 
                onChange={e => setForm({...form, grossAmount: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 focus:outline-none font-bold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest ml-1 mb-2 block">Total Deductions</label>
              <input 
                type="number"
                value={(form.tax || 0) + (form.deductions || 0) || ''} 
                onChange={e => setForm({...form, deductions: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-rose-600 focus:outline-none font-bold"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Detailed Line Items with Editing */}
        <div className="space-y-3 bg-slate-50/30 p-5 rounded-[2rem] border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Every Line Item</h4>
            <button 
              type="button"
              onClick={addManualLineItem}
              className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-3 py-1 rounded-full"
            >
              + Add Item
            </button>
          </div>
          <div className="space-y-4">
            {form.lineItems?.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                   <input 
                      className="text-xs font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 w-2/3"
                      value={item.name}
                      onChange={(e) => updateLineItem(idx, 'name', e.target.value)}
                   />
                   <button onClick={() => removeLineItem(idx)} className="text-slate-300 hover:text-rose-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                   </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <select 
                      value={item.type}
                      onChange={(e) => updateLineItem(idx, 'type', e.target.value)}
                      className="text-[8px] uppercase font-bold text-slate-400 bg-slate-50 border-none rounded-lg py-1 px-2"
                    >
                      <option value="earning">Earning</option>
                      <option value="deduction">Deduction</option>
                      <option value="benefit">Benefit</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-slate-300">$</span>
                    <input 
                      type="number"
                      className={`text-xs font-bold text-right bg-transparent border-none p-0 focus:ring-0 w-20 ${item.type === 'earning' ? 'text-emerald-600' : 'text-rose-500'}`}
                      value={item.amount}
                      onChange={(e) => updateLineItem(idx, 'amount', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!form.lineItems || form.lineItems.length === 0) && (
              <p className="text-[9px] text-slate-300 italic text-center py-4">No line items extracted. Add manually to ensure perfect tracking.</p>
            )}
          </div>
        </div>

        {form.disbursements && form.disbursements.length > 0 && (
          <div className="space-y-3 bg-indigo-50/30 p-5 rounded-[2rem] border border-indigo-100/50">
             <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1">Payment Destinations</h4>
             <div className="space-y-2">
               {form.disbursements.map((d, i) => (
                 <div key={i} className="flex justify-between items-center text-[11px]">
                   <div className="flex flex-col">
                    <span className="font-bold text-slate-600">{d.bankName}</span>
                    <span className="text-[9px] text-slate-400">#{d.accountNo}</span>
                   </div>
                   <span className="text-indigo-600 font-bold">${d.amount.toLocaleString()}</span>
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Period End Date</label>
            <input 
              type="date"
              value={form.date} 
              onChange={e => setForm({...form, date: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 focus:outline-none text-xs font-bold"
            />
          </div>
          <div>
             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Total Hours</label>
              <input 
                type="number"
                value={form.workedHours || ''} 
                onChange={e => setForm({...form, workedHours: Number(e.target.value)})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 focus:outline-none font-bold"
                placeholder="0"
              />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-bold text-lg shadow-2xl shadow-indigo-200 active:scale-[0.98] transition-all"
        >
          Archive Slip Forever
        </button>
      </form>
    </div>
  );
};

export default AddEntry;
