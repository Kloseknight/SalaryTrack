
import React, { useState, useEffect } from 'react';
import { FinancialEntry, AppView } from './types';
import { storageService } from './services/storageService';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Scanner from './components/Scanner';
import Insights from './components/Insights';

const App: React.FC = () => {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  const refreshData = () => {
    setEntries(storageService.getEntries());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddEntry = (entry: FinancialEntry) => {
    storageService.saveEntry(entry);
    refreshData();
    setActiveView('dashboard');
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm("Delete this entry forever?")) {
      storageService.deleteEntry(id);
      refreshData();
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {activeView === 'dashboard' && <Dashboard entries={entries} onDataRefresh={refreshData} />}
      {activeView === 'history' && <History entries={entries} onDelete={handleDeleteEntry} />}
      {activeView === 'add' && <Scanner onEntryAdded={handleAddEntry} />}
      {activeView === 'insights' && <Insights entries={entries} />}
    </Layout>
  );
};

export default App;
