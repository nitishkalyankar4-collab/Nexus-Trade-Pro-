
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Target, Zap, BarChart, ShieldCheck, AlertTriangle, TrendingUp, DollarSign, Clock, Layers, Crosshair, MapPin, Activity } from 'lucide-react';

interface AnalysisDisplayProps {
  content: string;
  loading: boolean;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ content, loading }) => {
  // Parse ICT Data Packet
  const { cleanContent, ictData } = useMemo(() => {
    if (!content) return { cleanContent: '', ictData: null };

    const packetStart = content.indexOf('---ICT_DATA_PACKET---');
    if (packetStart === -1) return { cleanContent: content, ictData: null };

    const clean = content.substring(0, packetStart);
    const packet = content.substring(packetStart);

    const data = {
      session: 'WAITING',
      phase: 'ANALYZING',
      killzone: 'INACTIVE',
      levels: [] as { label: string; price: string }[]
    };

    // Case-insensitive regex matching
    const sessionMatch = packet.match(/SESSION:\s*(.*)/i);
    if (sessionMatch) data.session = sessionMatch[1].trim();

    const phaseMatch = packet.match(/PHASE:\s*(.*)/i);
    if (phaseMatch) data.phase = phaseMatch[1].trim();
    
    const kzMatch = packet.match(/KILLZONE:\s*(.*)/i);
    if (kzMatch) data.killzone = kzMatch[1].trim();

    const levelRegex = /LEVEL:\s*\[(.*?)\]\s*\|\s*\[(.*?)\]/gi;
    let match;
    while ((match = levelRegex.exec(packet)) !== null) {
      data.levels.push({ label: match[1], price: match[2] });
    }

    return { cleanContent: clean, ictData: data };
  }, [content]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 md:py-32 animate-pulse text-center">
        <div className="relative mb-8">
          <div className="w-20 md:w-24 h-20 md:h-24 border-4 border-indigo-500/10 rounded-full"></div>
          <div className="w-20 md:w-24 h-20 md:h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          <Zap className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={32} />
        </div>
        <p className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-[10px] md:text-sm mb-2">Institutional Engine Active</p>
        <p className="text-slate-500 text-[9px] md:text-xs tracking-widest uppercase">Calibrating Time & Price Matrices...</p>
      </div>
    );
  }

  if (!cleanContent) return null;

  const isAccumulation = ictData?.phase.toUpperCase().includes('ACCUMULATION');
  const isManipulation = ictData?.phase.toUpperCase().includes('MANIPULATION');
  const isDistribution = ictData?.phase.toUpperCase().includes('DISTRIBUTION');

  return (
    <div className="prose prose-invert prose-slate max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="border-2 border-slate-800/60 bg-slate-900/40 rounded-2xl md:rounded-3xl p-6 md:p-12 shadow-2xl overflow-hidden relative backdrop-blur-md">
        
        {/* Institutional Watermark */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none hidden md:block">
           <ShieldCheck size={400} />
        </div>

        {/* LIVE MARKET STATE DASHBOARD */}
        {ictData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            
            {/* Column 1: Session & Phase */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock size={60} />
               </div>
               <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Clock size={12} /> Chart Session State (NY Time)
                  </div>
                  <div className="text-xl md:text-2xl font-black text-white tracking-tight">{ictData.session}</div>
               </div>
               <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Activity size={12} /> Algo Phase (AMD)
                  </div>
                  <div className={`text-xl md:text-2xl font-black tracking-tight ${
                    isAccumulation ? 'text-amber-400' :
                    isManipulation ? 'text-rose-400' :
                    isDistribution ? 'text-emerald-400' : 'text-indigo-400'
                  }`}>
                    {ictData.phase}
                  </div>
               </div>
               <div className="mt-auto pt-4 border-t border-slate-800/50">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-bold text-slate-500 uppercase">Killzone Status</span>
                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                       ictData.killzone.toUpperCase().includes('INACTIVE') ? 'bg-slate-800 text-slate-400' : 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30'
                     }`}>
                       {ictData.killzone}
                     </span>
                  </div>
               </div>
            </div>

            {/* Column 2: Key Institutional Levels */}
            <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
               <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <Crosshair size={16} className="text-emerald-500" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Key Institutional Reference Points (OCR)</span>
               </div>
               
               {ictData.levels.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ictData.levels.map((lvl, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/80 p-3 rounded-lg border border-slate-800 hover:border-indigo-500/30 transition-colors">
                        <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2">
                           <MapPin size={10} className="text-slate-600" />
                           {lvl.label}
                        </span>
                        <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                           {lvl.price}
                        </span>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-24 text-slate-600 text-xs font-medium italic border border-dashed border-slate-800 rounded-lg">
                    No verified institutional levels detected in visual scan.
                 </div>
               )}
            </div>
          </div>
        )}

        {/* Content Render */}
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl md:text-5xl font-black text-white mb-8 md:mb-10 tracking-tighter border-b border-slate-800 pb-6 flex items-center gap-4">
                <Target className="text-indigo-500 shrink-0" size={36} />
                <span className="leading-tight">{children}</span>
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base md:text-xl font-black text-indigo-400 mt-12 md:mt-16 mb-6 flex items-center gap-3 uppercase tracking-widest border-l-4 border-indigo-500 pl-4 bg-indigo-500/5 py-2 rounded-r-lg">
                <TrendingUp size={20} className="text-indigo-500" />
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm md:text-lg font-bold text-slate-200 mt-8 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                {children}
              </h3>
            ),
            p: ({ children }) => {
              const text = String(children);
              if (text.includes('BUY') || text.includes('Long')) {
                return (
                  <div className="flex flex-col items-center justify-center bg-emerald-500/10 border-2 border-emerald-500/30 p-6 md:p-8 rounded-2xl my-8 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <span className="text-emerald-500 font-black text-4xl md:text-6xl tracking-tighter mb-2">BUY / LONG</span>
                    <span className="text-emerald-400/60 font-mono text-xs tracking-[0.4em] uppercase">Confirmed ICT Signal</span>
                  </div>
                );
              }
              if (text.includes('SELL') || text.includes('Short')) {
                return (
                  <div className="flex flex-col items-center justify-center bg-rose-500/10 border-2 border-rose-500/30 p-6 md:p-8 rounded-2xl my-8 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                    <span className="text-rose-500 font-black text-4xl md:text-6xl tracking-tighter mb-2">SELL / SHORT</span>
                    <span className="text-rose-400/60 font-mono text-xs tracking-[0.4em] uppercase">Confirmed ICT Signal</span>
                  </div>
                );
              }
              return <p className="text-slate-200 leading-relaxed mb-6 text-sm md:text-lg font-medium">{children}</p>;
            },
            ul: ({ children }) => <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 list-none p-0">{children}</ul>,
            li: ({ children }) => (
              <li className="flex gap-4 text-slate-300 bg-slate-800/40 p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all group shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                <div className="flex-1 text-sm md:text-[15px] font-semibold tracking-wide leading-snug">{children}</div>
              </li>
            ),
            strong: ({ children }) => <strong className="text-white font-black">{children}</strong>,
            blockquote: ({ children }) => (
              <div className="border-l-4 border-indigo-500 pl-6 py-5 bg-indigo-500/5 rounded-r-2xl my-10 italic text-indigo-100 font-bold text-sm md:text-xl leading-relaxed shadow-inner">
                {children}
              </div>
            ),
            code: ({ children }) => (
              <code className="bg-slate-950 px-2 py-1 rounded text-emerald-400 font-mono text-xs md:text-sm border border-slate-800 shadow-sm">
                {children}
              </code>
            )
          }}
        >
          {cleanContent}
        </ReactMarkdown>

        {/* Tactical Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] md:text-[12px] text-slate-400 uppercase font-black tracking-[0.3em]">Institutional Verification Complete</span>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
                <DollarSign size={14} className="text-indigo-500" />
                <span className="text-[10px] font-bold mono text-slate-300">R:R TARGET 1:3+</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold mono text-slate-300">SMC VERIFIED</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
