import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { 
  Activity, Database, ShieldCheck, AlertTriangle, Settings, 
  ArrowRight, ChevronRight, Info, CloudRain, Truck, Layers, Hammer,
  Save, History, Rocket, Trophy, DollarSign, Clock
} from 'lucide-react';
import { calculate_roadbed_settlement, RoadbedEngineParams, optimize_roadbed_reinforcement } from '../../lib/roadbedCalculations';

const RoadbedAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [diseaseLevel, setDiseaseLevel] = useState<number>(0);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<'status' | 'dashboard'>('status');
  const [optResults, setOptResults] = useState<any[] | null>(null);
  const [DISEASE_MAP] = useState<Record<number, any>>({
    0: { runoff_coeff: 0.80, compaction_loss: 1.0, desc: "0级: 完好状态" },
    1: { runoff_coeff: 0.50, compaction_loss: 0.95, desc: "1级: 轻微裂缝" },
    2: { runoff_coeff: 0.20, compaction_loss: 0.90, desc: "2级: 严重网裂" },
    3: { runoff_coeff: 0.05, compaction_loss: 0.80, desc: "3级: 积水翻浆" }
  });

  const [params, setParams] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_roadbed_load') : null;
    if (pendingLoad) {
      try {
        return JSON.parse(pendingLoad);
      } catch (e) {
        console.error("Failed to parse pending roadbed load", e);
      }
    }
    return {
      geometry: { H: 6.0, dz: 0.2, E_req: 40.0 },
      soil: { gamma: 19.0, cbr: 5.0, compaction: 0.94 },
      environment: { rainfall: 120.0, rainDays: 3 },
      load: { q_load: 20.0 }
    };
  });
  const [results, setResults] = useState<any>(() => {
    const engineParams: RoadbedEngineParams = {
      H: params.geometry.H, dz: params.geometry.dz, E_req: params.geometry.E_req,
      cbr: params.soil.cbr, compaction: params.soil.compaction,
      rainfall: params.environment.rainfall, rainDays: params.environment.rainDays,
      runoff_coeff: 0.8, 
      compaction_loss: 1.0,
      q_load: params.load.q_load, gamma: params.soil.gamma
    };
    const engineResults = calculate_roadbed_settlement(engineParams);
    const timeSeriesData = engineResults.times.map((day, index) => ({
      day: day, 
      settlement: Number(engineResults.settlement_series[index].toFixed(2)), 
      capacity: Number(engineResults.capacity_series[index].toFixed(1))
    }));
    
    if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_roadbed_load')) {
       localStorage.removeItem('roadbedguard_pending_roadbed_load');
    }

    return {
      timeSeries: timeSeriesData, 
      finalSettlement: engineResults.final_settlement, 
      finalCapacity: engineResults.final_capacity, 
      E_base: engineResults.E_base
    };
  });

  const updateParam = (group: string, key: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [group]: { ...(prev as any)[group], [key]: value }
    }));
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    let applied_runoff = DISEASE_MAP[diseaseLevel]?.runoff_coeff || 0.8;
    let applied_compaction_loss = DISEASE_MAP[diseaseLevel]?.compaction_loss || 1.0;
    let applied_cbr = params.soil.cbr;
    let applied_compaction = params.soil.compaction;

    if (activeMeasure !== 'none') {
        applied_runoff = 0.80;
        applied_compaction_loss = 1.0;
        if (activeMeasure === 'S1') applied_compaction = Math.max(applied_compaction, 0.93);
        else if (activeMeasure === 'S2') { applied_compaction = Math.max(applied_compaction, 0.96); applied_cbr *= 1.2; }
        else if (activeMeasure === 'S3') { applied_compaction = 0.96; applied_cbr *= 1.3; }
        else if (activeMeasure === 'S4') { applied_compaction = 0.98; applied_cbr *= 2.0; }
    }

    const engineParams: RoadbedEngineParams = {
      H: params.geometry.H, dz: params.geometry.dz, E_req: params.geometry.E_req,
      cbr: applied_cbr, compaction: applied_compaction,
      rainfall: params.environment.rainfall, rainDays: params.environment.rainDays,
      runoff_coeff: applied_runoff, compaction_loss: applied_compaction_loss,
      q_load: params.load.q_load, gamma: params.soil.gamma
    };

    const engineResults = calculate_roadbed_settlement(engineParams);
    const timeSeriesData = engineResults.times.map((day, index) => ({
      day: day, 
      settlement: Number(engineResults.settlement_series[index].toFixed(2)), 
      capacity: Number(engineResults.capacity_series[index].toFixed(1))
    }));

    setResults({
      timeSeries: timeSeriesData, 
      finalSettlement: engineResults.final_settlement, 
      finalCapacity: engineResults.final_capacity, 
      E_base: engineResults.E_base
    });
    setIsCalculating(false);
  };

  const runOptimization = () => {
    setIsCalculating(true);
    const ecoConfigStr = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_roadbed_economics') : null;
    const ecoConfig = ecoConfigStr ? JSON.parse(ecoConfigStr) : {};
    const engineParams = {
      H: params.geometry.H, dz: params.geometry.dz, E_req: params.geometry.E_req,
      cbr: params.soil.cbr, compaction: params.soil.compaction,
      rainfall: params.environment.rainfall, rainDays: params.environment.rainDays,
      runoff_coeff: DISEASE_MAP[diseaseLevel]?.runoff_coeff || 0.8,
      compaction_loss: DISEASE_MAP[diseaseLevel]?.compaction_loss || 1.0,
      q_load: params.load.q_load, gamma: params.soil.gamma
    };
    const rankedSchemes = optimize_roadbed_reinforcement(engineParams, ecoConfig);
    setOptResults(rankedSchemes);
    setIsCalculating(false);
  };

  useEffect(() => {}, []);

  const renderSettlementSVG = () => {
    const settlement = results ? results.finalSettlement : 0;
    const rainFactor = params.environment.rainfall / 300;
    
    return (
      <svg width="600" height="300" viewBox="0 0 600 300" className="overflow-visible relative z-10">
        <defs>
          <filter id="soilNoise" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#fef3c7" surfaceScale="1">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
          </filter>

          <filter id="roadConcreteNoise" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#f8fafc" surfaceScale="1">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
          </filter>

          <pattern id="soilTexture" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
             <rect width="100" height="100" fill="#f5f5f4" filter="url(#soilNoise)" opacity="0.4" />
             <path d="M 0 0 Q 25 10 50 0 T 100 0" fill="none" stroke="#e7e5e4" strokeWidth="0.5" opacity="0.3" />
          </pattern>
          
          <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
          </pattern>
        </defs>

        <rect width="600" height="300" fill="url(#roadGrid)" />

        {/* Foundation Base */}
        <rect x="0" y="240" width="600" height="60" fill="#f5f5f4" filter="url(#soilNoise)" opacity="0.6" />
        <line x1="0" y1="240" x2="600" y2="240" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="5 5" />

        {/* Main Roadbed Structure */}
        <g className="transition-all duration-1000">
            {/* Soil Mass */}
            <path 
               d="M 50 240 L 150 80 L 450 80 L 550 240 Z" 
               fill="url(#soilTexture)" 
               stroke="#d6d3d1" 
               strokeWidth="1.5" 
            />

            {/* Infiltration Visual */}
            <path 
               d={`M 150 80 L 450 80 L 450 ${80 + Math.min(140, 20 + rainFactor * 120)} L 150 ${80 + Math.min(140, 20 + rainFactor * 120)} Z`}
               fill="#3b82f6" 
               fillOpacity={0.08} 
               className="transition-all duration-1000"
            />

            {/* Pavement with Settlement Curve */}
            {/* The settlement causes a dip in the middle */}
            <path 
               d={`M 150 80 
                  Q 300 ${80 + settlement/10} 450 80 
                  L 450 88 
                  Q 300 ${88 + settlement/10} 150 88 
                  Z`}
               fill="white" 
               stroke="#475569" 
               strokeWidth="1.5"
               filter="url(#roadConcreteNoise)"
               className="transition-all duration-1000"
            />
            
            {/* Centerline of pavement */}
            <path 
               d={`M 150 84 Q 300 ${84 + settlement/10} 450 84`}
               fill="none"
               stroke="#94a3b8"
               strokeWidth="0.5"
               strokeDasharray="4 4"
               className="transition-all duration-1000"
            />
        </g>

        {/* Dynamic Markers */}
        <g transform={`translate(300, ${84 + settlement/10})`}>
            <circle r="4" fill="#ef4444" />
            <circle r="12" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" className="animate-ping" />
            <text x="10" y="4" fontSize="9" fontWeight="bold" fill="#ef4444" className="font-mono">MAX_S: {settlement.toFixed(1)}mm</text>
        </g>
        
        {/* Settlement Vectors */}
        <g opacity={settlement > 10 ? 1 : 0} className="transition-opacity duration-500">
            {[180, 220, 260, 300, 340, 380, 420].map(x => (
                <path key={x} d={`M ${x} 88 L ${x} ${88 + 15}`} stroke="#ef4444" strokeWidth="0.5" markerEnd="url(#arrow)" />
            ))}
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
            </defs>
        </g>

        <text x="50" y="70" fontSize="9" fontWeight="bold" fill="#94a3b8" className="font-mono uppercase">Subgrade Sec. Matrix [RB_01]</text>
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Parameter Sidebar */}
        <div className="w-80 bg-white border-r border-gray-300 flex flex-col overflow-hidden relative shadow-sm">
          <div className="p-3 border-b border-gray-300 bg-gray-50 flex items-center justify-between sticky top-0 z-10">
            <h3 className="section-title border-none p-0 bg-transparent flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 求解器参数矩阵 Matrix
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Geometry */}
            <div className="section-title border-t-0">几何边界条件 Geometry</div>
            <div className="grid grid-cols-1 divide-y divide-gray-200">
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">填筑高度 H (m)</label>
                 <input type="number" className="w-16 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.geometry.H} onChange={e => updateParam('geometry', 'H', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">填料 CBR 值</label>
                 <input type="number" className="w-16 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.soil.cbr} onChange={e => updateParam('soil', 'cbr', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">设计压实度 K</label>
                 <input type="number" step="0.01" className="w-16 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.soil.compaction} onChange={e => updateParam('soil', 'compaction', parseFloat(e.target.value))} />
               </div>
            </div>

            {/* Environmental */}
            <div className="section-title">环境干扰矩阵 Environment</div>
            <div className="grid grid-cols-1 divide-y divide-gray-200">
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">设计降雨 (mm)</label>
                 <div className="flex items-center space-x-1">
                    <CloudRain className="w-3 h-3 text-blue-400" />
                    <input type="number" className="w-16 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.environment.rainfall} onChange={e => updateParam('environment', 'rainfall', parseFloat(e.target.value))} />
                 </div>
               </div>
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">运营活载 (kN)</label>
                 <div className="flex items-center space-x-1">
                    <Truck className="w-3 h-3 text-gray-400" />
                    <input type="number" className="w-16 bg-transparent border-none text-right focus:ring-0 text-gray-700 font-mono text-sm font-bold p-0" value={params.load.q_load} onChange={e => updateParam('load', 'q_load', parseFloat(e.target.value))} />
                 </div>
               </div>
            </div>

            {/* Damage & Reinforcement */}
            <div className="section-title">病害状态与拓扑加固</div>
            <div className="p-3 space-y-3">
               <div>
                 <label className="prop-label mb-2 block">病害发育等级 Disease</label>
                 <select 
                   className="w-full bg-gray-50 border border-gray-300 rounded-sm p-2 text-[11px] font-bold text-gray-700 uppercase outline-none focus:border-blue-500 transition-all font-mono"
                   value={diseaseLevel} onChange={e => setDiseaseLevel(Number(e.target.value))}
                 >
                   <option value={0}>L0: NOMINAL 设计态</option>
                   <option value={1}>L1: ALPHA 轻微沉降</option>
                   <option value={2}>L2: BETA 结构缺陷</option>
                   <option value={3}>L3: OMEGA 系统崩溃</option>
                 </select>
               </div>
               <div>
                  <label className="prop-label mb-2 block">加固逻辑演推 Scenario</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-300 rounded-sm p-2 text-[11px] font-bold text-gray-700 uppercase outline-none focus:border-blue-500 transition-all font-mono"
                    value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}
                  >
                    <option value="none">BASELINE: 无养护措施</option>
                    <option value="S1">S1: 原位高能压实</option>
                    <option value="S2">S2: 聚合物补偿</option>
                    <option value="S3">S3: 水气置换桩</option>
                    <option value="S4">S4: 深层刚度托换</option>
                  </select>
               </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-300 bg-gray-50">
            <button 
              onClick={runStatusAnalysis} disabled={isCalculating}
              className={`w-full py-2.5 rounded-sm font-bold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm ${isCalculating ? 'bg-gray-300 text-gray-500' : 'bg-gray-800 hover:bg-black text-white'}`}
            >
              {isCalculating ? <Activity className="animate-spin w-4 h-4" /> : <Rocket className="w-4 h-4" />}
              <span>{isCalculating ? 'SOLVING...' : 'EXECUTE SOLVER'}</span>
            </button>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-white border-b border-gray-300 px-6 flex items-center justify-between shadow-sm relative z-20">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 border border-blue-200 flex items-center justify-center rounded-sm">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xs font-bold text-gray-800 tracking-wider uppercase">InfraGuard® 路基灾变演化评估系统 v4.2</h2>
            </div>
            <button 
              onClick={runOptimization}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-1.5 rounded-sm font-bold transition-all flex items-center text-[10px] uppercase tracking-widest border border-gray-300 shadow-sm"
            >
              启动加固矩阵寻优
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar space-y-6">
            {!results ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-300">
                 <Activity className="w-12 h-12 mb-4 animate-pulse" />
                 <p className="text-[10px] font-mono tracking-[0.2em] uppercase">Solver Idle: Waiting for Trigger...</p>
               </div>
            ) : (
              <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-300 p-5 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">累计沉降 Settlement (mm)</p>
                    <p className={`text-2xl font-mono font-bold italic ${results.finalSettlement > 50 ? 'text-red-600' : 'text-gray-800'}`}>
                      {(results?.finalSettlement ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-300 p-5 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">承载能力保留率 Capacity</p>
                    <p className="text-2xl font-mono font-bold text-emerald-600 italic">
                      {(results?.finalCapacity ?? 0).toFixed(1)} <small className="text-[10px]">%</small>
                    </p>
                  </div>
                  <div className="bg-white border border-gray-300 p-5 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">等效路基模量 Modulus</p>
                    <p className="text-2xl font-mono font-bold text-blue-600 italic">
                      {(results?.E_base ?? 0).toFixed(1)} <small className="text-[10px]">MPa</small>
                    </p>
                  </div>
                </div>

                {results.finalCapacity < 90 && !optResults && (
                  <div className="bg-white border border-red-300 p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                    <div className="absolute left-0 top-0 h-full w-1 bg-red-600" />
                    <div className="flex items-center space-x-6 relative z-10">
                      <div className="w-10 h-10 bg-red-50 border border-red-200 flex items-center justify-center rounded-sm">
                         <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-1">CRITICAL_STATE: 核心稳定性偏离基准</h3>
                        <p className="text-[10px] text-gray-500 font-mono tracking-tight uppercase">检测到物理拓扑退化趋势，系统载荷冗余度低于 15%。建议立即下达寻优指令。</p>
                      </div>
                    </div>
                    <button onClick={runOptimization} className="px-6 py-2 bg-red-600 hover:bg-black text-white rounded-sm font-bold transition-all text-[10px] uppercase tracking-widest shadow-sm active:scale-95">
                      下达寻优指令
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-12 lg:col-span-12 bg-white border border-gray-300 p-10 shadow-sm flex flex-col justify-center items-center relative min-h-[500px]">
                     <div className="absolute top-4 left-4 flex items-center space-x-3">
                        <div className="w-1 h-4 bg-blue-600" />
                        <h4 className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Digital Twin: Cross-Sectional Geometry Matrix</h4>
                     </div>
                     
                     <div className="relative">
                       {renderSettlementSVG()}
                     </div>
                     
                     <div className="absolute right-8 bottom-8 flex items-center space-x-4 bg-gray-50 p-4 border border-gray-200 shadow-sm">
                         <div className="text-right">
                           <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Health Index</div>
                           <div className={`text-xl font-mono font-black ${results.finalCapacity < 90 ? 'text-red-600' : 'text-emerald-600'}`}>
                             {Math.round(results.finalCapacity)}%
                           </div>
                         </div>
                         <div className="w-12 h-12">
                           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                              <circle cx="50" cy="50" r="45" fill="none" stroke={results.finalCapacity < 90 ? "#dc2626" : "#059669"} strokeWidth="10" strokeDasharray={`${results.finalCapacity / 100 * 283} 283`} strokeLinecap="round" className="transition-all duration-1000" />
                           </svg>
                         </div>
                     </div>
                  </div>

                  <div className="col-span-12 lg:col-span-7 bg-white border border-gray-300 p-6 shadow-sm h-[320px]">
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center">
                        <Activity className="w-3.5 h-3.5 mr-2" /> Deformation Sequence Analysis Trace
                      </h5>
                      <div style={{ width: '100%', height: 220 }}>
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={results.timeSeries}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                             <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                             <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px' }} />
                             <Area type="monotone" dataKey="settlement" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.05} fill="#3b82f6" />
                           </AreaChart>
                         </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="col-span-12 lg:col-span-5 bg-white border border-gray-300 p-6 shadow-sm h-[320px] relative overflow-hidden">
                      <h5 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-8 flex items-center">
                        <Trophy className="w-3.5 h-3.5 mr-2" /> 拓扑加固效能评估报告
                      </h5>
                      {activeMeasure === 'none' ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-300 border border-dashed border-gray-200 rounded-sm">
                          <Info className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-[9px] font-bold uppercase tracking-widest">No Active Stabilization Applied</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 p-4 rounded-sm">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-black text-xs">
                                {activeMeasure}
                              </div>
                              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">单元矩阵已注入引擎</div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-sm text-center">
                                 <div className="text-[8px] font-bold text-gray-400 uppercase mb-1">Gain (%)</div>
                                 <div className="text-lg font-mono font-black text-emerald-600">+42.0</div>
                              </div>
                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-sm text-center">
                                 <div className="text-[8px] font-bold text-gray-400 uppercase mb-1">Confidence</div>
                                 <div className="text-lg font-mono font-black text-blue-600">HIGH</div>
                              </div>
                           </div>
                           <p className="text-[9px] text-gray-500 leading-relaxed uppercase font-mono italic p-3 border-l-2 border-blue-500 bg-gray-50">
                             REPORT_SUMM: Stiffness increment detected across Z-axis. Hydromechanical resistance prioritized for L{diseaseLevel} state.
                           </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default RoadbedAnalysis;
