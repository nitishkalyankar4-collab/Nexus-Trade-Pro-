
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AppView, TradeSetup } from './types';
import Sidebar from './components/Sidebar';
import Terminal from './components/Terminal';
import AnalysisDisplay from './components/AnalysisDisplay';
import { TradeSetupCard } from './components/TradeSetupCard';
import { geminiService } from './services/geminiService';
import { 
  Upload, 
  Search, 
  Send, 
  Activity, 
  BarChart3,
  MessageSquare,
  Camera,
  ShieldAlert,
  ExternalLink,
  Target,
  ShieldCheck,
  AlertTriangle,
  Zap
} from 'lucide-react';

export const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sentiment, setSentiment] = useState<{text: string, chunks?: any[]}>({ text: "" });
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: string, text?: string, tradeSetup?: TradeSetup}>>([]);
  const [prices, setPrices] = useState({ btc: 0, eth: 0 });
  const [systemLogs, setSystemLogs] = useState<{timestamp: string, message: string, type: 'info'|'success'|'error'|'thinking'}[]>([]);
  const [chartImage, setChartImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: 'info'|'success'|'error'|'thinking' = 'info') => {
    setSystemLogs(prev => [...prev, {
      timestamp: new Date().toISOString().slice(11, 19),
      message,
      type
    }]);
  };

  // Real-time Data Synchronization
  const syncMarket = async () => {
    addLog("SYNCING GLOBAL LIQUIDITY NODES...", "thinking");
    try {
      const data = await geminiService.getRealTimePrices();
      if (data.btc > 0) {
        setPrices({ btc: data.btc, eth: data.eth });
        addLog(`MARKET SYNC SUCCESSFUL. BTC: $${data.btc.toLocaleString()}`, "success");
      }
    } catch (err) {
      addLog("MARKET SYNC TIMEOUT. RETRYING...", "error");
    }
  };

  useEffect(() => {
    syncMarket();
    const interval = setInterval(syncMarket, 60000); // 1-minute high-fidelity sync
    return () => clearInterval(interval);
  }, []);

  const processFile = async (file: File) => {
    addLog(`INGESTING DATA PACKET: ${file.name}`, "info");
    setLoading(true);
    setAnalysisResult("");
    setChartImage(null); // Reset prev image
    setView(AppView.ANALYSIS);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const resultStr = reader.result as string;
      setChartImage(resultStr);
      const base64 = resultStr.split(',')[1];
      try {
        addLog("EXECUTING DEEP ICT SCAN...", "thinking");
        const result = await geminiService.analyzeChart(base64);
        setAnalysisResult(result);
        addLog("SCAN COMPLETE. OUTPUT READY.", "success");
      } catch (err) {
        addLog("PROTOCOL REJECTION: STRUCTURAL VALIDATION FAILED.", "error");
        setAnalysisResult("## CORE REJECTION\nStructural integrity of the provided chart data does not meet ICT standards.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const fetchSentiment = async () => {
    setLoading(true);
    addLog("SCANNING MACRO BIAS...", "thinking");
    try {
      const res = await geminiService.getMarketSentiment();
      setSentiment(res);
      addLog("MACRO BIAS AGGREGATED.", "success");
    } catch (err) {
      addLog("MACRO SCAN FAILED.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { role: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage("");
    setLoading(true);
    addLog("TRANSFUSING ADVISORY QUERY...", "thinking");

    try {
      const historyForApi = chatHistory
        .filter(msg => msg.text)
        .map(msg => ({ role: msg.role, text: msg.text || "" }));
        
      const aiResponse = await geminiService.chat(chatMessage, historyForApi);
      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
      addLog("ADVISORY RESPONSE RECEIVED.", "success");
    } catch (err) {
      addLog("ADVISORY NODE OFFLINE.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSetup = async () => {
    setLoading(true);
    addLog("CALCULATING PROBABILITY MATRIX...", "thinking");
    
    const contextMsg = { role: 'user', text: "GENERATE_INSTITUTIONAL_SETUP_PROTOCOL" };
    setChatHistory(prev => [...prev, contextMsg]);

    try {
      const recentContext = chatHistory.slice(-3).map(m => m.text).join('\n') + (analysisResult ? `\n\nRecent Analysis: ${analysisResult.slice(0, 500)}` : "");
      
      const setup = await geminiService.generateTradeSetup(recentContext);
      
      setChatHistory(prev => [...prev, { role: 'ai', tradeSetup: setup }]);
      addLog("TRADE SETUP GENERATED.", "success");
    } catch (err) {
      addLog("SETUP GENERATION FAILED.", "error");
      setChatHistory(prev => [...prev, { role: 'ai', text: "ERROR: Unable to converge on a high-probability setup at this time." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleTradeExecution = (setup: TradeSetup) => {
    addLog(`ORDER EXECUTION INITIATED: ${setup.direction} ${setup.asset} [ID:${setup.id}] | ENTRY: ${setup.entryZone} | SL: ${setup.stopLoss}`, 'success');
  };

  useEffect(() => {
    if (view === AppView.SENTIMENT && !sentiment.text) {
      fetchSentiment();
    }
  }, [view]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden pb-16 md:pb-0">
        <header className="h-14 md:h-16 border-b border-slate-800/60 bg-black/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
          <div className="flex items-center gap-2 md:gap-6">
            <h2 className="hidden lg:flex text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-500" />
              Institutional Terminal
            </h2>
            <div className="flex gap-2">
               <div className="text-[10px] md:text-xs bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded flex items-center gap-2">
                 <span className="text-emerald-500 font-black">BTC</span>
                 <span className="mono font-bold">${prices.btc > 0 ? prices.btc.toLocaleString() : 'SYNCING...'}</span>
               </div>
               <div className="text-[10px] md:text-xs bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded flex items-center gap-2">
                 <span className="text-blue-500 font-black">ETH</span>
                 <span className="mono font-bold">${prices.eth > 0 ? prices.eth.toLocaleString() : 'SYNCING...'}</span>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-500 mono bg-slate-900/50 px-3 py-1.5 rounded border border-slate-800 uppercase tracking-widest">
               <Activity size={12} className="text-indigo-500" />
               Live Flow
             </div>
             <div className="md:hidden w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <ShieldAlert size={18} className="text-white" />
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 relative scroll-smooth custom-scrollbar">
          {view === AppView.DASHBOARD && (
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
                <div 
                  className="xl:col-span-2 bg-gradient-to-br from-slate-900 to-black border-2 border-slate-800 rounded-3xl p-8 md:p-12 relative overflow-hidden"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) processFile(file);
                  }}
                >
                  <div className="relative z-10">
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">
                       Smart Money<br/><span className="text-indigo-500">Execution.</span>
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg max-w-2xl mb-10 leading-relaxed font-medium">
                      Direct institutional execution environment. High-fidelity structural analysis targeting institutional liquidity pools and order flow displacement.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-xl font-black flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest"
                      >
                        <Upload size={24} />
                        Analyze Asset
                      </button>
                    </div>
                  </div>
                  <div className="absolute -bottom-20 -right-20 opacity-[0.03] pointer-events-none">
                    <BarChart3 size={500} />
                  </div>
                </div>

                <div className="space-y-6 md:space-y-10">
                  <div className="bg-black/40 border-2 border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <h3 className="text-white text-[10px] font-black mb-6 flex items-center gap-3 uppercase tracking-[0.3em]">
                      <Target size={18} className="text-emerald-500" />
                      Protocol State
                    </h3>
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Fidelity</span>
                        <span className="text-emerald-400 font-black text-lg mono">MAX</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-800/50 pb-2">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Risk Filter</span>
                        <span className="text-indigo-400 font-black text-lg mono">ENABLED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Terminal logs={systemLogs} />
            </div>
          )}

          {view === AppView.ANALYSIS && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
              <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Structural Protocol</h1>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-3 transition-all border border-slate-700 uppercase tracking-widest text-xs"
                >
                  <Upload size={18} />
                  New Scan
                </button>
              </div>
              <AnalysisDisplay 
                content={analysisResult} 
                loading={loading} 
                chartImage={chartImage} 
                onTradeExecute={handleTradeExecution}
              />
            </div>
          )}

          {view === AppView.SENTIMENT && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
              <div className="mb-8 md:mb-12 flex items-center justify-between">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Global Macro Flow</h1>
                <button 
                  onClick={fetchSentiment}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-4 rounded-xl shadow-xl shadow-indigo-600/20"
                >
                  <Search size={24} />
                </button>
              </div>
              {loading && !sentiment.text ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <div className="w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <span className="text-indigo-400 text-xs font-black tracking-[0.4em] uppercase">Processing Nodes...</span>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="bg-black/60 border-2 border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
                    <ReactMarkdown className="prose prose-lg prose-invert max-w-none font-medium text-slate-300">
                      {sentiment.text || "READY FOR SCAN."}
                    </ReactMarkdown>
                  </div>

                  {sentiment.chunks && sentiment.chunks.length > 0 && (
                    <div className="bg-black/80 border-2 border-slate-800 rounded-3xl p-6 md:p-8">
                      <h3 className="text-white text-[10px] font-black mb-6 uppercase tracking-[0.3em] border-b border-slate-800 pb-4">Verified Sources</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sentiment.chunks.map((chunk: any, idx: number) => (
                          chunk.web && (
                            <a 
                              key={idx} 
                              href={chunk.web.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-indigo-500 transition-all flex items-center justify-between group"
                            >
                              <span className="truncate font-bold uppercase">{chunk.web.title || "Reference"}</span>
                              <ExternalLink size={12} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {view === AppView.CHAT && (
            <div className="max-w-5xl mx-auto h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-10">Institutional Advisor</h1>

              <div className="flex-1 overflow-y-auto mb-8 space-y-6 pr-4 custom-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-10">
                    <MessageSquare size={100} />
                    <p className="text-2xl font-black uppercase tracking-widest mt-4">Awaiting Advisory</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.tradeSetup ? (
                      <TradeSetupCard setup={msg.tradeSetup} onExecute={handleTradeExecution} />
                    ) : (
                      <div className={`max-w-[85%] rounded-2xl p-6 shadow-2xl ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none font-bold' 
                          : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none font-medium'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="relative mb-6">
                <form onSubmit={handleChatSubmit} className="relative">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="CONSULT ON INSTITUTIONAL FLOW..."
                    className="w-full bg-black border-2 border-slate-800 rounded-2xl px-8 py-6 pr-32 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-white font-bold placeholder:text-slate-700 tracking-tight"
                  />
                  <div className="absolute right-4 top-4 flex gap-2">
                    <button 
                      type="button"
                      onClick={handleGenerateSetup}
                      disabled={loading}
                      className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-yellow-400 transition-all shadow-xl active:scale-95 border border-slate-700 hover:border-yellow-400/30"
                      title="Generate Trade Setup"
                    >
                      <Zap size={24} />
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !chatMessage.trim()}
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-white transition-all shadow-xl active:scale-95"
                    >
                      <Send size={24} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-black border border-slate-800 px-6 py-2.5 rounded-full backdrop-blur-2xl shadow-2xl flex items-center gap-6 text-[10px] z-50">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]"></div>
              <span className="text-slate-100 font-black tracking-widest uppercase">Node Online</span>
           </div>
           <div className="h-4 w-[1px] bg-slate-800"></div>
           <span className="text-slate-500 font-black uppercase tracking-[0.2em]">Institutional Engine Active</span>
        </div>
      </main>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileUpload}
      />
    </div>
  );
};
