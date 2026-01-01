
import React, { useEffect, useRef } from 'react';

interface Log {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'thinking';
}

interface TerminalProps {
  logs: Log[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black/95 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
        </div>
        <span className="text-[10px] font-black mono text-slate-500 tracking-[0.2em] uppercase">Tactical Console</span>
      </div>
      <div 
        ref={scrollRef}
        className="h-48 overflow-y-auto p-4 mono text-[11px] space-y-1.5 scroll-smooth no-scrollbar"
      >
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-3 animate-in fade-in duration-300">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={
              log.type === 'success' ? 'text-emerald-500 font-bold' :
              log.type === 'error' ? 'text-rose-500' :
              log.type === 'thinking' ? 'text-indigo-400 italic' :
              'text-slate-400'
            }>
              {log.type === 'thinking' ? '>> ' : '> '}{log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terminal;
