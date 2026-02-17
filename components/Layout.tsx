
import React from 'react';
import { AppView } from '../types';

interface LayoutProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeView, onViewChange, children }) => {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative overflow-hidden">
      {/* Header with iOS Safe Area */}
      <header className="safe-top bg-white/50 backdrop-blur-md border-b border-slate-100 shrink-0 sticky top-0 z-20">
        <div className="pt-8 pb-4 px-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">
            {activeView === 'dashboard' && 'Portfolio'}
            {activeView === 'history' && 'Activity'}
            {activeView === 'add' && 'Entry'}
            {activeView === 'insights' && 'Analysis'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32 px-4 pt-6 scrollbar-hide min-w-0">
        {children}
      </main>

      {/* Bottom Navigation with iOS Safe Area Padding */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 z-30 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-20">
          <button 
            onClick={() => onViewChange('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${activeView === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Dashboard</span>
          </button>
          
          <button 
            onClick={() => onViewChange('history')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${activeView === 'history' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Ledger</span>
          </button>

          <button 
            onClick={() => onViewChange('add')}
            className="flex flex-col items-center justify-center w-full h-full relative"
          >
            <div className={`p-4 rounded-3xl absolute -top-8 shadow-2xl transition-all ${activeView === 'add' ? 'bg-indigo-600 rotate-45' : 'bg-slate-900 shadow-slate-200'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className={`text-[9px] mt-8 font-bold uppercase tracking-widest ${activeView === 'add' ? 'text-indigo-600' : 'text-slate-300'}`}>Log</span>
          </button>

          <button 
            onClick={() => onViewChange('insights')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all ${activeView === 'insights' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM5.884 6.924a1 1 0 101.414-1.414l-.707-.707a1 1 0 10-1.414 1.414l.707.707zM18 11a1 1 0 100-2h-1a1 1 0 100 2h1zM12.828 15.757a1 1 0 10-1.414 1.414l.707.707a1 1 0 101.414-1.414l-.707-.707zM6.924 18.116a1 1 0 101.414-1.414l-.707-.707a1 1 0 10-1.414 1.414l.707.707zM3 11a1 1 0 100-2H2a1 1 0 100 2h1zM14.116 6.924l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414zM11 19v-1a1 1 0 10-2 0v1a1 1 0 102 0z" />
            </svg>
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest">Wealth</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
