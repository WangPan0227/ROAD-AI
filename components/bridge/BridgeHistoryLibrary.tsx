import React, { useState, useEffect } from 'react';
import { 
  History, Search, Calendar, MapPin, ArrowRight, 
  Trash2, ExternalLink, FileText, Activity, ShieldCheck, 
  ChevronRight, Filter, Clock, Database, Layers, AlertTriangle
} from 'lucide-react';

interface BridgeHistoryCase {
  id: string;
  date: string;
  params: any;
  results: {
    alpha_D: number;
    delta_s_cm: number;
    Vn: number;
  };
}

const BridgeHistoryLibrary: React.FC = () => {
  const [history, setHistory] = useState<BridgeHistoryCase[]>(() => {
    const savedHistory = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_bridge_history') : null;
    if (savedHistory) {
      try { return JSON.parse(savedHistory); } catch (e) { /* fallback */ }
    }
    const mockHistory: BridgeHistoryCase[] = [
      {
        id: 'BR-HIST-001',
        date: '2026-04-10T10:30:00Z',
        params: { D: 1.5, fc: 30, Ast: 1.5, s: 10, Ek: 1200 },
        results: { alpha_D: 0.035, delta_s_cm: 5.25, Vn: 4200 }
      },
      {
        id: 'BR-HIST-002',
        date: '2026-04-12T15:45:00Z',
        params: { D: 1.8, fc: 35, Ast: 2.0, s: 8, Ek: 2500 },
        results: { alpha_D: 0.018, delta_s_cm: 3.24, Vn: 6800 }
      }
    ];
    if (typeof window !== 'undefined') {
      localStorage.setItem('roadbedguard_bridge_history', JSON.stringify(mockHistory));
    }
    return mockHistory;
  });
  const [selectedCase, setSelectedCase] = useState<BridgeHistoryCase | null>(() => history.length > 0 ? history[0] : null);
  const [searchTerm, setSearchTerm] = useState('');

  // 这里的 useEffect 逻辑已经移入 state initializer，可以移除原本的 useEffect 加载逻辑
  // 但为了保留一些生命周期逻辑（如清理），这里保持为空或只处理特定逻辑
  useEffect(() => {}, []);

  const deleteCase = (id: string) => {
    const updated = history.filter(c => c.id !== id);
    setHistory(updated);
    localStorage.setItem('roadbedguard_bridge_history', JSON.stringify(updated));
    if (selectedCase?.id === id) setSelectedCase(updated[0] || null);
  };

  const loadToWorkbench = (c: BridgeHistoryCase) => {
    localStorage.setItem('roadbedguard_pending_bridge_load', JSON.stringify(c.params));
    alert('参数已成功载入仿真分析工作台');
  };

  const filteredHistory = history.filter(c => 
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-[#020617] text-slate-300 font-sans overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-pulse pointer-events-none" />
      
      {/* Left List */}
      <div className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl relative z-20">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center">
              <History className="w-4 h-4 mr-2" />
              桥梁历史仿真矩阵
            </h2>
            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest">
              {history.length} 记录
            </span>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="搜索历史编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:border-blue-500/50 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-slim">
          {filteredHistory.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className={`w-full p-5 text-left border-b border-slate-800/50 transition-all hover:bg-blue-500/5 group relative ${selectedCase?.id === c.id ? 'bg-blue-500/10 border-blue-500/30' : ''}`}
            >
              {selectedCase?.id === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />}
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{c.id}</span>
                <span className="text-[9px] text-slate-600 font-bold flex items-center uppercase tracking-widest">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(c.date).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-xs font-black text-slate-200 mb-3 uppercase tracking-widest group-hover:text-white transition-colors italic">仿真分析快照 // Snapshot</h4>
              <div className="flex items-center space-x-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-0.5">损伤度 αD</span>
                  <span className={`text-sm font-black font-mono italic ${c.results?.alpha_D < 0.02 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {((c.results?.alpha_D || 0) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-0.5">峰值位移</span>
                  <span className="text-sm font-black text-slate-300 font-mono italic">{(c.results?.delta_s_cm || 0).toFixed(2)}cm</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Details */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/20 p-10 relative z-10">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        {selectedCase ? (
          <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-8 uppercase">
              <div>
                <h1 className="text-2xl font-black text-slate-100 italic tracking-tighter" id="history-detail-title">历史仿真·深度解析卷宗</h1>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center tracking-widest font-black">
                  <Database className="w-3.5 h-3.5 mr-2 text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  DATA_SOURCE: LOCAL_DB_ARCHIVE | UUID: {selectedCase.id}
                </p>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => deleteCase(selectedCase.id)}
                  id="btn-delete-history"
                  className="p-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-500/30 rounded-2xl transition-all shadow-lg active:scale-95"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => loadToWorkbench(selectedCase)}
                   id="btn-load-history"
                  className="flex items-center px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-2xl shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-all active:scale-95 uppercase tracking-[0.2em]"
                >
                  <ExternalLink className="w-4 h-4 mr-3" />
                  载入仿真工作台
                </button>
              </div>
            </div>

            {/* Result Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all" id="card-damage-history">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                   <ShieldCheck className="w-16 h-16" />
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">结构损伤评估 Matrix</div>
                <div className="text-4xl font-black text-slate-100 font-mono italic tracking-tighter">{((selectedCase.results?.alpha_D || 0) * 100).toFixed(2)}%</div>
                <div className={`mt-4 flex items-center text-[10px] font-black uppercase tracking-widest ${selectedCase.results?.alpha_D < 0.02 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                  {selectedCase.results?.alpha_D < 0.02 ? <ShieldCheck className="w-4 h-4 mr-1.5" /> : <AlertTriangle className="w-4 h-4 mr-1.5" />}
                  {selectedCase.results?.alpha_D < 0.02 ? 'STATUS: SAFE' : 'STATUS: WARNING'}
                </div>
              </div>
              
              <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all" id="card-displacement-history">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                   <Activity className="w-16 h-16" />
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">动力等效位移 Output</div>
                <div className="text-4xl font-black text-slate-100 font-mono italic tracking-tighter">{(selectedCase.results?.delta_s_cm || 0).toFixed(2)}<span className="text-sm ml-1 text-slate-500 not-italic">cm</span></div>
                <div className="mt-4 flex items-center text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <Activity className="w-4 h-4 mr-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  BILINEAR_MODEL_SYNC
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group hover:border-indigo-500/30 transition-all" id="card-resistance-history">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                   <Layers className="w-16 h-16" />
                </div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">截面计算抗力 Vn</div>
                <div className="text-4xl font-black text-slate-100 font-mono italic tracking-tighter">{Math.round(selectedCase.results?.Vn || 0)}<span className="text-sm ml-1 text-slate-500 not-italic">kN</span></div>
                <div className="mt-4 flex items-center text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  <Layers className="w-4 h-4 mr-1.5" />
                  SECTION_RESISTANCE
                </div>
              </div>
            </div>

            {/* Parameters Matrix Table */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl relative" id="table-params-history">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-scan pointer-events-none" />
              <div className="px-8 py-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-black">仿真输入耦合参数存档 Matrix</h4>
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12 font-mono">
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800/50 pb-3 group">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">桥墩直径 Parameter_D</span>
                    <span className="text-sm font-black text-slate-100 italic">{selectedCase.params.D} m</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/50 pb-3 group">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">混凝土强度 Constant_fc</span>
                    <span className="text-sm font-black text-slate-100 italic">{selectedCase.params.fc} MPa</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/50 pb-3 group">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">冲击动能 Load_Ek</span>
                    <span className="text-sm font-black text-rose-500 italic font-black">{selectedCase.params.Ek} kJ</span>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-800/50 pb-3 group">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">箍筋面积 Factor_Ast</span>
                    <span className="text-sm font-black text-slate-100 italic">{selectedCase.params.Ast} cm²</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800/50 pb-3 group">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">箍筋间距 Interval_s</span>
                    <span className="text-sm font-black text-slate-100 italic">{selectedCase.params.s} cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
            <History className="w-24 h-24 mb-6 text-slate-700 animate-pulse" />
            <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-600">空记录集 // NO_ARCHIVE_DATA</p>
            <p className="text-[10px] mt-4 font-mono font-bold text-slate-700 uppercase tracking-widest">仿真工作台保存的数据将自动同步至此矩阵</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BridgeHistoryLibrary;
