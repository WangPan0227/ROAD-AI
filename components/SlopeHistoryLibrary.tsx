import React, { useState } from 'react';
import { History, Search, Calendar, Trash2, Save, Layers, Droplets, Activity, Play, ShieldCheck, Database } from 'lucide-react';

const STORAGE_KEY = 'roadbedguard_slope_history';

const SlopeHistoryLibrary: React.FC = () => {
  const [historyCases, setHistoryCases] = useState<any[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {
        console.error("Failed to parse saved slope history", e);
      }
    }
    return [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed[0].id : null;
      } catch (e) {
        console.error("Failed to parse saved slope history for id", e);
      }
    }
    return null;
  });
  const [editName, setEditName] = useState(() => {
    const selected = historyCases.find(c => c.id === selectedCaseId);
    return selected ? selected.name : '';
  });
  const [editNotes, setEditNotes] = useState(() => {
    const selected = historyCases.find(c => c.id === selectedCaseId);
    return selected ? (selected.notes || '') : '';
  });

  // 当选中项改变时，同步编辑框内容
  const [prevId, setPrevId] = useState(selectedCaseId);
  if (prevId !== selectedCaseId) {
    setPrevId(selectedCaseId);
    const selected = historyCases.find(c => c.id === selectedCaseId);
    if (selected) {
      setEditName(selected.name);
      setEditNotes(selected.notes || '');
    }
  }

  const filteredCases = historyCases.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.date.includes(searchTerm)
  );

  const selectedCase = historyCases.find(c => c.id === selectedCaseId);

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
    <div className="flex h-full bg-gray-100 font-sans text-gray-800">
      {/* 左侧：时间线案例列表 */}
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col h-full z-10 shadow-sm">
        <div className="p-4 border-b border-gray-300 bg-gray-50 sticky top-0">
          <h2 className="text-sm font-bold text-gray-900 flex items-center mb-3 uppercase tracking-tight">
            <History className="w-4 h-4 mr-2 text-blue-600" />
            Archive Explorer
          </h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search history archives..." 
              className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-sm text-[11px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50 custom-scrollbar">
          {filteredCases.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-[10px] uppercase font-bold tracking-widest opacity-50">Empty Archive</div>
          ) : (
            filteredCases.map(c => (
                <div 
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`p-3 rounded-sm cursor-pointer transition-all border relative overflow-hidden group ${
                    selectedCaseId === c.id 
                    ? 'bg-white border-blue-600 shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-gray-400'
                }`}
                >
                <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold text-[11px] truncate pr-2 ${selectedCaseId === c.id ? 'text-blue-700' : 'text-gray-700'}`}>{c.name}</h3>
                    {c.results ? (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm border ${
                          (c.results?.FS0 ?? 0) < 1.15 
                          ? 'bg-red-50 text-red-600 border-red-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                            FS: {(c.results?.FS0 ?? 0).toFixed(2)}
                        </span>
                    ) : (
                        <span className="text-[9px] text-gray-400 font-bold uppercase">UNSET</span>
                    )}
                </div>
                <div className="flex items-center text-[10px] text-gray-400 font-mono">
                    <Calendar className="w-3 h-3 mr-1 opacity-50" /> {c.date}
                </div>
                </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧：富文本详情与编辑面板 */}
      <div className="w-2/3 flex flex-col h-full bg-gray-100 overflow-hidden">
        {selectedCase ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            
            {/* 顶部：基础信息编辑区 */}
            <div className="bg-white p-4 border border-gray-300 shadow-sm rounded-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-6">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">Snapshot Identity</label>
                        <input 
                            type="text" 
                            value={editName} 
                            onChange={e => setEditName(e.target.value)}
                            className="w-full text-base font-bold text-gray-900 border-0 border-b border-transparent hover:border-gray-200 focus:border-blue-600 focus:ring-0 px-0 bg-transparent transition-colors uppercase tracking-tight"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => {
                                localStorage.setItem('roadbedguard_pending_slope_load', JSON.stringify(selectedCase.params));
                                alert('Scenario parameters loaded. Switch to Analysis tab to view.');
                            }} 
                            className="flex items-center px-3 py-1.5 bg-blue-700 text-white hover:bg-blue-800 text-[11px] font-bold transition-all shadow-sm rounded-sm uppercase tracking-wide"
                        >
                            <Play className="w-3 h-3 mr-2" /> Load Solution
                        </button>
                        
                        <button onClick={handleSaveChanges} className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-[11px] font-bold transition-all rounded-sm uppercase tracking-wide">
                            <Save className="w-3.5 h-3.5 mr-2 text-blue-600" /> Commit Changes
                        </button>

                        <button 
                            onClick={() => {
                                if (window.confirm('IRREVERSIBLE: Delete this archive?')) {
                                  const updated = historyCases.filter(c => c.id !== selectedCase.id);
                                  setHistoryCases(updated);
                                  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                                  setSelectedCaseId(updated.length > 0 ? updated[0].id : null);
                                }
                            }} 
                            className="flex items-center px-2 py-1.5 bg-white border border-gray-300 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-sm"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">Engineering Context / Notes</label>
                    <textarea 
                        value={editNotes} 
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Add site observations, geological summaries, or maintenance history..."
                        className="w-full text-[11px] text-gray-600 border border-gray-300 rounded-sm p-3 min-h-[80px] focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-gray-50 font-mono"
                    />
                </div>
            </div>

            {/* 中部：力学分析结果看板 */}
            {selectedCase.results && (
                <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
                    <div className="bg-gray-100 px-4 py-1.5 border-b border-gray-300 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-gray-600 flex items-center uppercase tracking-widest">
                            <Activity className="w-3 h-3 mr-2 text-blue-600" /> Result Matrix Snapshot
                        </h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 border font-mono ${
                          (selectedCase.results?.FS0 ?? 0) < 1.15 
                          ? 'bg-red-50/30 border-red-200' 
                          : 'bg-blue-50/30 border-blue-200'
                        } flex flex-col items-center justify-center rounded-sm`}>
                            <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Safety Factor (FS0)</span>
                            <span className={`text-4xl font-black ${(selectedCase.results?.FS0 ?? 0) < 1.15 ? 'text-red-600' : 'text-blue-700'}`}>
                                {(selectedCase.results?.FS0 ?? 0).toFixed(3)}
                            </span>
                        </div>
                        <div className="p-4 border border-gray-200 bg-gray-50 flex flex-col items-center justify-center rounded-sm font-mono">
                            <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Residual Force Gap</span>
                            <div className="flex items-baseline text-gray-800">
                                <span className="text-2xl font-black">{(selectedCase.results?.gap ?? 0).toFixed(1)}</span>
                                <span className="text-[10px] ml-1 font-bold text-gray-400">kN/m</span>
                            </div>
                        </div>
                        <div className="p-4 border border-gray-200 bg-gray-50 flex flex-col items-center justify-center rounded-sm font-mono">
                            <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Critical Surface (X,Y,R)</span>
                            <div className="text-[10px] text-gray-600 text-center space-y-0.5">
                                <div className="border-b border-gray-200 pb-0.5">X: {(selectedCase.results?.circ0?.[0] ?? 0).toFixed(2)}</div>
                                <div className="border-b border-gray-200 pb-0.5">Y: {(selectedCase.results?.circ0?.[1] ?? 0).toFixed(2)}</div>
                                <div>R: {(selectedCase.results?.circ0?.[2] ?? 0).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* 加固优化方案记录 */}
                    {selectedCase.results.bestScheme && (
                        <div className="border-t border-gray-300 p-4 bg-gray-50/50">
                            <h4 className="text-[10px] font-bold text-gray-600 mb-3 flex items-center uppercase tracking-widest">
                                <ShieldCheck className="w-3.5 h-3.5 mr-2 text-blue-600" /> Optimal Remediation Trace (Rank 1)
                            </h4>
                            <div className="bg-white p-3 border border-gray-300 rounded-sm flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <div className="text-sm font-bold text-blue-700 uppercase tracking-tight">{selectedCase.results.bestScheme.Method.replace('\n', '')}</div>
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedCase.results.bestScheme.Param.replace('\n', ' | ')}</div>
                                </div>
                                <div className="flex space-x-6 text-[11px] font-mono">
                                    <div><span className="text-gray-400 uppercase">FS+:</span> <span className="font-bold text-blue-700">{(selectedCase.results.bestScheme.FS ?? 0).toFixed(3)}</span></div>
                                    <div><span className="text-gray-400 uppercase">EST. COST:</span> <span className="font-bold text-red-600">{(selectedCase.results.bestScheme.Cost_W ?? 0).toFixed(2)}w</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 底部：当时输入的物理参数快照（只读视图） */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden mb-4">
                <div className="bg-gray-100 px-4 py-1.5 border-b border-gray-300">
                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Parameter Configuration Snapshot (Locked)</h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-2 flex items-center tracking-widest"><Layers className="w-3 h-3 mr-1 text-gray-300"/> Geometry & Soil</h4>
                        <ul className="space-y-1.5 text-[11px] text-gray-600 font-mono">
                            <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>SLOPE_HEIGHT:</span> <span className="font-bold text-gray-800">{selectedCase.params.height} m</span></li>
                            <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>SLOPE_ANGLE:</span> <span className="font-bold text-gray-800">{selectedCase.params.angle} °</span></li>
                            <li className="pt-1">
                                <span className="block mb-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">STRATA_DISTRIBUTION ({selectedCase.params.soilLayers.length}):</span>
                                <div className="space-y-1">
                                    {selectedCase.params.soilLayers.map((layer:any, idx:number) => (
                                        <div key={idx} className="bg-gray-50 p-2 border border-gray-200 rounded-sm flex justify-between tracking-tighter">
                                            <span className="font-bold text-blue-700">L{idx+1} ({layer.thickness}m)</span>
                                            <span>γ:{layer.gamma} / c:{layer.c} / φ:{layer.phi}</span>
                                        </div>
                                    ))}
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-2 flex items-center tracking-widest"><Droplets className="w-3 h-3 mr-1 text-gray-300"/> Environmental Drivers</h4>
                        <ul className="space-y-1.5 text-[11px] text-gray-600 font-mono">
                            <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>RAINFALL_INTENSITY:</span> <span className="font-bold text-gray-800">{selectedCase.params.rainfall} mm</span></li>
                            <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>GROUNDWATER_ELEV:</span> <span className="font-bold text-gray-800">{selectedCase.params.groundwater} m</span></li>
                            <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>SEISMIC_COEFF_KH:</span> <span className="font-bold text-gray-800">{selectedCase.params.seismicKh}</span></li>
                        </ul>
                        <div className="mt-4 bg-gray-50 p-3 border border-gray-300 border-l-4 border-l-blue-600">
                            <h5 className="text-[10px] font-bold text-gray-800 uppercase tracking-widest flex items-center italic">
                                <Database className="w-3 h-3 mr-1" /> Data Integrity
                            </h5>
                            <p className="text-[10px] text-gray-500 mt-1 leading-tight font-serif italic">
                                This record preserves initial boundary conditions at time of archival. Parameters are immutable for verification consistency.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50">
            <div className="relative mb-4">
              <History className="w-12 h-12 opacity-10" />
            </div>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-50">Select Archive to View Trace</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlopeHistoryLibrary;