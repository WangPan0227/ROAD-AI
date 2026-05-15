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
  const [results, setResults] = useState<any>(null);
  const [diseaseMatrix, setDiseaseMatrix] = useState<any[]>([]);

  useEffect(() => {
    const savedMatrix = localStorage.getItem('roadbedguard_bridge_disease_matrix');
    if (savedMatrix) {
      setDiseaseMatrix(JSON.parse(savedMatrix));
    }
  }, []);

  const [params, setParams] = useState({
    D: 1.0, Ae: 6360, Ag: 5088, Ast: 1.13, Nmin: 3650,
    fc: 19.1, fyt: 360, miu_d: 6.0, s: 10, D_prime: 87.6, Ek: 1200,
  });

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    setOptResults(null); 
    
    setTimeout(() => {
      let applied_params = { ...params };
      
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

  useEffect(() => { runStatusAnalysis(); }, []);

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
    <div className="flex flex-col h-full bg-slate-950 text-slate-300">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
          
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 冲击动力学仿真配置
            </h3>
            <div className="flex space-x-1">
               <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
               <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:200ms]" />
               <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:400ms]" />
            </div>
          </div>
          
          <div className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Impact Load */}
            <div className="space-y-4">
              <h4 className="font-black text-red-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Zap className="w-3.5 h-3.5 mr-2 animate-bounce" /> 外部致灾荷载 (Impact)
              </h4>
              <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/30 animate-scan pointer-events-none" />
                <label className="block text-[9px] text-red-400/60 uppercase font-black mb-2 tracking-widest">冲击动能 Ek (kJ)</label>
                <div className="flex items-center space-x-3">
                   <input 
                      type="number" 
                      className="flex-1 bg-slate-950 border border-red-500/30 rounded-lg p-3 text-xl font-black text-red-500 font-mono shadow-[0_0_20px_rgba(239,68,68,0.1)] focus:ring-1 focus:ring-red-500 outline-none" 
                      value={params.Ek} 
                      onChange={e => updateParam('Ek', parseFloat(e.target.value))} 
                   />
                </div>
              </div>
            </div>

            {/* Geometry & Materials */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Layers className="w-3.5 h-3.5 mr-2 text-blue-500" /> 结构几何与材料矩阵
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-1 font-black">墩径 D</label>
                  <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-blue-400 outline-none focus:border-blue-500" value={params.D} onChange={e => updateParam('D', parseFloat(e.target.value))} />
                </div>
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-1 font-black">轴力 Nmin</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-blue-400 outline-none focus:border-blue-500" value={params.Nmin} onChange={e => updateParam('Nmin', parseFloat(e.target.value))} />
                </div>
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-1 font-black">砼强度 fc</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300 outline-none focus:border-blue-500" value={params.fc} onChange={e => updateParam('fc', parseFloat(e.target.value))} />
                </div>
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-1 font-black">箍筋 fyt</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300 outline-none focus:border-blue-500" value={params.fyt} onChange={e => updateParam('fyt', parseFloat(e.target.value))} />
                </div>
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-1 font-black">箍筋面积</label>
                  <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300 outline-none focus:border-blue-500" value={params.Ast} onChange={e => updateParam('Ast', parseFloat(e.target.value))} />
                </div>
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-1 font-black">延性系数</label>
                  <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300 outline-none focus:border-blue-500" value={params.miu_d} onChange={e => updateParam('miu_d', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Measures */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="font-black text-blue-400 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-2" /> 加固处治预演 (Scenario)
              </h4>
              <div className="relative group">
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-[10px] font-black text-slate-300 uppercase tracking-widest outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}
                >
                  <option value="none">BASELINE: 现状评估</option>
                  <option value="S1">METHOD_A: CFRP 碳纤维环向包裹</option>
                  <option value="S2">METHOD_B: 钢管混凝土复合套裙</option>
                  <option value="S3">METHOD_C: 耗能防撞套箱</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md sticky bottom-0 z-10">
            <button 
              onClick={runStatusAnalysis} disabled={isCalculating}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-2xl ${isCalculating ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-blue-400" />
                  <span>动力学求解中...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>启动冲击仿真引擎</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Main Layout Header */}
          <div className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shadow-2xl relative z-20">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/10 animate-scan pointer-events-none" />
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100 tracking-wider uppercase">InfraGuard | 桥梁墩体受灾动力学仿真系统</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic uppercase border-l border-slate-700 pl-2">Bridge Pier Dynamic Impact Solver // LEM-Energy Model v5.0</p>
              </div>
            </div>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button 
                onClick={() => setActiveTab('status')}
                className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center space-x-2 ${activeTab === 'status' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Activity className="w-3 h-3" />
                <span>仿真演化矩阵</span>
              </button>
              <button 
                onClick={runOptimization}
                className={`px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center space-x-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Trophy className="w-3 h-3" />
                <span>智能方案看板</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20 custom-scrollbar relative z-10">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            {!results ? null : (
              activeTab === 'status' ? (
                <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
                    <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                           <Zap className="w-16 h-16 text-blue-500" />
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">名义抗剪承载力 (Vn)</div>
                        <div className="flex items-baseline space-x-2 mb-4">
                           <div className="text-4xl font-black font-mono text-slate-100 tracking-tighter">{(results.Vn || 0).toFixed(1)}</div>
                           <div className="text-xs text-slate-600 font-bold">kN</div>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500" style={{ width: '60%' }} />
                        </div>
                      </div>
                      
                      <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                           <Activity className="w-16 h-16 text-emerald-500" />
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">等效冲击力 (Fs_equiv)</div>
                        <div className="flex items-baseline space-x-2 mb-4">
                           <div className="text-4xl font-black font-mono text-blue-400 tracking-tighter text-shadow-glow">{(results.Fs || 0).toFixed(1)}</div>
                           <div className="text-xs text-slate-600 font-bold text-blue-400/50">kN</div>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{ width: `${Math.min(100, (results.Fs / results.Vn) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl col-span-1 md:col-span-2 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/10" />
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center">
                               <ShieldAlert className="w-3.5 h-3.5 mr-2 text-emerald-500" /> 预估水平峰值位移 (δs_max)
                            </div>
                            <div className="flex items-baseline space-x-3">
                               <div className="text-6xl font-black font-mono text-emerald-400 text-shadow-glow tracking-tighter">{(results.delta_s_cm || 0).toFixed(2)}</div>
                               <div className="text-base text-emerald-400/50 font-black">cm</div>
                            </div>
                        </div>
                        <div className="text-right border-l border-slate-800 pl-8">
                            <div className="text-[9px] font-black text-slate-600 tracking-widest uppercase mb-1">损伤刚度折减率</div>
                            <div className="text-3xl font-mono text-slate-300 font-black tracking-tighter italic border-b border-slate-700/50 inline-block px-1">
                               {((results.alpha_D || 0) * 100).toFixed(1)}%
                            </div>
                            <div className="text-[10px] font-mono text-slate-600 mt-1 uppercase tracking-tighter">Relative to D_pier</div>
                        </div>
                      </div>
                    </div>

                    <div className={`md:col-span-4 p-8 rounded-3xl border relative flex flex-col justify-center overflow-hidden shadow-2xl ${results.alpha_D > 0.05 ? 'bg-red-500/10 border-red-500/50' : results.alpha_D > 0.02 ? 'bg-orange-500/10 border-orange-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                           <div className={`p-4 rounded-full ${results.alpha_D > 0.05 ? 'bg-red-500/20 text-red-500' : results.alpha_D > 0.02 ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                               <Gauge className="w-10 h-10 animate-pulse" />
                           </div>
                           <div>
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">仿真核心诊断报告</span>
                              <h3 className={`text-2xl font-black tracking-tighter mt-1 uppercase ${results.alpha_D > 0.05 ? 'text-red-400' : results.alpha_D > 0.02 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                  {getDamageStatus(results.alpha_D).text}
                              </h3>
                           </div>
                           <div className="pt-4 border-t border-white/5 w-full">
                               <p className="text-[9px] font-mono leading-relaxed opacity-60 italic">
                                  Structural Integrity Matrix has been updated. Dynamic modulus of pier columns shows {((results.alpha_D || 0) * 100).toFixed(1)}% degradation under current impact load Ek={params.Ek}kJ.
                               </p>
                           </div>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* 2D Animation Scene */}
                     <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                        <div className="absolute top-6 left-10 flex items-center space-x-3">
                           <div className="w-1 h-1 bg-red-500 animate-ping" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">物理场景动态演化 (Real-time Physical Phase)</span>
                        </div>
                        
                        <svg width="400" height="300" viewBox="0 0 400 300" className="relative z-10 opacity-80 scale-110">
                           <defs>
                              <linearGradient id="pierGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                 <stop offset="0%" stopColor="#334155" />
                                 <stop offset="100%" stopColor="#0f172a" />
                              </linearGradient>
                              <filter id="glow-orange">
                                 <feGaussianBlur stdDeviation="4" result="blur" />
                                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
                              </filter>
                           </defs>
                           
                           {/* Ground */}
                           <rect x="0" y="250" width="400" height="50" fill="#020617" />
                           <line x1="0" y1="250" x2="400" y2="250" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2" />

                           {/* Left Pier */}
                           <g transform={`translate(${results.delta_s_cm * 2}, 0)`} className="transition-transform duration-700">
                             <rect x="130" y="50" width="30" height="200" fill="url(#pierGrad)" stroke="#1e293b" strokeWidth="2" />
                             {results.alpha_D > 0.05 && (
                                <path d="M 130 150 L 160 155 M 130 180 L 160 175" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.5" />
                             )}
                           </g>

                           {/* Right Pier */}
                           <g transform={`translate(${results.delta_s_cm * 2.5}, 0)`} className="transition-transform duration-700">
                             <rect x="240" y="50" width="30" height="200" fill="url(#pierGrad)" stroke="#1e293b" strokeWidth="2" />
                             {results.alpha_D > 0.05 && (
                                <path d="M 240 160 L 270 165 M 240 190 L 270 185" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.5" />
                             )}
                           </g>

                           {/* Top Girder (Simplified) */}
                           <rect x={100 + results.delta_s_cm * 2.2} y="30" width="200" height="20" fill="#1e293b" rx="4" className="transition-all duration-700" />

                           {/* Impact Warning Area */}
                           <circle cx="110" cy="180" r="15" fill="#f97316" fillOpacity="0.1" stroke="#f97316" strokeWidth="2" strokeDasharray="2" className="animate-ping" />
                           <path d="M 80 180 L 130 180" stroke="#f97316" strokeWidth="3" markerEnd="url(#cyberArrow)" className="animate-pulse" />
                           <circle cx="110" cy="180" r="5" fill="#f97316" filter="url(#glow-orange)" />
                           <text x="50" y="170" className="text-[10px] font-black fill-orange-500 uppercase tracking-widest">IMPACT_LOAD_CENTER</text>
                        </svg>
                        <div className="absolute bottom-8 flex space-x-12">
                           <div className="text-center">
                              <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Max Displacement</p>
                              <p className="text-lg font-black text-emerald-400 font-mono">{(results.delta_s_cm || 0).toFixed(2)} cm</p>
                           </div>
                           <div className="text-center border-l border-slate-800 pl-12">
                              <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Damping_Ratio</p>
                              <p className="text-lg font-black text-blue-400 font-mono">5.2%</p>
                           </div>
                        </div>
                     </div>

                     {/* Chart Area */}
                     <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl flex flex-col h-[400px]">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8 flex items-center">
                          <Activity className="w-4 h-4 mr-2 text-blue-500" /> 能量-耗散-非线性力位移矩阵
                        </h5>
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={results.chartData}>
                              <defs>
                                <linearGradient id="colorForce" x1="0" y1="0" x2="0" y2="100%">
                                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorDisp" x1="0" y1="0" x2="0" y2="100%">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="energy" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px', color: '#f8fafc' }} />
                              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                              <Area yAxisId="left" type="monotone" dataKey="force" name="冲击力 (kN)" stroke="#4f46e5" fillOpacity={1} fill="url(#colorForce)" strokeWidth={3} />
                              <Area yAxisId="right" type="monotone" dataKey="disp" name="水平位移 (cm)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDisp)" strokeWidth={3} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                optResults && optResults.length > 0 ? (
                  <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                       <div>
                          <h3 className="text-xl font-black text-slate-100 tracking-[0.3em] uppercase mb-1 flex items-center">
                             <Trophy className="w-6 h-6 mr-3 text-emerald-500" /> 加固拓扑最优推荐
                          </h3>
                          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Artificial Intelligence Recommended Optimization Schemes Matrix</div>
                       </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-900/40 backdrop-blur-xl rounded-[2.5rem] p-10 border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                           <ShieldCheck className="w-40 h-40 text-white" />
                        </div>
                        <div className="relative z-10">
                           <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" /> TOPOLOGICAL RANKING #1
                           </div>
                           <h4 className="text-5xl font-black text-white mb-10 tracking-tight uppercase">{optResults[0].name}</h4>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                              <div className="space-y-2">
                                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">CAPEX 估算造价</p>
                                 <p className="text-3xl font-black font-mono text-white tracking-widest tracking-tighter">¥{Math.round(optResults[0].cost).toLocaleString()}</p>
                              </div>
                              <div className="space-y-2 border-l border-white/10 pl-12">
                                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">DURATION 工期</p>
                                 <p className="text-3xl font-black font-mono text-white tracking-widest tracking-tighter">{(optResults[0].time || 0).toFixed(1)} <span className="text-sm font-bold text-slate-500">D</span></p>
                              </div>
                              <div className="space-y-2 border-l border-white/10 pl-12">
                                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">POST_DISP 位移</p>
                                 <p className="text-3xl font-black font-mono text-emerald-400 tracking-widest tracking-tighter shadow-emerald-500/20">{(optResults[0].finalDisp || 0).toFixed(2)} <span className="text-sm font-bold text-slate-500 text-emerald-400/50">CM</span></p>
                              </div>
                              <div className="space-y-2 border-l border-white/10 pl-12">
                                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">DAMAGE_REDUC</p>
                                 <p className="text-3xl font-black font-mono text-emerald-400 tracking-widest tracking-tighter italic shadow-emerald-500/20">-{((1 - (optResults[0].finalAlphaD / results.alpha_D)) * 100).toFixed(1)}%</p>
                              </div>
                           </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
                      <div className="p-6 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center px-8">
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">演化方案对比全矩阵 (Full Scheme Comparison)</h3>
                         <div className="text-[9px] font-mono text-slate-500 uppercase">System Ready // All {optResults.length} iterations completed.</div>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/50 border-b border-slate-800">
                            <th className="px-8 py-5">Rank</th>
                            <th className="px-8 py-5">Scheme Topology</th>
                            <th className="px-8 py-5">Alpha_D Damage</th>
                            <th className="px-8 py-5">Capex Control</th>
                            <th className="px-8 py-5">Time Eff.</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs">
                          {optResults.map((scheme, idx) => (
                            <tr key={scheme.id} className={`border-b border-slate-800/10 hover:bg-white/5 transition-all group ${idx === 0 ? 'bg-blue-600/5' : ''}`}>
                              <td className="px-8 py-5 font-black font-mono text-slate-600 group-hover:text-blue-400 tracking-tighter">#{idx + 1}</td>
                              <td className="px-8 py-5 font-bold text-slate-300 uppercase tracking-tight">{scheme.name}</td>
                              <td className="px-8 py-5 font-mono font-black text-emerald-400">{((scheme.finalAlphaD || 0) * 100).toFixed(2)}%</td>
                              <td className="px-8 py-5 font-bold text-indigo-400 tracking-tighter font-mono">¥ {Math.round(scheme.cost || 0).toLocaleString()}</td>
                              <td className="px-8 py-5 text-slate-500 font-mono italic">{(scheme.time || 0).toFixed(1)} days</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeAnalysis;
