
import React from 'react';
import { AppView } from '../types';
import { 
  LayoutDashboard, 
  BarChart3, 
  MessageSquare, 
  TrendingUp, 
  ShieldAlert,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, icon: LayoutDashboard, label: 'Terminal' },
    { id: AppView.ANALYSIS, icon: BarChart3, label: 'Analysis' },
    { id: AppView.SENTIMENT, icon: TrendingUp, label: 'Market' },
    { id: AppView.CHAT, icon: MessageSquare, label: 'Advisor' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800 flex-col h-full overflow-hidden shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">NEXUS PRO</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  currentView === item.id 
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-200 w-full rounded-xl transition-colors">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
          <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Institutional Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-300">Active Node</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-2 z-[100]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              currentView === item.id ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <item.icon size={20} className={currentView === item.id ? 'scale-110' : ''} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default Sidebar;
