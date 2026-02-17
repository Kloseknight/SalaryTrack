
import { FinancialEntry } from '../types';

const STORAGE_KEY = 'financial_track_data_v2';

export const storageService = {
  getEntries: (): FinancialEntry[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  saveEntry: (entry: FinancialEntry) => {
    const entries = storageService.getEntries();
    const updated = [...entries, entry].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  deleteEntry: (id: string) => {
    const entries = storageService.getEntries();
    const updated = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  exportData: () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  importData: (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        localStorage.setItem(STORAGE_KEY, jsonData);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
