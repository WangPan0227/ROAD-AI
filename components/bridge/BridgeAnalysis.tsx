import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import { 
  Activity, ShieldAlert, Zap, Layers, Settings, Rocket, Trophy, 
  DollarSign, Clock, ShieldCheck, Info, AlertTriangle, ChevronRight, Gauge
} from 'lucide-react';
import { calculate_bridge_impact, optimize_bridge_reinforcement, BridgeEngineParams } from '../../lib/bridgeCalculations';

const BridgeAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<'status' | 'dashboard'>('status');
  const [optResults, setOptResults] = useState<any[] | null>(null);
  const [results, setResults] = useState<any>(() => {
    const p = (() => {
        const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_bridge_load') : null;
        if (pendingLoad) {
          try {
            return JSON.parse(pendingLoad);
          } catch(e) { /* fallback */ }
        }
        return {
          D: 1.0, Ae: 6360, Ag: 5088, Ast: 1.13, Nmin: 3650,
          fc: 19.1, fyt: 360, miu_d: 6.0, s: 10, D_prime: 87.6, Ek: 1200,
        };
    })();
    const res = calculate_bridge_impact(p as BridgeEngineParams);
    const chartData = [];
    const maxEk = Math.max(res.Vn * 10, p.Ek * 1.5);
    for (let i = 0; i <= 20; i++) {
        const testEk = (maxEk / 20) * i;
        const testRes = calculate_bridge_impact({ ...p, Ek: testEk } as BridgeEngineParams);
        chartData.push({
            energy: Math.round(testEk),
            force: Math.round(testRes.Fs),
            disp: parseFloat(testRes.delta_s_cm.toFixed(2)),
            damage: parseFloat(testRes.alpha_D.toFixed(4))
        });
    }
    return { ...res, chartData };
  });
  const [diseaseMatrix] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_bridge_disease_matrix') : null;
    return saved ? JSON.parse(saved) : [];
  });

  const [params, setParams] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_bridge_load') : null;
    if (pendingLoad) {
      try {
        return JSON.parse(pendingLoad);
      } catch(e) { /* fallback */ }
    }
    return {
      D: 1.0, Ae: 6360, Ag: 5088, Ast: 1.13, Nmin: 3650,
      fc: 19.1, fyt: 360, miu_d: 6.0, s: 10, D_prime: 87.6, Ek: 1200,
    };
  });

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    setOptResults(null); 
    
    setTimeout(() => {
      const applied_params = { ...params };
      
      if (activeMeasure === 'S1') { 
          applied_params.Ast *= 3.0;
          applied_params.miu_d = Math.max(applied_params.miu_d, 8.0);
      } else if (activeMeasure === 'S2') { 
          applied_params.D += 0.4;
          applied_params.Ae *= 1.5;
          applied_params.Ag *= 1.5;
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

  const getDamageStatus = (alpha: number) => {
      const sortedMatrix = [...diseaseMatrix].sort((a, b) => b.schema.min_alpha - a.schema.min_alpha);
      for (const item of sortedMatrix) {
          if (alpha >= item.schema.min_alpha) {
              const baseTheme = item.color === 'emerald' ? 'green' : item.color;
              return { 
                  text: item.name, 
                  color: baseTheme, 
                  bg: `bg-${baseTheme}-50`, 
                  border: `border-${baseTheme}-200` 
              };
          }
      }
      return { text: "弹性/轻微损伤 (结构安全)", color: "green", bg: "bg-green-50", border: "border-green-200" };
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-300 flex flex-col overflow-hidden relative shadow-sm">
          <div className="p-3 border-b border-gray-300 bg-gray-50 flex items-center justify-between sticky top-0 z-10">
            <h3 className="section-title border-none p-0 bg-transparent flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 冲击动力学仿真配置
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Impact Load */}
            <div className="section-title border-t-0">外部致灾荷载 (Impact)</div>
            <div className="p-3 bg-white border-b border-gray-200">
               <div className="flex justify-between items-center mb-2">
                 <label className="prop-label">冲击动能 Ek (kJ)</label>
                 <Zap className="w-3.5 h-3.5 text-red-500 animate-pulse" />
               </div>
               <input 
                 type="number" 
                 className="w-full bg-gray-50 border border-gray-300 rounded-sm p-3 text-xl font-bold text-red-600 font-mono focus:ring-1 focus:ring-blue-500 outline-none" 
                 value={params.Ek} 
                 onChange={e => updateParam('Ek', parseFloat(e.target.value))} 
               />
            </div>

            {/* Geometry & Materials */}
            <div className="section-title">结构几何与材料矩阵</div>
            <div className="grid grid-cols-1 divide-y divide-gray-200">
              <div className="flex justify-between items-center py-2 px-3">
                <label className="prop-label">墩身直径 D (m)</label>
                <input type="number" step="0.1" className="w-20 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.D} onChange={e => updateParam('D', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center py-2 px-3">
                <label className="prop-label">设计轴力 N (kN)</label>
                <input type="number" className="w-20 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.Nmin} onChange={e => updateParam('Nmin', parseFloat(e.target.value))} />
              </div>
              <div className="flex justify-between items-center py-2 px-3">
                <label className="prop-label">配筋率 Pst (%)</label>
                <input type="number" step="0.1" className="w-16 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.Ast} onChange={e => updateParam('Ast', parseFloat(e.target.value))} />
              </div>
            </div>

            {/* Measures */}
            <div className="section-title">加固处治预演 Scenario</div>
            <div className="p-3">
              <select 
                className="w-full bg-gray-50 border border-gray-300 rounded-sm p-2.5 text-[11px] font-bold text-gray-700 uppercase tracking-widest outline-none transition-all cursor-pointer focus:border-blue-500"
                value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}
              >
                <option value="none">BASELINE: 现状评估</option>
                <option value="S1">S1: CFRP 碳纤维包裹</option>
                <option value="S2">S2: 钢管混凝土外套</option>
                <option value="S3">S3: 耗能防撞套箱</option>
              </select>
            </div>
          </div>

          <div className="p-4 border-t border-gray-300 bg-gray-50">
            <button 
              onClick={runStatusAnalysis} disabled={isCalculating}
              className={`w-full py-2.5 rounded-sm font-bold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm ${isCalculating ? 'bg-gray-300 text-gray-500' : 'bg-gray-800 hover:bg-black text-white'}`}
            >
              {isCalculating ? <Activity className="animate-spin w-4 h-4" /> : <Rocket className="w-4 h-4" />}
              <span>{isCalculating ? '求解中...' : '启动仿真引擎'}</span>
            </button>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 bg-white border-b border-gray-300 px-6 flex items-center justify-between shadow-sm relative z-20">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xs font-bold text-gray-800 tracking-wider uppercase">桥梁墩体受灾动力学仿真系统 v2.5</h2>
            </div>
            <div className="flex bg-gray-100 p-0.5 rounded-sm border border-gray-300">
              <button 
                onClick={() => setActiveTab('status')}
                className={`px-5 py-1 text-[10px] font-bold rounded-sm transition-all uppercase tracking-widest ${activeTab === 'status' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                仿真结果
              </button>
              <button 
                onClick={runOptimization}
                className={`px-5 py-1 text-[10px] font-bold rounded-sm transition-all uppercase tracking-widest ${activeTab === 'dashboard' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
              >
                方案优化
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar">
            {results && activeTab === 'status' && (
              <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-300 p-5 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">抗剪承载力 Vn (kN)</p>
                    <p className="text-2xl font-mono font-bold text-gray-800 italic">{(results?.Vn ?? 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-white border border-gray-300 p-5 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">峰值位移 δs (cm)</p>
                    <p className="text-2xl font-mono font-bold text-blue-600 italic">{(results?.delta_s_cm ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white border border-gray-300 p-5 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">结构状态 Level</p>
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${(results?.alpha_D ?? 0) > 0.05 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <p className={`text-sm font-bold uppercase ${(results?.alpha_D ?? 0) > 0.05 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {getDamageStatus(results?.alpha_D ?? 0).text}
                        </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-12 bg-white border border-gray-300 p-8 shadow-sm flex flex-col items-center justify-center relative min-h-[450px]">
                    <div className="absolute top-4 left-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                       Dynamical Simulation Engine: OPTUM_PIER_MATRIX
                    </div>
                    
                    <svg width="600" height="400" viewBox="0 0 600 400" className="relative z-10 overflow-visible">
                        <defs>
                            <filter id="concreteNoise" x="0" y="0" width="100%" height="100%">
                                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                                <feDiffuseLighting in="noise" lightingColor="#f3f4f6" surfaceScale="1">
                                    <feDistantLight azimuth="45" elevation="60" />
                                </feDiffuseLighting>
                            </filter>
                            
                            <linearGradient id="rustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#7c2d12" />
                                <stop offset="50%" stopColor="#92400e" />
                                <stop offset="100%" stopColor="#78350f" />
                            </linearGradient>

                            <pattern id="pierGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                            </pattern>
                        </defs>

                        <rect width="600" height="400" fill="url(#pierGrid)" />
                        
                        {/* Ground */}
                        <rect x="0" y="320" width="600" height="80" fill="#f8fafc" />
                        <line x1="0" y1="320" x2="600" y2="320" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="5 5" />
                        
                        {/* Wavy Scouring simulation */}
                        <path d="M 0 320 Q 75 310 150 320 T 300 320 T 450 320 T 600 320" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.3" />

                        {/* Pier Girders (Left Static) */}
                        <rect x="380" y="50" width="60" height="270" fill="white" stroke="#cbd5e1" strokeWidth="1.5" filter="url(#concreteNoise)" />
                        <rect x="360" y="30" width="100" height="20" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                        
                        {/* Pier Under Impact (Dynamic) */}
                        <g transform={`translate(${(results?.delta_s_cm ?? 0) * 1.5}, 0)`} className="transition-all duration-700">
                            {/* Pier Body */}
                            <rect x="180" y="50" width="60" height="270" fill="white" stroke="#94a3b8" strokeWidth="1.5" filter="url(#concreteNoise)" />
                            
                            {/* Cap Beam */}
                            <rect x="150" y="30" width="300" height="20" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />

                            {/* Damage Visualization */}
                            {(results?.alpha_D ?? 0) > 0.05 && (
                                <g>
                                    <path d="M 180 180 Q 195 182 210 180 M 210 180 Q 225 178 240 180" stroke="#92400e" strokeWidth="2" strokeDasharray="3 2" />
                                    <path d="M 180 210 Q 195 1 alrededor 210 210 M 210 210 Q 225 212 240 210" stroke="#92400e" strokeWidth="2" strokeDasharray="5 3" />
                                    
                                    {/* Rust/Exposure details */}
                                    {(results?.alpha_D ?? 0) > 0.15 && (
                                        <g opacity="0.8">
                                            <rect x="185" y="185" width="10" height="15" fill="url(#rustGradient)" rx="1" />
                                            <path d="M 185 185 L 195 200 M 195 185 L 185 200" stroke="#fbbf24" strokeWidth="0.5" />
                                            <circle cx="190" cy="192" r="6" fill="#7c2d12" opacity="0.2" filter="url(#concreteNoise)" />
                                        </g>
                                    )}
                                </g>
                            )}
                        </g>
                        
                        {/* Impact Symbol */}
                        <g transform="translate(140, 180)">
                            <circle cx="0" cy="0" r="15" fill="#fef2f2" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" className="animate-ping" />
                            <circle cx="0" cy="0" r="4" fill="#ef4444" />
                            <path d="M -20 0 L -10 0 M 20 0 L 10 0 M 0 -20 L 0 -10 M 0 20 L 0 10" stroke="#ef4444" strokeWidth="1.5" />
                        </g>

                        <text x="140" y="160" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ef4444" className="font-mono">P_IMPACT</text>
                    </svg>

                    <div className="absolute bottom-6 right-8 text-right space-y-1">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Peak Resistance</div>
                        <div className="text-xl font-mono font-black italic text-gray-800">{(results?.Fs ?? 0).toFixed(1)} <small className="text-[10px]">kN</small></div>
                    </div>
                  </div>

                  <div className="col-span-12 bg-white border border-gray-300 p-6 shadow-sm h-[350px]">
                     <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center">
                        <Gauge className="w-3.5 h-3.5 mr-2" /> Energy-Displacement Dynamic Response Curve
                     </h3>
                     <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={results.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="energy" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                            <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="disp" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && optResults && (
              <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700">
                <div className="bg-gray-800 p-8 shadow-md border border-gray-700 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rotate-45" />
                  <h3 className="text-4xl font-black text-white mb-6 tracking-tighter uppercase line-clamp-1">{optResults[0].name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Estimated Capex</p>
                      <p className="text-2xl font-black text-white font-mono">¥{Math.round(optResults[0].cost).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Stabilization Gain</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">+{((1 - ((optResults[0]?.finalAlphaD ?? 0) / (results?.alpha_D ?? 1))) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Optimized FS</p>
                      <p className="text-2xl font-black text-blue-400 font-mono">{(1/(optResults[0]?.finalAlphaD || 0.1)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-300 flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reinforcement Scheme Matrix</span>
                      <ShieldCheck className="w-4 h-4 text-gray-400" />
                  </div>
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-gray-100 text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-bold uppercase tracking-tighter">Solution Topology</th>
                        <th className="px-6 py-3 font-bold uppercase tracking-tighter text-right">Unit Cost (¥)</th>
                        <th className="px-6 py-3 font-bold uppercase tracking-tighter text-center">Efficiency Rating</th>
                        <th className="px-6 py-3 font-bold uppercase tracking-tighter text-right">Residual Damage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {optResults.map(scheme => (
                        <tr key={scheme.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800">{scheme.name}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold">¥{Math.round(scheme.cost).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                              <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 font-bold border border-blue-100">HIGH_PRIORITY</span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{(scheme?.finalAlphaD ?? 0).toFixed(3)}</td>
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
