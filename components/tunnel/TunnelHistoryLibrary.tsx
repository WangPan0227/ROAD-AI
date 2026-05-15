import React, { useState, useEffect } from 'react';
import { 
  History, Search, Calendar, MapPin, ArrowRight, 
  Trash2, FileText, Activity, ShieldCheck, 
  ChevronRight, Clock, Database, Layers, Target
} from 'lucide-react';

interface TunnelHistoryCase {
  id: string;
  date: string;
  params: any;
  results: {
    tunnel_type: string;
    q_kPa: number;
    deep_rate: number;
    damage_level: number;
    health_score: number;
  };
}

const STORAGE_KEY = 'roadbedguard_tunnel_history';
const PENDING_LOAD_KEY = 'roadbedguard_pending_tunnel_load';

const TunnelHistoryLibrary: React.FC = () => {
  const [history, setHistory] = useState<TunnelHistoryCase[]>(() => {
    const savedHistory = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (savedHistory) {
      try { return JSON.parse(savedHistory); } catch (e) {
        console.error("Failed to parse saved tunnel history", e);
      }
    }
    return [
      {
        id: 'TN-HIST-001',
        date: new Date().toISOString(),
        params: { B: 12.0, Ht: 8.0, H: 45.0, rockClass: 5, gamma: 20.0, mu: 0.35, dLining: 450, dCrack: 280, hasDebris: true },
        results: { tunnel_type: '浅埋隧道', q_kPa: 900.0, deep_rate: 62.2, damage_level: 4, health_score: 15.1 }
      }
    ];
  });
  const [selectedCase, setSelectedCase] = useState<TunnelHistoryCase | null>(() => history.length > 0 ? history[0] : null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {}, []);

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这条隧道推演记录吗？')) {
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      if (selectedCase?.id === id) {
        setSelectedCase(newHistory.length > 0 ? newHistory[0] : null);
      }
    }
  };

  const handleLoadToWorkbench = () => {
    if (!selectedCase) return;
    localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify(selectedCase.params));
    alert('参数已就绪！请在左侧菜单点击切换至【仿真模拟分析】工作台查看。');
  };

  const filteredHistory = history.filter(h => 
    h.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.date.includes(searchTerm)
  );

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* 左侧列表 */}
      <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-5 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-black text-slate-800 flex items-center mb-4">
            <Database className="w-6 h-6 mr-2 text-indigo-600" /> 隧道历史训练库
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" placeholder="搜索存档编号或日期..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredHistory.map(item => (
            <div 
              key={item.id} onClick={() => setSelectedCase(item)}
              className={`p-4 rounded-xl cursor-pointer transition-all border relative ${selectedCase?.id === item.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'}`}
            >
              {selectedCase?.id === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-xl"></div>}
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center"><FileText className="w-3.5 h-3.5 mr-1 text-indigo-500"/> {item.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.results.damage_level >= 3 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {item.results.damage_level >= 3 ? '高危工况' : '安全工况'}
                </span>
              </div>
              <div className="flex items-center text-[10px] text-gray-500 font-mono mb-2"><Clock className="w-3 h-3 mr-1"/> {new Date(item.date).toLocaleString()}</div>
              <div className="flex justify-between text-xs mt-2 pt-2 border-t border-gray-200/60">
                <span className="text-gray-600">健康度: <strong className="text-slate-800">{(item.results?.health_score ?? 0).toFixed(1)}</strong></span>
                <span className="text-gray-600">埋深: <strong className="text-slate-800">{item.params?.H ?? 0}m</strong></span>
              </div>
            </div>
          ))}
          {filteredHistory.length === 0 && <div className="text-center p-6 text-gray-400 text-sm">暂无匹配的存档记录</div>}
        </div>
      </div>

      {/* 右侧详情 */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        {selectedCase ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-black rounded uppercase tracking-wider">Snapshot</span>
                  <span className="text-sm text-gray-500 font-mono">{new Date(selectedCase.date).toLocaleString()}</span>
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">{selectedCase.id} 仿真快照</h1>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => handleDelete(selectedCase.id)} className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold flex items-center transition-colors"><Trash2 className="w-4 h-4 mr-2"/> 删除记录</button>
                <button onClick={handleLoadToWorkbench} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center transition-all"><Activity className="w-4 h-4 mr-2"/> 载入仿真工作台</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 md:col-span-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center"><Target className="w-4 h-4 mr-2 text-indigo-500"/> 物理模型输入参数</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-xs text-gray-500">围岩级别</span><span className="text-sm font-bold text-slate-800">{selectedCase.params.rockClass} 级</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-xs text-gray-500">跨度 B</span><span className="text-sm font-bold text-slate-800">{selectedCase.params.B} m</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-xs text-gray-500">埋深 H</span><span className="text-sm font-bold text-slate-800">{selectedCase.params.H} m</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-xs text-gray-500">围岩重度 γ</span><span className="text-sm font-bold text-slate-800">{selectedCase.params.gamma} kN/m³</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-xs text-gray-500">衬砌设计厚度</span><span className="text-sm font-bold text-slate-800">{selectedCase.params.dLining} mm</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-xs text-red-500 font-bold">表观裂隙深度</span><span className="text-sm font-bold text-red-600">{selectedCase.params.dCrack} mm</span></div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 col-span-2"><span className="text-xs text-red-500 font-bold">是否存在掉块/空洞</span><span className="text-sm font-bold text-red-600">{selectedCase.params.hasDebris ? '是 (高危)' : '否'}</span></div>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-700 text-white flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-600 pb-2 flex items-center"><Activity className="w-4 h-4 mr-2 text-emerald-400"/> 核心计算结果</h3>
                  <div className="space-y-4">
                    <div><div className="text-[10px] text-slate-400 uppercase mb-1">判别工况</div><div className="text-lg font-bold text-emerald-400">{selectedCase.results.tunnel_type}</div></div>
                    <div><div className="text-[10px] text-slate-400 uppercase mb-1">垂直围岩压力 (q)</div><div className="text-2xl font-mono font-bold text-white">{(selectedCase.results?.q_kPa ?? 0).toFixed(1)} <span className="text-sm">kPa</span></div></div>
                  </div>
                </div>
                <div className={`mt-6 p-4 rounded-xl border ${(selectedCase.results?.health_score ?? 0) < 60 ? 'bg-red-500/20 border-red-500/50 text-red-200' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'}`}>
                  <div className="text-[10px] uppercase font-bold mb-1 opacity-80">综合剩余健康度</div>
                  <div className="text-3xl font-black font-mono">{(selectedCase.results?.health_score ?? 0).toFixed(1)}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <History className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-lg font-bold">暂无历史记录</p>
            <p className="text-sm mt-2">在仿真分析工作台保存的结果将显示在此处</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default TunnelHistoryLibrary;