
import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Target, 
  Zap, 
  BarChart, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Layers, 
  Crosshair, 
  MapPin, 
  Activity, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  AlignJustify,
  Scan,
  Eye,
  EyeOff,
  Cpu,
  Globe,
  Timer
} from 'lucide-react';
import { TradeSetup } from '../types';
import { TradeSetupCard } from './TradeSetupCard';

interface AnalysisDisplayProps {
  content: string;
  loading: boolean;
  chartImage?: string | null;
  onTradeExecute?: (setup: TradeSetup) => void;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ content, loading, chartImage, onTradeExecute }) => {
  const [showOverlay, setShowOverlay] = useState(true);

  // Parse ICT Data Packet & Trade Setup JSON
  const { cleanContent, ictData, tradeSetup, advancedConcepts } = useMemo(() => {
    if (!content) return { cleanContent: '', ictData: null, tradeSetup: null, advancedConcepts: { hasSMT: false, hasOTE: false, hasPD: false, hasFVG: false } };

    const packetStart = content.indexOf('---ICT_DATA_PACKET---');
    const setupStart = content.indexOf('---TRADE_SETUP_JSON---');
    
    // Determine the end of the markdown content
    let cleanContentEnd = content.length;
    if (packetStart !== -1) cleanContentEnd = packetStart;
    else if (setupStart !== -1) cleanContentEnd = setupStart;

    const clean = content.substring(0, cleanContentEnd);
    
    // Parse ICT Packet
    let data = null;
    if (packetStart !== -1) {
       const packetEnd = setupStart !== -1 ? setupStart : content.length;
       const packet = content.substring(packetStart, packetEnd);
       
       data = {
        session: 'WAITING',
        phase: 'ANALYZING',
        killzone: 'INACTIVE',
        levels: [] as { type: string; price: string; label: string }[]
      };

      const sessionMatch = packet.match(/SESSION:\s*(.*)/i);
      if (sessionMatch) data.session = sessionMatch[1].trim();

      const phaseMatch = packet.match(/PHASE:\s*(.*)/i);
      if (phaseMatch) data.phase = phaseMatch[1].trim();
      
      const kzMatch = packet.match(/KILLZONE:\s*(.*)/i);
      if (kzMatch) data.killzone = kzMatch[1].trim();

      // Updated Regex to capture 3 parts: TYPE, PRICE, LABEL
      // Supports "LEVEL: [TYPE] | [PRICE] | [LABEL]"
      const levelRegex = /LEVEL:\s*\[(.*?)\]\s*\|\s*\[(.*?)\]\s*\|\s*\[(.*?)\]/gi;
      let match;
      while ((match = levelRegex.exec(packet)) !== null) {
        data.levels.push({ type: match[1], price: match[2], label: match[3] });
      }
      
      // Fallback for old format if regex misses
      if (data.levels.length === 0) {
          const oldLevelRegex = /LEVEL:\s*\[(.*?)\]\s*\|\s*\[(.*?)\]/gi;
          while ((match = oldLevelRegex.exec(packet)) !== null) {
            data.levels.push({ type: 'LEVEL', price: match[2], label: match[1] });
          }
      }
    }

    // Parse Trade Setup JSON
    let setup: TradeSetup | null = null;
    if (setupStart !== -1) {
      try {
        const jsonStr = content.substring(setupStart + '---TRADE_SETUP_JSON---'.length).split('---END_SETUP---')[0];
        setup = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse trade setup JSON", e);
      }
    }

    // Advanced Concept Detection for Overlay
    const fullText = (clean + (JSON.stringify(data) || "")).toUpperCase();
    const hasSMT = fullText.includes('SMT') || fullText.includes('DIVERGENCE');
    const hasOTE = fullText.includes('OTE') || fullText.includes('OPTIMAL TRADE') || fullText.includes('FIB');
    const hasPD = fullText.includes('PREMIUM') || fullText.includes('DISCOUNT') || fullText.includes('EQUILIBRIUM');
    const hasFVG = fullText.includes('FVG') || fullText.includes('IMBALANCE') || fullText.includes('GAP');

    return { 
      cleanContent: clean, 
      ictData: data, 
      tradeSetup: setup, 
      advancedConcepts: { hasSMT, hasOTE, hasPD, hasFVG } 
    };
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
  
  const isKillzoneActive = ictData?.killzone.toUpperCase().includes('ACTIVE');

  // Helper for Session Timeline
  const sessions = [
      { id: 'ASIA', label: 'ASIA' },
      { id: 'LONDON', label: 'LNDN' },
      { id: 'NEW YORK', label: 'NY' },
      { id: 'CLOSE', label: 'PM' }
  ];
  const activeSessionIndex = (() => {
      const s = ictData?.session.toUpperCase() || '';
      if (s.includes('ASIA')) return 0;
      if (s.includes('LONDON')) return 1;
      if (s.includes('NEW YORK') || s.includes('NY')) return 2;
      if (s.includes('CLOSE') || s.includes('PM')) return 3;
      return -1;
  })();

  return (
    <div className="prose prose-invert prose-slate max-w-none animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* CHART IMAGE VISUALIZER WITH HUD */}
      {chartImage && (
        <div className="mb-12 rounded-3xl overflow-hidden border-2 border-slate-800 relative bg-black shadow-2xl group select-none">
           <img 
              src={chartImage} 
              alt="Analyzed Chart" 
              className={`w-full h-auto object-contain transition-all duration-700 ${showOverlay ? 'opacity-60 blur-[1px]' : 'opacity-100'}`}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

           {/* Overlay Controls */}
           <div className="absolute top-4 left-4 z-30">
              <button 
                onClick={() => setShowOverlay(!showOverlay)}
                className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-slate-700 hover:border-indigo-500 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-all active:scale-95"
              >
                {showOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{showOverlay ? 'Hide HUD' : 'Show HUD'}</span>
              </button>
           </div>
           
           {/* HUD LAYER */}
           {showOverlay && (
             <div className="absolute inset-0 z-10 p-4 md:p-6 pointer-events-none flex flex-col justify-between animate-in fade-in duration-300">
                
                {/* Top Center: Session Cycle Timeline */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-slate-700 rounded-full px-5 py-2.5 shadow-2xl z-20">
                  <Globe size={12} className="text-slate-500 mr-2" />
                  {sessions.map((s, i) => {
                    const isActive = ictData?.session.toUpperCase().includes(s.id) || (s.id === 'NY' && ictData?.session.toUpperCase().includes('NEW YORK'));
                    const isPast = activeSessionIndex > i; 
                    
                    return (
                      <div key={s.id} className="flex items-center">
                         <div className={`flex flex-col items-center gap-1 ${isActive ? 'opacity-100' : isPast ? 'opacity-40' : 'opacity-20'}`}>
                            <span className={`text-[9px] font-black tracking-widest ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>{s.label}</span>
                            <div className={`w-8 h-1 rounded-full ${isActive ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-slate-600'}`}></div>
                         </div>
                         {i < sessions.length - 1 && <div className="w-4 h-[1px] bg-slate-800 mx-1"></div>}
                      </div>
                    )
                  })}
                </div>

                {/* Top Left (Under Toggle): Killzone Alert */}
                {isKillzoneActive && (
                  <div className="absolute top-16 left-4 z-20 animate-in slide-in-from-left duration-500">
                    <div className="bg-rose-950/90 backdrop-blur-md border border-rose-500/50 text-rose-200 px-4 py-2 rounded-lg flex items-center gap-3 shadow-[0_0_20px_rgba(244,63,94,0.2)] animate-pulse border-l-4 border-l-rose-500">
                       <Timer size={16} className="text-rose-500" />
                       <div>
                         <div className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">Volatile Zone</div>
                         <div className="text-[10px] font-bold uppercase tracking-wide">{ictData?.killzone}</div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Left Center: AMD Phase Vertical Tracker */}
                <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 flex flex-col gap-3">
                   {['ACCUMULATION', 'MANIPULATION', 'DISTRIBUTION'].map((phase) => {
                      const isPhase = ictData?.phase.toUpperCase().includes(phase);
                      let activeColorClass = '';
                      let activeTextClass = '';
                      let label = '';
                      
                      if (phase === 'ACCUMULATION') { 
                        activeColorClass = 'bg-blue-500 shadow-blue-500/50'; 
                        activeTextClass = 'text-blue-400';
                        label = 'POWER ACCUM.';
                      } else if (phase === 'MANIPULATION') { 
                        activeColorClass = 'bg-rose-500 shadow-rose-500/50'; 
                        activeTextClass = 'text-rose-400';
                        label = 'JUDAS SWING';
                      } else { 
                        activeColorClass = 'bg-emerald-500 shadow-emerald-500/50'; 
                        activeTextClass = 'text-emerald-400';
                        label = 'EXPANSION';
                      }

                      return (
                         <div key={phase} className={`group flex items-center gap-3 transition-all duration-500 ${isPhase ? 'opacity-100 scale-105' : 'opacity-30 hover:opacity-60'}`}>
                            <div className={`w-1.5 h-12 rounded-full transition-all duration-300 ${isPhase ? activeColorClass + ' shadow-[0_0_10px]' : 'bg-slate-700'}`}></div>
                            {isPhase && (
                               <div className="bg-black/60 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg animate-in fade-in slide-in-from-left-4">
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${activeTextClass}`}>{label}</span>
                               </div>
                            )}
                         </div>
                      );
                   })}
                </div>

                {/* Top Right: Institutional Levels */}
                {ictData && ictData.levels.length > 0 && (
                  <div className="flex flex-col items-end gap-2 ml-auto mt-8 md:mt-0">
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">
                         <Target size={10} /> Institutional Pools
                      </div>
                      {ictData.levels.slice(0, 4).map((lvl, idx) => {
                        const isBearish = lvl.type.toUpperCase().includes('BSL') || lvl.type.toUpperCase().includes('HIGH') || lvl.type.toUpperCase().includes('PREMIUM');
                        const isBullish = lvl.type.toUpperCase().includes('SSL') || lvl.type.toUpperCase().includes('LOW') || lvl.type.toUpperCase().includes('DISCOUNT');
                        
                        return (
                          <div key={idx} className={`
                              flex items-center gap-3 px-3 py-1.5 rounded border backdrop-blur-md shadow-lg w-fit
                              ${isBearish ? 'bg-rose-950/60 border-rose-500/30 text-rose-200' : 
                                isBullish ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200' : 
                                'bg-slate-900/60 border-slate-600/30 text-slate-300'}
                          `}>
                              <div className="text-right">
                                <div className="text-[8px] font-black uppercase tracking-wider opacity-70">{lvl.type}</div>
                              </div>
                              <div className="font-mono font-bold text-xs">
                                {lvl.price}
                              </div>
                              {isBearish && <ArrowUpCircle size={12} className="text-rose-500" />}
                              {isBullish && <ArrowDownCircle size={12} className="text-emerald-500" />}
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Center / Grid Decoration */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                   <div className="w-[95%] h-[90%] border border-dashed border-indigo-400/50 rounded-xl relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-indigo-500/20"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-indigo-500/20"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-indigo-500/20 rounded-full"></div>
                   </div>
                </div>

                {/* Bottom Right: Advanced Concepts Indicators */}
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                    {advancedConcepts.hasSMT && (
                      <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/50 text-amber-200 px-3 py-2 rounded-lg flex items-center gap-3 shadow-lg animate-pulse">
                          <AlertTriangle size={14} className="text-amber-500" />
                          <div className="text-right">
                             <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">Warning</div>
                             <div className="text-[10px] font-bold uppercase tracking-wide">SMT Divergence Detected</div>
                          </div>
                      </div>
                    )}
                    
                    {advancedConcepts.hasOTE && (
                      <div className="bg-indigo-500/10 backdrop-blur-md border border-indigo-500/50 text-indigo-200 px-3 py-2 rounded-lg flex items-center gap-3 shadow-lg">
                          <Crosshair size={14} className="text-indigo-400" />
                          <div className="text-right">
                             <div className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Fibonacci</div>
                             <div className="text-[10px] font-bold uppercase tracking-wide">OTE / Golden Zone</div>
                          </div>
                      </div>
                    )}

                    {advancedConcepts.hasPD && (
                      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-600 text-slate-300 px-3 py-2 rounded-lg flex items-center gap-3 shadow-lg">
                          <Layers size={14} className="text-slate-400" />
                          <div className="text-right">
                             <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Array</div>
                             <div className="text-[10px] font-bold uppercase tracking-wide">Premium / Discount</div>
                          </div>
                      </div>
                    )}
                    
                    {advancedConcepts.hasFVG && (
                      <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/50 text-blue-200 px-3 py-2 rounded-lg flex items-center gap-3 shadow-lg">
                          <Scan size={14} className="text-blue-400" />
                          <div className="text-right">
                             <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Inefficiency</div>
                             <div className="text-[10px] font-bold uppercase tracking-wide">Fair Value Gap</div>
                          </div>
                      </div>
                    )}
                </div>

                {/* Bottom Left: Scan Status */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                   <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                      <Cpu size={12} className="text-emerald-500" />
                      ICT Algorithm Synced
                   </div>
                </div>

             </div>
           )}
        </div>
      )}

      {/* TRADE SETUP CARD (IF FOUND) */}
      {tradeSetup ? (
         <div className="mb-12 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                 <span className="text-emerald-400 font-black tracking-widest uppercase text-xs">Confirmed Entry Signal Detected</span>
            </div>
            <TradeSetupCard setup={tradeSetup} onExecute={onTradeExecute} />
         </div>
      ) : (
         cleanContent.includes("NO TRADE FOUND") && (
            <div className="mb-12 bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex items-center gap-4 border-l-4 border-l-slate-700">
                 <AlertTriangle className="text-slate-500 shrink-0" />
                 <div>
                     <h4 className="text-slate-300 font-bold uppercase tracking-wider text-sm">No Valid Setup Detected</h4>
                     <p className="text-slate-500 text-xs mt-1">Market structure does not meet high-probability institutional criteria. Waiting for liquidity sweep or displacement.</p>
                 </div>
            </div>
         )
      )}

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
