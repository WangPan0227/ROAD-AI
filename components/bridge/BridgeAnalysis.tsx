import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Activity, Zap, Settings, Rocket, 
  ShieldCheck, Gauge
} from 'lucide-react';
import { calculate_bridge_impact, optimize_bridge_reinforcement, calculate_rockfall_impact_vn, BridgeEngineParams } from '../../lib/bridgeCalculations';
import { KPICard } from '../common/KPICard';

const BridgeAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<'status' | 'dashboard'>('status');
  const [optResults, setOptResults] = useState<any[] | null>(null);

  const [params, setParams] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_bridge_load') : null;
    if (pendingLoad) {
      try {
        return JSON.parse(pendingLoad);
      } catch(e) { /* fallback */ }
    }
    return {
      D: 1.0, Dst: 12, cc: 5, Nmin: 3650,
      fc: 19.1, fyt: 360, miu_d: 6.0, s: 10, Ek: 1200,
    };
  });

  const [results, setResults] = useState<any>(() => {
    const res = calculate_bridge_impact(params as BridgeEngineParams);
    const chartData = [];
    const maxEk = Math.max(res.Vn * 10, params.Ek * 1.5);
    for (let i = 0; i <= 20; i++) {
        const testEk = (maxEk / 20) * i;
        const testRes = calculate_bridge_impact({ ...params, Ek: testEk } as BridgeEngineParams);
        chartData.push({
            energy: Math.round(testEk),
            force: Math.round(testRes.Fs),
            disp: parseFloat(testRes.delta_s_cm.toFixed(2)),
            damage: parseFloat(testRes.alpha_D.toFixed(4))
        });
    }
    return { ...res, chartData };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const pending = localStorage.getItem('pending_injected_disease_pier_impact');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.injectedParameters) {
            const { miu_d, cc_loss } = parsed.injectedParameters;
            setParams(prev => ({
              ...prev,
              miu_d: miu_d !== undefined ? miu_d : prev.miu_d,
              cc: cc_loss !== undefined ? Math.max(1, 5 - cc_loss) : prev.cc
            }));
            localStorage.removeItem('pending_injected_disease_pier_impact');
          }
        } catch(e) {
          console.error("Error reading pier impact disease", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    setOptResults(null); 
    
    setTimeout(() => {
      const applied_params = { ...params };
      
      if (activeMeasure === 'S1') { 
          applied_params.Dst *= 1.5;
          applied_params.miu_d = Math.max(applied_params.miu_d, 8.0);
      } else if (activeMeasure === 'S2') { 
          applied_params.D += 0.4;
          applied_params.fc *= 1.2;
      } else if (activeMeasure === 'S3') { 
          applied_params.Ek *= 0.4; 
      }

      const res = calculate_bridge_impact(applied_params as BridgeEngineParams);
      
      const chartData = [];
      const maxEk = Math.max(res.Vn * 10, params.Ek * 1.5);
      for (let i = 0; i <= 20; i++) {
        const testEk = (maxEk / 20) * i;
        const testRes = calculate_bridge_impact({ ...applied_params, Ek: testEk } as BridgeEngineParams);
        chartData.push({
          energy: Math.round(testEk),
          force: Math.round(testRes.Fs),
          disp: parseFloat(testRes.delta_s_cm.toFixed(2)),
          damage: parseFloat(testRes.alpha_D.toFixed(4))
        });
      }

      setResults({ ...res, chartData });
      setIsCalculating(false);
      setActiveTab('status');
    }, 600);
  };

  const runOptimization = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const ecoConfigStr = localStorage.getItem('roadbedguard_bridge_economics');
      const ecoConfig = ecoConfigStr ? JSON.parse(ecoConfigStr) : {};
      
      const rankedSchemes = optimize_bridge_reinforcement(params as BridgeEngineParams, ecoConfig);
      setOptResults(rankedSchemes);
      setIsCalculating(false);
      setActiveTab('dashboard');
    }, 800);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('roadbedguard_pending_bridge_load');
    }
  }, []);

  const ductilityCurveData = Array.from({ length: 10 }, (_, i) => {
    const currentMiu = i + 1;
    const res = calculate_rockfall_impact_vn({ ...params, miu_d: currentMiu });
    return {
      miu_d: currentMiu,
      Vc: parseFloat(res.Vc.toFixed(1)),
      vc: parseFloat(res.vc.toFixed(2))
    };
  });

  const rockfallRes = results?.rockfallRes || calculate_rockfall_impact_vn(params);
  const Vc = rockfallRes.Vc;
  const lamda = rockfallRes.lamda;
  const vc = rockfallRes.vc;
  const rho_st = rockfallRes.rho_st;
  const status = rockfallRes.status || 'safe';

  const isRhoStCap = rho_st >= (2.4 / (params.fyt || 360));

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* Sidebar */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-900/90">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-sky-400" /> 冲击动力学仿真配置
            </h3>
          </div>
          
          <div className="flex-1 pt-3 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {/* Impact Load */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">外部致灾荷载 (Impact)</div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
               <div className="flex justify-between items-center mb-1.5">
                 <label className="text-slate-300 text-xs font-medium">冲击动能 Ek (kJ)</label>
                 <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
               </div>
               <input 
                 type="number" 
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xl font-bold text-rose-400 font-mono focus:outline-none focus:border-sky-500" 
                 value={params.Ek} 
                 onChange={e => updateParam('Ek', parseFloat(e.target.value))} 
               />
            </div>

            {/* Geometry & Materials */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">结构几何与材料矩阵</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">墩身直径 D (m)</label>
                <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.D} onChange={e => updateParam('D', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">螺旋箍筋直径 Dst (mm)</label>
                <input type="number" step="1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.Dst} onChange={e => updateParam('Dst', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">保护层厚度 cc (cm)</label>
                <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.cc} onChange={e => updateParam('cc', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">设计轴力 Nmin (kN)</label>
                <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.Nmin} onChange={e => updateParam('Nmin', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">箍筋间距 s (cm)</label>
                <input type="number" step="1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.s} onChange={e => updateParam('s', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">砼抗压 fc (MPa)</label>
                <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.fc} onChange={e => updateParam('fc', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">箍筋抗拉 fyt (MPa)</label>
                <input type="number" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.fyt} onChange={e => updateParam('fyt', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">延性系数 miu_d</label>
                <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.miu_d} onChange={e => updateParam('miu_d', parseFloat(e.target.value))} />
              </div>
            </div>

            {/* Measures */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">加固处治预演 Scenario</div>
            <div>
              <select 
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}
              >
                <option value="none">BASELINE: 现状评估</option>
                <option value="S1">S1: CFRP 碳纤维包裹</option>
                <option value="S2">S2: 钢管混凝土外套</option>
                <option value="S3">S3: 耗能防撞套箱</option>
              </select>
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
              <span>{isCalculating ? '求解中...' : '启动仿真引擎'}</span>
            </button>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-5">
          <header className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                    <Activity className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-100 tracking-wider uppercase">场景 2.1：桥墩偏位 | 桥梁落石/水平冲击塑性铰抗剪仿真系统</h2>
                  <p className="text-[10px] text-slate-400 font-mono">Plastic Hinge Shear Capacity Engine</p>
                </div>
            </div>
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button 
                onClick={() => setActiveTab('status')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'status' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                仿真结果
              </button>
              <button 
                onClick={runOptimization}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                方案优化
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1 pb-10">
            {results && activeTab === 'status' && (
              <div className="space-y-5 animate-in fade-in duration-700">
                {/* 4 Main Parameter Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <KPICard
                    title="截面总抗剪承载力 V_c"
                    value={Vc.toFixed(1)}
                    unit="kN"
                    subtitle={`评估状态: ${status === 'safe' ? '安全 (SAFE)' : status === 'warning' ? '预警 (WARNING)' : '危险 (CRITICAL)'}`}
                    status={status === 'safe' ? 'safe' : status === 'warning' ? 'warning' : 'critical'}
                  />
                  <KPICard
                    title="塑性铰抗剪系数 λ"
                    value={lamda.toFixed(3)}
                    subtitle="延性折减控制参数"
                    status="neutral"
                  />
                  <KPICard
                    title="核心砼抗剪强度 v_c"
                    value={vc.toFixed(2)}
                    unit="MPa"
                    subtitle={`混凝土 fc = ${params.fc} MPa`}
                    status="neutral"
                  />
                  <KPICard
                    title="体积配筋率 ρ_st"
                    value={`${(rho_st * 100).toFixed(2)}%`}
                    subtitle={isRhoStCap ? "已触发配筋上限" : `上限: ${((2.4 / params.fyt) * 100).toFixed(2)}%`}
                    status={isRhoStCap ? 'warning' : 'safe'}
                  />
                </div>

                {/* Derived Parameters Grid */}
                {results?.rockfallRes && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center">
                      <Gauge className="w-3.5 h-3.5 mr-2 text-sky-400" /> 落石冲击塑性铰力学衍生参数
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
                      <div className="bg-slate-800/50 p-2.5 border border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">墩柱全面积 Ae</span>
                        <span className="font-bold text-slate-100">{results.rockfallRes.Ae.toFixed(1)} cm²</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 border border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">核心混凝土 Ag</span>
                        <span className="font-bold text-slate-100">{results.rockfallRes.Ag.toFixed(1)} cm²</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 border border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">螺旋箍筋 Ast</span>
                        <span className="font-bold text-slate-100">{results.rockfallRes.Ast.toFixed(3)} cm²</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 border border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">箍筋环直径 D'</span>
                        <span className="font-bold text-slate-100">{results.rockfallRes.D_prime.toFixed(1)} cm</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 border border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">体积配筋率 ρ_st</span>
                        <span className="font-bold text-sky-400">{(results.rockfallRes.rho_st * 100).toFixed(3)}%</span>
                      </div>
                      <div className="bg-slate-800/50 p-2.5 border border-slate-700/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">延性折减系数 λ</span>
                        <span className="font-bold text-indigo-400">{results.rockfallRes.lamda.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col items-center justify-center relative min-h-[380px]">
                    <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                       Dynamical Simulation Engine: ROCKFALL_IMPACT_PIER_MATRIX
                    </div>
                    
                    <svg width="600" height="340" viewBox="0 0 600 340" className="relative z-10 overflow-visible">
                        <defs>
                            <pattern id="pierGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="1"/>
                            </pattern>
                        </defs>

                        <rect width="600" height="340" fill="url(#pierGrid)" />
                        
                        {/* Ground */}
                        <rect x="0" y="280" width="600" height="60" fill="#0f172a" />
                        <line x1="0" y1="280" x2="600" y2="280" stroke="#334155" strokeWidth="2" strokeDasharray="5 5" />

                        {/* Pier Under Impact (Dynamic) */}
                        <g transform={`translate(${(results?.delta_s_cm ?? 0) * 1.5}, 0)`} className="transition-all duration-700">
                            {/* Pier Body */}
                            <rect x="250" y="40" width="60" height="240" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                            
                            {/* Cap Beam */}
                            <rect x="210" y="20" width="140" height="20" fill="#334155" stroke="#475569" strokeWidth="1" />

                            {/* Plastic Hinge Region Visualization */}
                            <rect x="248" y="210" width="64" height="70" fill="#38bdf8" fillOpacity="0.1" stroke="#38bdf8" strokeDasharray="3 3" />
                            <text x="280" y="248" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#38bdf8">塑性铰区</text>
                        </g>
                        
                        {/* Rockfall Impact Symbol */}
                        <g transform="translate(200, 160)">
                            <circle cx="0" cy="0" r="16" fill="#f43f5e" fillOpacity="0.2" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 2" className="animate-ping" />
                            <polygon points="-8,-8 10,-12 12,6 -4,12 -12,2" fill="#9a3412" stroke="#ea580c" strokeWidth="1.5" />
                            <circle cx="0" cy="0" r="4" fill="#f43f5e" />
                        </g>

                        <text x="200" y="130" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#f43f5e" className="font-mono">落石冲击 P_IMPACT</text>
                    </svg>

                    <div className="absolute bottom-6 right-8 text-right space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Resistance (Fs)</div>
                        <div className="text-xl font-mono font-black text-slate-100">{(results?.Fs ?? 0).toFixed(1)} <small className="text-[10px] text-slate-400">kN</small></div>
                    </div>
                  </div>

                  {/* 位移延性 μd - 抗剪承载力 Vc 衰减演化曲线图 */}
                  <div className="col-span-12 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                     <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center">
                        <Gauge className="w-4 h-4 mr-2 text-sky-400" /> 位移延性 μ_d - 抗剪承载力 V_c 衰减演化曲线图
                     </h3>
                     <div style={{ width: '100%', height: 240 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={ductilityCurveData}>
                            <defs>
                              <linearGradient id="colorDuctilityVc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis 
                              dataKey="miu_d" 
                              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} 
                              label={{ value: '位移延性 μ_d', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }} 
                            />
                            <YAxis 
                              tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} 
                              label={{ value: 'Vc (kN)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }} 
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                            <Area type="monotone" dataKey="Vc" name="塑性铰抗剪承载力 Vc (kN)" stroke="#38bdf8" fillOpacity={1} fill="url(#colorDuctilityVc)" strokeWidth={2} />
                            <Area type="monotone" dataKey="vc" name="混凝土抗剪强度 vc (MPa)" stroke="#34d399" fillOpacity={0} strokeWidth={1.5} strokeDasharray="4 4" />
                          </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && optResults && (
              <div className="space-y-5 animate-in fade-in duration-700">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
                  <h3 className="text-xl font-black text-slate-100 mb-4 tracking-tight uppercase">{optResults[0].name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Capex</p>
                      <p className="text-2xl font-black text-slate-100 font-mono">¥{Math.round(optResults[0].cost).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stabilization Gain</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">+{((1 - ((optResults[0]?.finalAlphaD ?? 0) / (results?.alpha_D ?? 1))) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Optimized FS</p>
                      <p className="text-2xl font-black text-sky-400 font-mono">{(1/(optResults[0]?.finalAlphaD || 0.1)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
                  <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Reinforcement Scheme Matrix</span>
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 font-bold">Solution Topology</th>
                        <th className="px-5 py-3 font-bold text-right">Unit Cost (¥)</th>
                        <th className="px-5 py-3 font-bold text-center">Efficiency Rating</th>
                        <th className="px-5 py-3 font-bold text-right">Residual Damage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {optResults.map(scheme => (
                        <tr key={scheme.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-100">{scheme.name}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-200">¥{Math.round(scheme.cost).toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-center">
                              <span className="text-[9px] bg-sky-500/10 text-sky-400 px-2 py-0.5 font-bold border border-sky-500/30 rounded">HIGH_PRIORITY</span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400">{(scheme?.finalAlphaD ?? 0).toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default BridgeAnalysis;
