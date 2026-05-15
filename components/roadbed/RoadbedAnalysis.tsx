import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts';
import { 
  Activity, Database, ShieldCheck, AlertTriangle, Settings, 
  ArrowRight, Info, CloudRain, Truck, Layers, Hammer,
  Save, History, Rocket, Trophy, DollarSign, Clock
} from 'lucide-react';
import { calculate_roadbed_settlement, RoadbedEngineParams, optimize_roadbed_reinforcement } from '../../lib/roadbedCalculations';

const RoadbedAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [diseaseLevel, setDiseaseLevel] = useState<number>(0);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<'status' | 'dashboard'>('status');
  const [results, setResults] = useState<any>(null);
  const [optResults, setOptResults] = useState<any[] | null>(null);
  const [DISEASE_MAP] = useState<Record<number, any>>({
    0: { runoff_coeff: 0.80, compaction_loss: 1.0, desc: "0级: 完好状态" },
    1: { runoff_coeff: 0.50, compaction_loss: 0.95, desc: "1级: 轻微裂缝" },
    2: { runoff_coeff: 0.20, compaction_loss: 0.90, desc: "2级: 严重网裂" },
    3: { runoff_coeff: 0.05, compaction_loss: 0.80, desc: "3级: 积水翻浆" }
  });

  const [params, setParams] = useState({
    geometry: { H: 6.0, dz: 0.2, E_req: 40.0 },
    soil: { gamma: 19.0, cbr: 5.0, compaction: 0.94 },
    environment: { rainfall: 120.0, rainDays: 3 },
    load: { q_load: 20.0 }
  });

  const updateParam = (group: string, key: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [group]: { ...(prev as any)[group], [key]: value }
    }));
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
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
    }, 600); 
  };

  const runOptimization = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const ecoConfigStr = localStorage.getItem('roadbedguard_roadbed_economics');
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
    }, 800);
  };

  useEffect(() => { runStatusAnalysis(); }, []);

  const renderSettlementSVG = () => {
    const settlement = results ? results.finalSettlement : 0;
    const rainFactor = params.environment.rainfall / 300;
    
    return (
      <svg width="480" height="240" viewBox="0 0 480 240" className="overflow-visible filter drop-shadow-2xl">
        <defs>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="waterInfil" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset={`${Math.min(100, 20 + rainFactor * 80)}%`} stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Foundation */}
        <rect x="0" y="180" width="480" height="60" fill="#0f172a" />
        <line x1="0" y1="180" x2="480" y2="180" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

        {/* Subgrade with Infiltration Gradient */}
        <path 
           d="M 60 180 L 140 60 L 340 60 L 420 180 Z" 
           fill="url(#roadGradient)" 
           stroke="#334155" 
           strokeWidth="2" 
        />
        <path 
           d="M 60 180 L 140 60 L 340 60 L 420 180 Z" 
           fill="url(#waterInfil)" 
           className="transition-all duration-1000"
        />

        {/* Pavement with Dynamic Settlement */}
        <path 
           d={`M 140 ${60 + settlement} L 340 ${60 + settlement} L 340 70 L 140 70 Z`}
           fill="#475569" 
           stroke="#94a3b8" 
           strokeWidth="1"
           className="transition-all duration-1000"
        />

        {/* Settlement Curve */}
        <path 
          d={`M 140 60 Q 240 ${60 + settlement * 2.5} 340 60`}
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="2" 
          strokeDasharray="4 2"
          filter="url(#glow)"
          opacity={settlement > 0 ? 1 : 0}
          className="transition-all duration-1000"
        />

        {/* Text Labels */}
        <text x="240" y="50" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold" className="uppercase tracking-widest">Pavement Surface</text>
        <text x="240" y="130" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="black" opacity={rainFactor} filter="url(#glow)">SATURATED ZONE</text>
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-6 overflow-hidden bg-slate-950 text-slate-300">
      <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl shadow-2xl border border-slate-800 flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
            <h3 className="font-bold text-blue-400 text-sm tracking-widest uppercase">仿真推演引擎配置</h3>
            <Settings className="w-4 h-4 text-blue-500" />
          </div>
          
          <div className="p-4 space-y-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Layers className="w-3.5 h-3.5 mr-2 text-blue-500" /> 几何与填料参数
              </h4>
              <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">路面高度 H (m)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={params.geometry.H} onChange={e => updateParam('geometry', 'H', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">CBR 值</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={params.soil.cbr} onChange={e => updateParam('soil', 'cbr', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">压实度 K</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={params.soil.compaction} onChange={e => updateParam('soil', 'compaction', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <CloudRain className="w-3.5 h-3.5 mr-2 text-blue-500" /> 环境与荷载注入
              </h4>
              <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">日降雨量 (mm)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={params.environment.rainfall} onChange={e => updateParam('environment', 'rainfall', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">附加荷载 (kN)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={params.load.q_load} onChange={e => updateParam('load', 'q_load', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-2 text-orange-500" /> 现状病害等级
              </h4>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-orange-400 font-bold outline-none focus:border-orange-500"
                value={diseaseLevel} onChange={e => setDiseaseLevel(Number(e.target.value))}
              >
                <option value={0} className="bg-slate-900">0级：结构完好</option>
                <option value={1} className="bg-slate-900">1级：轻微开裂</option>
                <option value={2} className="bg-slate-900">2级：严重网裂</option>
                <option value={3} className="bg-slate-900">3级：积水翻浆</option>
              </select>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Hammer className="w-3.5 h-3.5 mr-2 text-emerald-500" /> 加固方案 What-If
              </h4>
              <select 
                className="w-full bg-slate-900 border border-emerald-500/20 rounded-lg p-2 text-xs text-emerald-400 font-bold outline-none focus:border-emerald-500"
                value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}
              >
                <option value="none" className="bg-slate-900">空措施 (Natural Decay)</option>
                <option value="S1" className="bg-slate-900">原槽换填与封闭</option>
                <option value="S2" className="bg-slate-900">高聚物无损注浆</option>
                <option value="S3" className="bg-slate-900">注浆联合深层排水</option>
                <option value="S4" className="bg-slate-900">微型桩桩群加固</option>
              </select>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/80 sticky bottom-0 z-10">
            <button 
              onClick={runStatusAnalysis} disabled={isCalculating}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform active:scale-95 disabled:opacity-50 flex justify-center items-center text-xs tracking-widest uppercase"
            >
              {isCalculating ? <Activity className="animate-spin mr-2 h-4 w-4" /> : 'Run Multiphysics Solver'}
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-9 flex flex-col h-full bg-slate-900/30 rounded-xl shadow-2xl border border-slate-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-scan pointer-events-none" />
        
        <div className="bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-800 flex justify-between items-center z-10">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Rocket className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 tracking-wider mb-0.5 uppercase">Roadbed Guard | 高模量路基服役监测分析系统</h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">Coupled Hydro-Mechanical Evaluation Core v4.0</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <div className="h-8 border-r border-slate-800" />
             <div className="text-right">
                <div className="text-[8px] text-slate-500 font-bold uppercase">引擎状态</div>
                <div className="flex items-center text-[10px] text-emerald-400 font-mono">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                   NOMINAL
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20 custom-scrollbar">
          {!results ? (
             <div className="h-full flex flex-col items-center justify-center opacity-30">
               <Activity className="w-12 h-12 text-slate-700 animate-pulse mb-4" />
               <p className="text-xs font-mono tracking-widest text-slate-600 uppercase">等待仿真指令注入...</p>
             </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">累计沉降量 Settlement</div>
                  <div className={`text-4xl font-black ${results.finalSettlement > 50 ? 'text-red-400' : 'text-blue-400'} drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]`}>
                    {results.finalSettlement.toFixed(2)} <span className="text-sm text-slate-500">mm</span>
                  </div>
                  <div className="mt-4 flex space-x-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= (results.finalSettlement > 40 ? 6 : results.finalSettlement > 20 ? 4 : 2) ? 'bg-blue-400' : 'bg-slate-700'}`} />
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">承载力保存率 Capacity</div>
                  <div className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                    {results.finalCapacity.toFixed(1)} <span className="text-sm text-slate-500">%</span>
                  </div>
                  <div className="mt-2 text-[10px] text-emerald-500/70 font-mono tracking-tighter">SAFETY FACTOR: {(results.finalCapacity/100 * 1.5).toFixed(2)}</div>
                </div>

                <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800/50 relative overflow-hidden group hover:border-slate-500 transition-colors">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">等效基础模量 Modulus</div>
                  <div className="text-4xl font-black text-slate-100 uppercase">
                    {results.E_base.toFixed(1)} <span className="text-sm text-slate-500">MPa</span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">NOMINAL TARGET: 40 MPa</div>
                </div>
              </div>

              {results.finalCapacity < 90 && !optResults && (
                <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 backdrop-blur border border-blue-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between text-white animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <div>
                    <h3 className="text-xl font-black flex items-center mb-1 uppercase tracking-wider">
                      <Zap className="w-6 h-6 mr-3 text-blue-400" /> 警报：承载性能极速劣化
                    </h3>
                    <p className="text-sm opacity-60 font-mono uppercase tracking-tighter">Automatic Optimization protocol recommended for stabilization.</p>
                  </div>
                  <button onClick={runOptimization} className="mt-6 md:mt-0 px-8 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-500 shadow-xl transition-all uppercase tracking-widest text-xs">
                    Execute Optimization
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 bg-slate-800/20 rounded-3xl p-8 border border-slate-800/50 shadow-inner overflow-hidden relative flex justify-center items-center">
                   <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                   {renderSettlementSVG()}
                   
                   <div className="absolute right-6 top-6 w-36 h-36 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center">
                       <div className="text-[8px] font-black text-slate-500 mb-3 uppercase tracking-widest text-center">Modulus Decay Gauge</div>
                       <div className="relative w-16 h-16">
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                             <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                             <circle cx="50" cy="50" r="40" fill="none" stroke="url(#blueGrad)" strokeWidth="8" strokeDasharray={`${results.finalCapacity / 100 * 251} 251`} strokeLinecap="round" />
                             <defs>
                                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                   <stop offset="0%" stopColor="#3b82f6" />
                                   <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                             </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-black text-blue-400">
                             {Math.round(results.finalCapacity)}%
                          </div>
                       </div>
                   </div>
                </div>

                <div className="md:col-span-4 space-y-6">
                   <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800/50">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center">
                        <Activity className="w-3.5 h-3.5 mr-2 text-blue-500" /> 时程沉降演化
                      </h5>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={results.timeSeries}>
                            <defs>
                              <linearGradient id="colorSett" x1="0" y1="0" x2="0" y2="100%">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="day" hide />
                            <YAxis hide />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="settlement" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSett)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800/50">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-emerald-500" /> 物理屏障增益
                      </h5>
                      {activeMeasure === 'none' ? (
                        <div className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">
                          System Status: UNPROTECTED<br/>Decay Speed: NORMAL
                        </div>
                      ) : (
                        <div className="space-y-3">
                           <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <div className="text-[10px] font-black text-slate-200 uppercase tracking-wider">{activeMeasure} 方案启用</div>
                           </div>
                           <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-mono">Mechanical stiffness +35% / Infiltration sensitivity -60%</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoadbedAnalysis;
