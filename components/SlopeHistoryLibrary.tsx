import React, { useState, useEffect } from 'react';
import { History, Search, Calendar, Edit3, Trash2, ShieldAlert, CheckCircle, Save, Layers, Droplets, Activity, PenTool } from 'lucide-react';

const STORAGE_KEY = 'roadbedguard_slope_history';

const SlopeHistoryLibrary: React.FC = () => {
  const [historyCases, setHistoryCases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // 加载数据
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistoryCases(parsed);
      if (parsed.length > 0) setSelectedCaseId(parsed[0].id);
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
    if (window.confirm('确定要删除这条历史记录吗？')) {
      const updated = historyCases.filter(c => c.id !== id);
      setHistoryCases(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (selectedCaseId === id) setSelectedCaseId(updated.length > 0 ? updated[0].id : null);
    }
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

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧：时间线案例列表 */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-5 border-b border-gray-200 bg-white sticky top-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4">
            <History className="w-6 h-6 mr-2 text-indigo-600" />
            边坡历史训练库
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="搜索历史归档案例..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
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
                    ? 'bg-white border-indigo-300 shadow-md ring-1 ring-indigo-100' 
                    : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
                >
                {selectedCaseId === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-gray-800 truncate pr-2">{c.name}</h3>
                    {c.results ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.results.FS0 < 1.15 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            FS: {c.results.FS0.toFixed(2)}
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

      {/* 右侧：富文本详情与编辑面板 */}
      <div className="w-2/3 flex flex-col h-full bg-gray-50">
        {selectedCase ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 顶部：基础信息编辑区 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">案例名称</label>
                        <input 
                            type="text" 
                            value={editName} 
                            onChange={e => setEditName(e.target.value)}
                            className="w-full text-xl font-bold text-gray-800 border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-500 focus:ring-0 px-0 bg-transparent transition-colors"
                        />
                    </div>
                    <div className="flex space-x-2">
                        {/* 新增：载入仿真工作台按钮 */}
                        <button 
                            onClick={() => {
                                localStorage.setItem('roadbedguard_pending_slope_load', JSON.stringify(selectedCase.params));
                                alert('案例参数已就绪！请点击左侧菜单的【仿真模拟分析】，系统将自动为您还原该场景。');
                            }} 
                            className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm font-bold transition-colors shadow-sm border border-blue-200"
                        >
                            <span className="mr-1">🚀</span> 载入仿真工作台
                        </button>
                        
                        <button onClick={handleSaveChanges} className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-sm font-bold transition-colors">
                            <Save className="w-4 h-4 mr-1" /> 保存修改
                        </button>

                        {/* 修复：绕过原生 window.confirm 拦截的强制删除逻辑 */}
                        <button 
                            onClick={() => {
                                const updated = historyCases.filter(c => c.id !== selectedCase.id);
                                setHistoryCases(updated);
                                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                                setSelectedCaseId(updated.length > 0 ? updated[0].id : null);
                            }} 
                            className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-bold transition-colors"
                            title="直接删除该归档案例"
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
                        placeholder="点击添加关于该边坡的历史维修记录、地质勘测摘要等..."
                        className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                    />
                </div>
            </div>

            {/* 中部：力学分析结果看板 */}
            {selectedCase.results && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-indigo-400" /> 历史分析快照 (Analysis Snapshot)
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-4 rounded-xl border ${selectedCase.results.FS0 < 1.15 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} flex flex-col items-center justify-center`}>
                            <span className="text-xs font-bold text-gray-500 uppercase mb-2">初始安全系数 (FS0)</span>
                            <span className={`text-4xl font-black ${selectedCase.results.FS0 < 1.15 ? 'text-red-600' : 'text-green-600'}`}>
                                {selectedCase.results.FS0.toFixed(3)}
                            </span>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-gray-500 uppercase mb-2">剩余下滑力缺口</span>
                            <div className="flex items-baseline text-gray-800">
                                <span className="text-3xl font-black">{selectedCase.results.gap.toFixed(1)}</span>
                                <span className="text-sm ml-1 font-bold">kN/m</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-gray-500 uppercase mb-2">最危险滑面特征 (Xc, Yc, R)</span>
                            <div className="text-sm font-mono text-gray-600 text-center space-y-1">
                                <div>X: {selectedCase.results.circ0[0].toFixed(2)} m</div>
                                <div>Y: {selectedCase.results.circ0[1].toFixed(2)} m</div>
                                <div>R: {selectedCase.results.circ0[2].toFixed(2)} m</div>
                            </div>
                        </div>
                    </div>

                    {/* 加固优化方案记录 */}
                    {selectedCase.results.bestScheme && (
                        <div className="border-t border-gray-100 p-6 bg-indigo-50/30">
                            <h4 className="text-sm font-bold text-indigo-800 mb-4 flex items-center">
                                <PenTool className="w-4 h-4 mr-2" /> 历史采用/推荐加固方案 (Rank 1)
                            </h4>
                            <div className="bg-white p-4 border border-indigo-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <div className="text-lg font-black text-indigo-700 mb-1">{selectedCase.results.bestScheme.Method.replace('\n', '')}</div>
                                    <div className="text-xs text-gray-500">{selectedCase.results.bestScheme.Param.replace('\n', ' | ')}</div>
                                </div>
                                <div className="flex space-x-6 text-sm">
                                    <div><span className="text-gray-400">加固后FS:</span> <span className="font-bold text-green-600">{selectedCase.results.bestScheme.FS.toFixed(3)}</span></div>
                                    <div><span className="text-gray-400">估算造价:</span> <span className="font-bold text-red-600">{selectedCase.results.bestScheme.Cost_W.toFixed(2)}万</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 底部：当时输入的物理参数快照（只读视图） */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700">归档参数配置快照 (Read-only)</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center"><Layers className="w-3 h-3 mr-1"/> 几何与地层</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex justify-between border-b border-gray-50 pb-1"><span>边坡高度:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.height} m</span></li>
                            <li className="flex justify-between border-b border-gray-50 pb-1"><span>边坡坡角:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.angle} °</span></li>
                            <li className="pt-2">
                                <span className="block mb-2 text-xs font-bold text-gray-500">地层分布 ({selectedCase.params.soilLayers.length}层):</span>
                                <div className="space-y-1">
                                    {selectedCase.params.soilLayers.map((layer:any, idx:number) => (
                                        <div key={idx} className="bg-gray-50 p-2 rounded text-xs flex justify-between">
                                            <span className="font-bold text-gray-500">L{idx+1} ({layer.thickness}m)</span>
                                            <span>γ={layer.gamma}, c={layer.c}, φ={layer.phi}</span>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center"><Droplets className="w-3 h-3 mr-1"/> 环境工况</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex justify-between border-b border-gray-50 pb-1"><span>降雨量:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.rainfall} mm</span></li>
                            <li className="flex justify-between border-b border-gray-50 pb-1"><span>地下水位:</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.groundwater} m</span></li>
                            <li className="flex justify-between border-b border-gray-50 pb-1"><span>地震系数(Kh):</span> <span className="font-mono font-bold text-gray-800">{selectedCase.params.seismicKh}</span></li>
                        </ul>
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

export default SlopeHistoryLibrary;