import React, { useState, useEffect } from 'react';
import { 
  History, Search, Calendar, Edit3, Trash2, ShieldAlert, CheckCircle, Save, 
  Layers, Droplets, Activity, PenTool, Truck, AlertTriangle, Info, ClipboardList
} from 'lucide-react';

const STORAGE_KEY = 'roadbedguard_roadbed_history';
const PENDING_LOAD_KEY = 'roadbedguard_pending_roadbed_load';

const RoadbedHistoryLibrary: React.FC = () => {
  const [historyCases, setHistoryCases] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {
        console.error("Failed to parse saved roadbed history", e);
      }
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockCases));
    }
    return mockCases;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => historyCases.length > 0 ? historyCases[0].id : null);
  const [editName, setEditName] = useState(() => {
    const selected = historyCases.find(c => c.id === (historyCases.length > 0 ? historyCases[0].id : null));
    return selected ? selected.name : '';
  });
  const [editNotes, setEditNotes] = useState(() => {
    const selected = historyCases.find(c => c.id === (historyCases.length > 0 ? historyCases[0].id : null));
    return selected ? (selected.notes || '') : '';
  });

  const [prevId, setPrevId] = useState(selectedCaseId);
  if (prevId !== selectedCaseId) {
    setPrevId(selectedCaseId);
    const selected = historyCases.find(c => c.id === selectedCaseId);
    if (selected) {
      setEditName(selected.name);
      setEditNotes(selected.notes || '');
    }
  }

  useEffect(() => {}, []);

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
  };

  const handleLoadToWorkbench = () => {
    if (!selectedCase) return;
    localStorage.setItem(PENDING_LOAD_KEY, JSON.stringify(selectedCase.params));
    alert('Scenario parameters loaded. Switch to Analysis tab to view.');
  };

  return (
    <div className="flex h-full bg-gray-100 font-sans text-gray-800">
      {/* 左侧：案例列表 */}
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col h-full z-10 shadow-sm">
        <div className="p-4 border-b border-gray-300 bg-gray-50 sticky top-0">
          <h2 className="text-sm font-bold text-gray-900 flex items-center mb-3 uppercase tracking-tight">
            <History className="w-4 h-4 mr-2 text-blue-600" />
            Roadbed Archive Explorer
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
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${
                          c.results.finalSettlement > 50 
                          ? 'bg-red-50 text-red-600 border-red-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                            {(c.results.finalSettlement ?? 0).toFixed(1)} mm
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

      {/* 右侧：详情面板 */}
      <div className="w-2/3 flex flex-col h-full bg-gray-100 overflow-hidden">
        {selectedCase ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            
            {/* 顶部：基础信息与操作 */}
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
                            onClick={handleLoadToWorkbench} 
                            className="flex items-center px-3 py-1.5 bg-blue-700 text-white hover:bg-blue-800 text-[11px] font-bold transition-all shadow-sm rounded-sm uppercase tracking-wide"
                        >
                            <Play className="w-3 h-3 mr-2" /> Load Solution
                        </button>
                        
                        <button onClick={handleSaveChanges} className="flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-[11px] font-bold transition-all rounded-sm uppercase tracking-wide">
                            <Save className="w-3.5 h-3.5 mr-2 text-blue-600" /> Commit Changes
                        </button>

                        <button 
                            onClick={() => {
                                if (window.confirm('Confirm deletion?')) handleDelete(selectedCase.id);
                            }} 
                            className="flex items-center px-2 py-1.5 bg-white border border-gray-300 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-sm font-bold"
                            title="Delete Case"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">Engineering Context / Archive Notes</label>
                    <textarea 
                        value={editNotes} 
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Add site observations, geological summaries, or maintenance history..."
                        className="w-full text-[11px] text-gray-600 border border-gray-300 rounded-sm p-3 min-h-[100px] focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-gray-50 font-mono"
                    />
                </div>
            </div>

            {/* 中部：历史分析快照 */}
            {selectedCase.results && (
                <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
                    <div className="bg-gray-100 px-4 py-1.5 border-b border-gray-300 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-gray-600 flex items-center uppercase tracking-widest">
                            <Activity className="w-4 h-4 mr-2 text-blue-600" /> Technical Data Snapshot
                        </h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 border font-mono ${
                          (selectedCase.results?.finalSettlement ?? 0) > 50 
                          ? 'bg-red-50/30 border-red-200' 
                          : 'bg-blue-50/30 border-blue-200'
                        } flex flex-col items-center justify-center rounded-sm`}>
                            <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Total Settlement</span>
                            <div className="flex items-baseline">
                                <span className={`text-4xl font-black ${(selectedCase.results?.finalSettlement ?? 0) > 50 ? 'text-red-600' : 'text-blue-700'}`}>
                                    {(selectedCase.results?.finalSettlement ?? 0).toFixed(2)}
                                </span>
                                <span className="text-[10px] ml-1 font-bold text-gray-400 uppercase">mm</span>
                            </div>
                        </div>
                        <div className="p-4 border border-gray-200 bg-gray-50 flex flex-col items-center justify-center rounded-sm font-mono">
                            <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Residual Capacity</span>
                            <div className="flex items-baseline text-gray-800">
                                <span className={`text-3xl font-black ${(selectedCase.results?.finalCapacity ?? 0) < 70 ? 'text-orange-600' : 'text-green-600'}`}>
                                    {(selectedCase.results?.finalCapacity ?? 0).toFixed(1)}
                                </span>
                                <span className="text-[10px] ml-1 font-bold">%</span>
                            </div>
                        </div>
                        <div className="p-4 border border-gray-200 bg-gray-50 flex flex-col items-center justify-center rounded-sm font-mono">
                            <span className="text-[9px] font-bold text-gray-400 uppercase mb-1">Wetting Front (Dw)</span>
                            <div className="flex items-baseline text-gray-800">
                                <span className="text-3xl font-black">{(selectedCase.results?.wettingFront ?? 0).toFixed(2)}</span>
                                <span className="text-[10px] ml-1 font-bold text-gray-400">m</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 底部：归档参数配置快照 */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden mb-4">
                <div className="bg-gray-100 px-4 py-1.5 border-b border-gray-300">
                    <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Configuration Parameters (Locked)</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-2 flex items-center tracking-widest"><Layers className="w-3 h-3 mr-1 text-gray-300"/> Geometry & Strata</h4>
                            <ul className="space-y-1.5 text-[11px] text-gray-600 font-mono">
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>HEIGHT_H:</span> <span className="font-bold text-gray-800">{selectedCase.params.geometry.H} m</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>LAYER_DZ:</span> <span className="font-bold text-gray-800">{selectedCase.params.geometry.dz} m</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>MODULUS_EREQ:</span> <span className="font-bold text-gray-800">{selectedCase.params.geometry.E_req} MPa</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>BASE_CBR:</span> <span className="font-bold text-gray-800">{selectedCase.params.soil.cbr}</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>COMPACTION_K:</span> <span className="font-bold text-gray-800">{selectedCase.params.soil.compaction}</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-2 flex items-center tracking-widest"><Droplets className="w-3 h-3 mr-1 text-gray-300"/> Environmental Load</h4>
                            <ul className="space-y-1.5 text-[11px] text-gray-600 font-mono">
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>PRECIPITATION:</span> <span className="font-bold text-gray-800">{selectedCase.params.environment.rainfall} mm/d</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>DURATION_D:</span> <span className="font-bold text-gray-800">{selectedCase.params.environment.rainDays} d</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>SURCHARGE_Q:</span> <span className="font-bold text-gray-800">{selectedCase.params.load.q_load} kPa</span></li>
                                <li className="flex justify-between border-b border-gray-50 pb-0.5"><span>DISEASE_LVL:</span> <span className="font-bold text-gray-800">{selectedCase.params.diseaseLevel}</span></li>
                            </ul>
                        </div>
                        <div className="bg-gray-50 p-3 border border-gray-300 border-l-4 border-l-blue-600">
                            <div className="flex items-center text-gray-800 font-bold text-[10px] mb-1 uppercase tracking-widest">
                                <Info className="w-3 h-3 mr-1 text-blue-600" /> Archive Integrity Trace
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight font-serif italic">
                                This snapshot stores boundary conditions fixed at archival. Re-load to solution engine for further sensitivity analysis.
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

export default RoadbedHistoryLibrary;
