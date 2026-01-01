
import React, { useState } from 'react';
import { TradeSetup } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Crosshair, 
  Activity, 
  Zap,
  ShieldAlert,
  Check,
  X
} from 'lucide-react';

interface Props {
  setup: TradeSetup;
  onExecute?: (setup: TradeSetup) => void;
}

export const TradeSetupCard: React.FC<Props> = ({ setup, onExecute }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isExecuted, setIsExecuted] = useState(false);
  
  const isBuy = setup.direction === 'BUY';
  const borderColor = isBuy ? 'border-emerald-500' : 'border-rose-500';
  const textColor = isBuy ? 'text-emerald-400' : 'text-rose-400';
  const bgColor = isBuy ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const buttonBaseColor = isBuy ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500';

  const handleExecute = () => {
    if (onExecute) {
      onExecute(setup);
      setIsExecuted(true);
      setShowConfirm(false);
    }
  };

  return (
    <div className={`w-full max-w-2xl bg-slate-900/90 rounded-2xl border-l-4 ${borderColor} overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative`}>
      
      {/* Header */}
      <div className="bg-black/40 p-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            {isBuy ? <TrendingUp size={24} className={textColor} /> : <TrendingDown size={24} className={textColor} />}
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{setup.asset}</h3>
            <span className="text-xs font-mono text-slate-400 font-bold">{setup.timeframe} • {setup.status}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black tracking-tighter ${textColor}`}>{setup.direction}</div>
          <div className="flex items-center justify-end gap-1 text-[10px] uppercase font-bold text-slate-500">
             <Activity size={10} />
             Confidence: {setup.confidenceScore}%
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <Crosshair size={12} /> Entry Zone
          </div>
          <div className="text-lg font-mono font-bold text-blue-400">{setup.entryZone}</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <Shield size={12} /> Stop Loss
          </div>
          <div className="text-lg font-mono font-bold text-rose-400">{setup.stopLoss}</div>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <Target size={12} /> Main Target
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400">{setup.tpLevels[setup.tpLevels.length - 1]?.level || 'OPEN'}</div>
        </div>
      </div>

      {/* Confluences & Details */}
      <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 size={12} className="text-indigo-500" /> Structural Confluences
          </h4>
          <ul className="space-y-2">
            {setup.confluences.map((c, i) => (
              <li key={i} className="text-xs text-slate-300 font-medium flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                {c}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle size={12} className="text-amber-500" /> Risk Management
          </h4>
          <div className="space-y-3">
             <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-1">
                <span className="text-slate-500 font-bold">Risk/Reward</span>
                <span className="text-white font-mono">{setup.riskReward}</span>
             </div>
             <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-1">
                <span className="text-slate-500 font-bold">Position Size</span>
                <span className="text-white font-mono">{setup.positionSize}</span>
             </div>
             <div className="text-[10px] text-amber-500/80 leading-relaxed italic">
               "{setup.riskWarnings[0]}"
             </div>
          </div>
        </div>
      </div>

      {/* Execution Button */}
      {onExecute && (
        <div className="px-5 pb-5">
          {isExecuted ? (
            <div className="w-full py-4 rounded-xl font-black text-slate-400 bg-slate-950 border border-slate-800 uppercase tracking-widest flex items-center justify-center gap-2 cursor-default animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Protocol Initiated
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className={`w-full py-4 rounded-xl font-black text-white uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${buttonBaseColor} hover:scale-[1.02] active:scale-[0.98]`}
            >
              <Zap size={18} className="text-white fill-white" />
              Set Trade Protocol
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="bg-slate-950/50 p-3 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-600 font-mono uppercase">
        <span>ID: {setup.id}</span>
        <span>Generated via Gemini 3 Pro</span>
      </div>

      {/* Confirmation Overlay */}
      {showConfirm && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
           <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 shadow-2xl">
              <ShieldAlert size={32} className="text-amber-500" />
           </div>
           
           <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Confirm Execution</h3>
           <p className="text-slate-400 text-sm font-medium text-center mb-8 max-w-xs leading-relaxed">
             Initiating <span className={isBuy ? "text-emerald-400" : "text-rose-400"}>{setup.direction}</span> protocol on <span className="text-white">{setup.asset}</span>. 
             Ensure risk parameters are met.
           </p>

           <div className="flex flex-col w-full gap-3">
              <button 
                onClick={handleExecute}
                className={`w-full py-4 rounded-xl font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 ${buttonBaseColor} hover:brightness-110 active:scale-[0.98] transition-all`}
              >
                <Check size={18} />
                Confirm & Execute
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="w-full py-4 rounded-xl font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-900 hover:text-slate-300 transition-all"
              >
                Cancel
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
