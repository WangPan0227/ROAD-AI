import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Activity, ShieldCheck, AlertTriangle, Settings, 
  CloudRain, Truck, Rocket, Trophy, Info
} from 'lucide-react';
import { calculate_roadbed_settlement, RoadbedEngineParams, optimize_roadbed_reinforcement } from '../../lib/roadbedCalculations';
import { KPICard } from '../common/KPICard';

const RoadbedAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [diseaseLevel, setDiseaseLevel] = useState<number>(0);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const pending = localStorage.getItem('pending_injected_disease_subgrade_settlement');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.injectedParameters) {
            const { compaction_loss, cbr_multiplier } = parsed.injectedParameters;
            setDiseaseLevel(parsed.level || 1);
            const applied_cbr = (params.soil.cbr || 5.0) * (cbr_multiplier || 1.0);
            const applied_compaction_loss = 1.0 - (compaction_loss || 0);
            const engineParams: RoadbedEngineParams = {
              H: params.geometry.H, dz: params.geometry.dz, E_req: params.geometry.E_req,
              cbr: applied_cbr, compaction: params.soil.compaction,
              rainfall: params.environment.rainfall, rainDays: params.environment.rainDays,
              runoff_coeff: 0.8, compaction_loss: applied_compaction_loss,
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
            localStorage.removeItem('pending_injected_disease_subgrade_settlement');
          }
        } catch (e) {
          console.error("Error applying pending injected disease params", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  const renderSettlementSVG = () => {
    const settlement = results ? results.finalSettlement : 0;
    const rainFactor = params.environment.rainfall / 300;
    
    return (
      <svg width="600" height="300" viewBox="0 0 600 300" className="overflow-visible relative z-10">
        <defs>
          <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1"/>
          </pattern>
        </defs>

        <rect width="600" height="300" fill="url(#roadGrid)" />

        {/* Foundation Base */}
        <rect x="0" y="240" width="600" height="60" fill="#0f172a" />
        <line x1="0" y1="240" x2="600" y2="240" stroke="#334155" strokeWidth="1" strokeDasharray="5 5" />

        {/* Main Roadbed Structure */}
        <g className="transition-all duration-1000">
            {/* Soil Mass */}
            <path 
               d="M 50 240 L 150 80 L 450 80 L 550 240 Z" 
               fill="#1e293b" 
               stroke="#475569" 
               strokeWidth="1.5" 
            />

            {/* Infiltration Visual */}
            <path 
               d={`M 150 80 L 450 80 L 450 ${80 + Math.min(140, 20 + rainFactor * 120)} L 150 ${80 + Math.min(140, 20 + rainFactor * 120)} Z`}
               fill="#38bdf8" 
               fillOpacity={0.15} 
               className="transition-all duration-1000"
            />

            {/* Pavement with Settlement Curve */}
            <path 
               d={`M 150 80 
                  Q 300 ${80 + settlement/10} 450 80 
                  L 450 88 
                  Q 300 ${88 + settlement/10} 150 88 
                  Z`}
               fill="#334155" 
               stroke="#38bdf8" 
               strokeWidth="1.5"
               className="transition-all duration-1000"
            />
            
            {/* Centerline of pavement */}
            <path 
               d={`M 150 84 Q 300 ${84 + settlement/10} 450 84`}
               fill="none"
               stroke="#64748b"
               strokeWidth="0.5"
               strokeDasharray="4 4"
               className="transition-all duration-1000"
            />
        </g>

        {/* Dynamic Markers */}
        <g transform={`translate(300, ${84 + settlement/10})`}>
            <circle r="4" fill="#f43f5e" />
            <circle r="12" fill="none" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3 2" className="animate-ping" />
            <text x="10" y="4" fontSize="10" fontWeight="bold" fill="#f43f5e" className="font-mono">MAX_S: {settlement.toFixed(1)}mm</text>
        </g>
        
        {/* Settlement Vectors */}
        <g opacity={settlement > 10 ? 1 : 0} className="transition-opacity duration-500">
            {[180, 220, 260, 300, 340, 380, 420].map(x => (
                <path key={x} d={`M ${x} 88 L ${x} ${88 + 15}`} stroke="#f43f5e" strokeWidth="0.5" markerEnd="url(#arrow)" />
            ))}
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                </marker>
            </defs>
        </g>

        <text x="50" y="70" fontSize="10" fontWeight="bold" fill="#94a3b8" className="font-mono uppercase">Subgrade Sec. Matrix [RB_01]</text>
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* Parameter Sidebar */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-900/90">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-sky-400" /> 求解器参数矩阵 Matrix
            </h3>
          </div>
          
          <div className="flex-1 pt-3 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {/* Geometry */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">几何边界条件 Geometry</div>
            <div className="space-y-2 text-xs">
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">填筑高度 H (m)</label>
                 <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.geometry.H} onChange={e => updateParam('geometry', 'H', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">填料 CBR 值</label>
                 <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.soil.cbr} onChange={e => updateParam('soil', 'cbr', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">设计压实度 K</label>
                 <input type="number" step="0.01" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.soil.compaction} onChange={e => updateParam('soil', 'compaction', parseFloat(e.target.value))} />
               </div>
            </div>

            {/* Environmental */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">环境干扰矩阵 Environment</div>
            <div className="space-y-2 text-xs">
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">设计降雨 (mm)</label>
                 <div className="flex items-center space-x-1">
                    <CloudRain className="w-3 h-3 text-sky-400" />
                    <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.environment.rainfall} onChange={e => updateParam('environment', 'rainfall', parseFloat(e.target.value))} />
                 </div>
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">运营活载 (kN)</label>
                 <div className="flex items-center space-x-1">
                    <Truck className="w-3 h-3 text-slate-400" />
                    <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.load.q_load} onChange={e => updateParam('load', 'q_load', parseFloat(e.target.value))} />
                 </div>
               </div>
            </div>

            {/* Damage & Reinforcement */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">病害状态与拓扑加固</div>
            <div className="space-y-3">
               <div>
                 <label className="text-slate-400 text-xs mb-1 block">病害发育等级 Disease</label>
                 <select 
                   className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                   value={diseaseLevel} onChange={e => setDiseaseLevel(Number(e.target.value))}
                 >
                   <option value={0}>L0: NOMINAL 设计态</option>
                   <option value={1}>L1: ALPHA 轻微沉降</option>
                   <option value={2}>L2: BETA 结构缺陷</option>
                   <option value={3}>L3: OMEGA 系统崩溃</option>
                 </select>
               </div>
               <div>
                  <label className="text-slate-400 text-xs mb-1 block">加固逻辑演推 Scenario</label>
                  <select 
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500"
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

          <div className="pt-4 border-t border-slate-800">
            <button 
              onClick={runStatusAnalysis} disabled={isCalculating}
              className={`w-full bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center space-x-2 ${
                isCalculating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCalculating ? <Activity className="animate-spin w-4 h-4" /> : <Rocket className="w-4 h-4" />}
              <span>{isCalculating ? 'SOLVING...' : 'EXECUTE SOLVER'}</span>
            </button>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-5">
          <header className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-sky-500/10 border border-sky-500/20 flex items-center justify-center rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                </div>
                <h2 className="text-xs font-bold text-slate-100 tracking-wider uppercase">场景 1.1：路基垮塌 | 灾变演化评估系统</h2>
            </div>
            <button 
              onClick={runOptimization}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center text-xs tracking-wider shadow-lg shadow-sky-600/20"
            >
              启动加固矩阵寻优
            </button>
          </header>

          <main className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1 pb-10">
            {!results ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-500">
                 <Activity className="w-12 h-12 mb-4 animate-pulse" />
                 <p className="text-xs font-mono tracking-widest uppercase">Solver Idle: Waiting for Trigger...</p>
               </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-700">
                <div className="grid grid-cols-3 gap-4">
                  <KPICard
                    title="累计沉降 Settlement"
                    value={(results?.finalSettlement ?? 0).toFixed(2)}
                    unit="mm"
                    subtitle={results.finalSettlement > 50 ? "⚠️ 沉降量较大" : "✅ 稳态受控"}
                    status={results.finalSettlement > 50 ? 'critical' : 'safe'}
                  />
                  <KPICard
                    title="承载能力保留率 Capacity"
                    value={(results?.finalCapacity ?? 0).toFixed(1)}
                    unit="%"
                    subtitle={results.finalCapacity < 90 ? "⚡ 承载力衰减" : "✅ 充分冗余"}
                    status={results.finalCapacity < 90 ? 'warning' : 'safe'}
                  />
                  <KPICard
                    title="等效路基模量 Modulus"
                    value={(results?.E_base ?? 0).toFixed(1)}
                    unit="MPa"
                    subtitle="综合基底抗变形刚度"
                    status="neutral"
                  />
                </div>

                {results.finalCapacity < 90 && !optResults && (
                  <div className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-5 flex items-center justify-between shadow-xl backdrop-blur-md relative overflow-hidden">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center rounded-xl">
                         <AlertTriangle className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-1">CRITICAL_STATE: 核心稳定性偏离基准</h3>
                        <p className="text-xs text-slate-400 font-mono tracking-tight">检测到物理拓扑退化趋势，系统载荷冗余度低于 15%。建议立即下达寻优指令。</p>
                      </div>
                    </div>
                    <button onClick={runOptimization} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all text-xs tracking-wider shadow-lg shadow-rose-600/20">
                      下达寻优指令
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-5 items-start">
                  <div className="col-span-12 lg:col-span-12 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-center items-center relative min-h-[420px]">
                     <div className="absolute top-4 left-4 flex items-center space-x-3">
                        <div className="w-1 h-4 bg-sky-500 rounded-full" />
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Digital Twin: Cross-Sectional Geometry Matrix</h4>
                     </div>
                     
                     <div className="relative mt-6">
                       {renderSettlementSVG()}
                     </div>
                     
                     <div className="absolute right-6 bottom-6 flex items-center space-x-4 bg-slate-800/80 p-3.5 border border-slate-700/60 rounded-xl shadow-md">
                         <div className="text-right">
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Health Index</div>
                           <div className={`text-xl font-mono font-black ${results.finalCapacity < 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
                             {Math.round(results.finalCapacity)}%
                           </div>
                         </div>
                         <div className="w-10 h-10">
                           <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="10" />
                              <circle cx="50" cy="50" r="45" fill="none" stroke={results.finalCapacity < 90 ? "#f43f5e" : "#10b981"} strokeWidth="10" strokeDasharray={`${results.finalCapacity / 100 * 283} 283`} strokeLinecap="round" className="transition-all duration-1000" />
                           </svg>
                         </div>
                     </div>
                  </div>

                  <div className="col-span-12 lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md h-[320px]">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                        <Activity className="w-3.5 h-3.5 mr-2 text-sky-400" /> Deformation Sequence Analysis Trace
                      </h5>
                      <div style={{ width: '100%', height: 220 }}>
                         <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={results.timeSeries}>
                             <defs>
                               <linearGradient id="colorSky" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                               </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                             <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                             <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                             <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                             <Area type="monotone" dataKey="settlement" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorSky)" />
                           </AreaChart>
                         </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="col-span-12 lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md h-[320px] relative overflow-hidden">
                      <h5 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-6 flex items-center">
                        <Trophy className="w-3.5 h-3.5 mr-2" /> 拓扑加固效能评估报告
                      </h5>
                      {activeMeasure === 'none' ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                          <Info className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">No Active Stabilization Applied</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="flex items-center space-x-3 bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl">
                              <div className="flex items-center justify-center w-8 h-8 bg-sky-600 text-white font-black text-xs rounded-lg">
                                {activeMeasure}
                              </div>
                              <div className="text-xs font-bold text-sky-300 uppercase tracking-widest">单元矩阵已注入引擎</div>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-center">
                                 <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Gain (%)</div>
                                 <div className="text-lg font-mono font-black text-emerald-400">+42.0</div>
                              </div>
                              <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-center">
                                 <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Confidence</div>
                                 <div className="text-lg font-mono font-black text-sky-400">HIGH</div>
                              </div>
                           </div>
                           <p className="text-xs text-slate-400 leading-relaxed font-mono italic p-3 border-l-2 border-sky-500 bg-slate-800/50 rounded-r-xl">
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
