import React, { useState, useEffect } from 'react';
import { 
  History, Search, Calendar, MapPin, ArrowRight, 
  Trash2, ExternalLink, FileText, Activity, ShieldCheck, 
  ChevronRight, Filter, Clock, Database, Layers
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
  const [history, setHistory] = useState<BridgeHistoryCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<BridgeHistoryCase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedHistory = localStorage.getItem('roadbedguard_bridge_history');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed);
      if (parsed.length > 0) setSelectedCase(parsed[0]);
    } else {
      // Mock data if empty
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
      setHistory(mockHistory);
      setSelectedCase(mockHistory[0]);
      localStorage.setItem('roadbedguard_bridge_history', JSON.stringify(mockHistory));
    }
  }, []);

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
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Left List */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <History className="w-5 h-5 mr-2 text-blue-600" />
              桥梁历史训练库
            </h2>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {history.length} 记录
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索历史编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredHistory.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className={`w-full p-5 text-left border-b border-gray-50 transition-all hover:bg-gray-50 group relative ${selectedCase?.id === c.id ? 'bg-blue-50/50' : ''}`}
            >
              {selectedCase?.id === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">{c.id}</span>
                <span className="text-[10px] text-gray-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(c.date).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-700 mb-3 group-hover:text-blue-600 transition-colors">冲击仿真分析快照</h4>
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">损伤度 αD</span>
                  <span className={`text-sm font-black ${c.results?.alpha_D < 0.02 ? 'text-green-600' : 'text-orange-600'}`}>
                    {((c.results?.alpha_D || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">位移</span>
                  <span className="text-sm font-black text-gray-700">{(c.results?.delta_s_cm || 0).toFixed(1)}cm</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Details */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-8">
        {selectedCase ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-800">历史仿真详情</h1>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  数据源：本地结构化历史库 | 编号：{selectedCase.id}
                </p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => deleteCase(selectedCase.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => loadToWorkbench(selectedCase)}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  载入工作台
                </button>
              </div>
            </div>

            {/* Result Cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">损伤评估</div>
                <div className="text-3xl font-black text-gray-800">{((selectedCase.results?.alpha_D || 0) * 100).toFixed(2)}%</div>
                <div className="mt-2 flex items-center text-[10px] font-bold text-emerald-600">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {selectedCase.results?.alpha_D < 0.02 ? '安全' : '预警'}
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">等效位移</div>
                <div className="text-3xl font-black text-gray-800">{(selectedCase.results?.delta_s_cm || 0).toFixed(2)}cm</div>
                <div className="mt-2 flex items-center text-[10px] font-bold text-blue-600">
                  <Activity className="w-3 h-3 mr-1" />
                  双折线模型
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">抗剪承载力</div>
                <div className="text-3xl font-black text-gray-800">{Math.round(selectedCase.results?.Vn || 0)}kN</div>
                <div className="mt-2 flex items-center text-[10px] font-bold text-indigo-600">
                  <Layers className="w-3 h-3 mr-1" />
                  截面抗力
                </div>
              </div>
            </div>

            {/* Parameters Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">仿真输入参数存档</h4>
                <FileText className="w-4 h-4 text-gray-400" />
              </div>
              <div className="p-6 grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-500 font-medium">桥墩直径 D</span>
                    <span className="text-sm font-bold text-gray-800">{selectedCase.params.D} m</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-500 font-medium">混凝土强度 fc</span>
                    <span className="text-sm font-bold text-gray-800">{selectedCase.params.fc} MPa</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-500 font-medium">冲击动能 Ek</span>
                    <span className="text-sm font-bold text-gray-800">{selectedCase.params.Ek} kJ</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-500 font-medium">箍筋面积 Ast</span>
                    <span className="text-sm font-bold text-gray-800">{selectedCase.params.Ast} cm²</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-500 font-medium">箍筋间距 s</span>
                    <span className="text-sm font-bold text-gray-800">{selectedCase.params.s} cm</span>
                  </div>
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

export default BridgeHistoryLibrary;
