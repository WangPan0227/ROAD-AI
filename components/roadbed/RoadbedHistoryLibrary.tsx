import React, { useState, useEffect } from 'react';
import { 
  History, Search, Calendar, Edit3, Trash2, ShieldAlert, CheckCircle, Save, 
  Layers, Droplets, Activity, PenTool, Truck, AlertTriangle, Info, ClipboardList
} from 'lucide-react';

const STORAGE_KEY = 'roadbedguard_roadbed_history';
const PENDING_LOAD_KEY = 'roadbedguard_pending_roadbed_load';

const RoadbedHistoryLibrary: React.FC = () => {
  const [historyCases, setHistoryCases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // 初始化加载数据
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistoryCases(parsed);
      if (parsed.length > 0) setSelectedCaseId(parsed[0].id);
    } else {
      // 预设模拟案例
      const mockCases = [
        {
          id: 'rb-hist-1',
          name: 'K105+300 路基软化案例',
          date: '2024-03-15 10:30',
          notes: '该段路基在连续降雨后出现明显软化，路面出现网裂。经现场检测，土体含水率接近饱和。',
          params: {
            geometry: { H: 6.5, dz: 0.2, E_req: 40.0 },
            soil: { gamma: 18.5, cbr: 4.5, compaction: 0.93 },
            environment: { rainfall: 150.0, rainDays: 5 },
            load: { q_load: 25.0 },
            diseaseLevel: 2
          },
          results: {
            finalSettlement: 48.2,
            finalCapacity: 68.5,
            wettingFront: 1.8
          }
        },
        {
          id: 'rb-hist-2',
          name: 'K112+500 翻浆冒泥治理前快照',
          date: '2024-04-02 14:20',
          notes: '重载交通压力下，排水不畅导致路基翻浆。需评估注浆加固前的承载力赤字。',
          params: {
            geometry: { H: 5.0, dz: 0.2, E_req: 45.0 },
            soil: { gamma: 19.0, cbr: 5.2, compaction: 0.94 },
            environment: { rainfall: 80.0, rainDays: 2 },
            load: { q_load: 40.0 },
            diseaseLevel: 3
          },
          results: {
            finalSettlement: 32.5,
            finalCapacity: 55.2,
            wettingFront: 1.2
          }
        }
      ];
      setHistoryCases(mockCases);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCases));
      setSelectedCaseId(mockCases[0].id);
    }
  }, []);

  // 当选中项改变时，同步编辑框内容
  useEffect(() => {
    const selected = historyCases.find(c => c.id === selectedCaseId);
    if (selected) {
      setEditName(selected.name);
      setEditNotes(selected.notes || '');
    }
  }, [selectedCaseId, historyCases]);

  const filteredCases = historyCases.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.date.includes(searchTerm)
  );

  const selectedCase = historyCases.find(c => c.id === selectedCaseId);

  const handleDelete = (id: string) => {
    const updated = historyCases.filter(c => c.id !== id);
    setHistoryCases(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selectedCaseId === id) setSelectedCaseId(updated.length > 0 ? updated[0].id : null);
  };

  const handleSaveChanges = () => {
    if (!selectedCaseId) return;
    const updated = historyCases.map(c => 
        c.id === selectedCaseId ? { ...c, name: editName, notes: editNotes } : c
    );
    setHistoryCases(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    alert('案例信息更新成功！');
  };

  const handleLoadToWorkbench = () => {
    if (!selectedCase) return;
    localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify(selectedCase.params));
    alert('案例参数已就绪！请切换至【仿真模拟分析】查看还原场景。');
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧：案例列表 */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-5 border-b border-gray-200 bg-white sticky top-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
            <History className="w-6 h-6 mr-2 text-blue-600" />
            路基历史训练库
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索路基历史案例..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
          {filteredCases.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-sm">暂无历史归档记录</div>
          ) : (
            filteredCases.map(c => (
                <div 
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border relative overflow-hidden ${
                    selectedCaseId === c.id 
                    ? 'bg-white border-blue-300 shadow-md ring-1 ring-blue-100' 
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
                >
                {selectedCaseId === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-gray-800 truncate pr-2">{c.name}</h3>
                    {c.results ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.results.finalSettlement > 50 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {c.results.finalSettlement.toFixed(1)} mm
                        </span>
                    ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">未计算</span>
                    )}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" /> {c.date}
                </div>
                </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧：详情面板 */}
      <div className="w-2/3 flex flex-col h-full bg-gray-50">
        {selectedCase ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 顶部：基础信息与操作 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">案例名称</label>
                        <input 
                            type="text" 
                            value={editName} 
                            onChange={e => setEditName(e.target.value)}
                            className="w-full text-xl font-bold text-gray-800 border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-0 px-0 bg-transparent transition-colors"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={handleLoadToWorkbench} 
                            className="flex items-center px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-bold transition-colors shadow-sm"
                        >
                            <span className="mr-1">🚀</span> 载入仿真工作台
                        </button>
                        
                        <button onClick={handleSaveChanges} className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm font-bold transition-colors border border-gray-200">
                            <Save className="w-4 h-4 mr-1" /> 保存修改
                        </button>

                        <button 
                            onClick={() => handleDelete(selectedCase.id)} 
                            className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-bold transition-colors border border-red-100"
                            title="删除案例"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">案例说明/工程背景</label>
                    <textarea 
                        value={editNotes} 
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="点击添加关于该路基案例的历史背景、病害描述等..."
                        className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                    />
                </div>
            </div>

            {/* 中部：历史分析快照 */}
            {selectedCase.results && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-blue-400" /> 历史分析快照 (Analysis Snapshot)
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-4 rounded-xl border ${selectedCase.results.finalSettlement > 50 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} flex flex-col items-center justify-center`}>
                            <span className="text-xs font-bold text-gray-500 uppercase mb-2">总累计沉降量</span>
                            <div className="flex items-baseline">
                                <span className={`text-4xl font-black ${selectedCase.results.finalSettlement > 50 ? 'text-red-600' : 'text-blue-600'}`}>
                                    {selectedCase.results.finalSettlement.toFixed(2)}
                                </span>
                                <span className="text-sm ml-1 font-bold text-gray-500">mm</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-gray-500 uppercase mb-2">剩余承载能力</span>
                            <div className="flex items-baseline text-gray-800">
                                <span className={`text-3xl font-black ${selectedCase.results.finalCapacity < 70 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {selectedCase.results.finalCapacity.toFixed(1)}
                                </span>
                                <span className="text-sm ml-1 font-bold">%</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-gray-500 uppercase mb-2">湿润锋深度</span>
                            <div className="flex items-baseline text-gray-800">
                                <span className="text-3xl font-black">{selectedCase.results.wettingFront.toFixed(2)}</span>
                                <span className="text-sm ml-1 font-bold text-gray-500">m</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 底部：归档参数配置快照 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700">归档参数配置快照 (Read-only)</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center"><Layers className="w-3 h-3 mr-1"/> 几何与地层</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>路基高度 H:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.geometry.H} m</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>分层厚度 dz:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.geometry.dz} m</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>设计模量 E_req:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.geometry.E_req} MPa</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>基础 CBR 值:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.soil.cbr}</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>压实度 K:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.soil.compaction}</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center"><Droplets className="w-3 h-3 mr-1"/> 环境与荷载</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>降雨强度:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.environment.rainfall} mm/d</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>降雨历时:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.environment.rainDays} d</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>附加荷载 q:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.load.q_load} kPa</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-1"><span>病害等级:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.diseaseLevel} 级</span></li>
                            </ul>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center text-blue-800 font-bold text-xs mb-1">
                                <Info className="w-3 h-3 mr-1" /> 归档提示
                            </div>
                            <p className="text-[10px] text-blue-600 leading-tight">
                                该快照记录了归档时的物理模型输入，点击上方“载入仿真工作台”可将这些参数一键还原至实时分析模块。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <History className="w-16 h-16 mb-4 opacity-20" />
            <p>请在左侧选择一个历史案例查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadbedHistoryLibrary;
