import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Zap, Layers, Settings, Rocket, Trophy, Target, FileSearch, Save, Gauge, ChevronRight, AlertTriangle, ShieldCheck, Database, Info } from 'lucide-react';
import { calculate_tunnel_pressure, optimize_tunnel_reinforcement, TunnelEngineParams } from '../../lib/tunnelCalculations';

const TunnelAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [optResults, setOptResults] = useState<any[] | null>(null);
  const [results, setResults] = useState<any>(null);

  const [params, setParams] = useState<TunnelEngineParams>({
    B: 10.0, Ht: 7.0, H: 25.0, rockClass: 4, 
    gamma: 22.0, mu: 0.3, dLining: 400, dCrack: 120, hasDebris: false,
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
          applied_params.hasDebris = false;
          applied_params.dCrack = 0;
      } else if (activeMeasure === 'S2') {
          applied_params.hasDebris = false;
      } else if (activeMeasure === 'S3') {
          applied_params.hasDebris = false;
          applied_params.dCrack *= 0.2;
          applied_params.dLining += 100;
      }

      const res = calculate_tunnel_pressure(applied_params);
      
      if (activeMeasure === 'S2') {
          res.health_score = Math.min(100, res.health_score + 40);
      }

      setResults(res);
      setIsCalculating(false);
    }, 600);
  };

  const runOptimization = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const ecoConfigStr = localStorage.getItem('roadbedguard_tunnel_economics');
      const ecoConfig = ecoConfigStr ? JSON.parse(ecoConfigStr) : {};
      const rankedSchemes = optimize_tunnel_reinforcement(params, ecoConfig);
      setOptResults(rankedSchemes);
      setIsCalculating(false);
    }, 800);
  };

  useEffect(() => { runStatusAnalysis(); }, []);

  const saveToHistory = () => {
    if (!results) {
      alert('请先执行仿真计算，获取评估结果后再进行归档。');
      return;
    }
    const historyRecord = {
      id: `TN-HIST-${Date.now()}`,
      date: new Date().toISOString(),
      params: { ...params },
      results: {
        tunnel_type: results.tunnel_type,
        q_kPa: results.q_kPa,
        deep_rate: results.deep_rate,
        damage_level: results.damage_level,
        health_score: results.health_score
      }
    };
    const existingHistory = JSON.parse(localStorage.getItem('roadbedguard_tunnel_history') || '[]');
    localStorage.setItem('roadbedguard_tunnel_history', JSON.stringify([historyRecord, ...existingHistory]));
    alert('当前隧道推演案例已成功归档！');
  };

  const getDamageStatus = (level: number) => {
      switch(level) {
          case 4: return { text: "Ⅳ级：灾难性破坏", color: "red", shadow: "shadow-red-500/20", textCol: "text-red-500" };
          case 3: return { text: "Ⅲ级：严重损伤", color: "orange", shadow: "shadow-orange-500/20", textCol: "text-orange-500" };
          case 2: return { text: "Ⅱ级：中度损伤", color: "yellow", shadow: "shadow-yellow-500/20", textCol: "text-yellow-500" };
          default: return { text: "Ⅰ级：弹性/轻微受损", color: "emerald", shadow: "shadow-emerald-500/20", textCol: "text-emerald-500" };
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
          
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 衬砌健康仿真配置
            </h3>
            <div className="flex space-x-1">
               <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
               <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:200ms]" />
            </div>
          </div>
          
          <div className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Parameters */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                  <Target className="w-3.5 h-3.5 mr-2 text-blue-500" /> 几何与地质参数矩阵
                </h4>
                <div className="space-y-3">
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">围岩级别 (I-VI)</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono font-black text-blue-400 outline-none" value={params.rockClass} onChange={e => updateParam('rockClass', parseInt(e.target.value))}>
                      <option value={1}>I 级围岩 (优质)</option>
                      <option value={2}>II 级围岩 (良好)</option>
                      <option value={3}>III 级围岩 (中等)</option>
                      <option value={4}>IV 级围岩 (较差)</option>
                      <option value={5}>V 级围岩 (极差)</option>
                      <option value={6}>VI 级围岩 (散体)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <label className="block text-[8px] text-slate-500 uppercase mb-1.5 font-black">跨度 B (m)</label>
                      <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300" value={params.B} onChange={e => updateParam('B', parseFloat(e.target.value))} />
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <label className="block text-[8px] text-slate-500 uppercase mb-1.5 font-black">埋深 H (m)</label>
                      <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-blue-400 font-bold" value={params.H} onChange={e => updateParam('H', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <h4 className="font-black text-red-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-2" /> 二衬表观病害参数
                </h4>
                <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl space-y-4 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/20 animate-scan pointer-events-none" />
                  <div>
                    <label className="block text-[8px] text-red-400 uppercase mb-2 font-black">全衬砌厚度 (mm)</label>
                    <input type="number" className="w-full bg-slate-950 border border-red-500/30 rounded-lg p-2.5 text-xs font-mono text-slate-300" value={params.dLining} onChange={e => updateParam('dLining', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[8px] text-red-500 uppercase mb-2 font-black">实测裂缝深度 (mm)</label>
                    <input type="number" className="w-full bg-slate-950 border border-red-500/50 rounded-lg p-2.5 text-lg font-black font-mono text-red-500 shadow-inner outline-none" value={params.dCrack} onChange={e => updateParam('dCrack', parseFloat(e.target.value))} />
                  </div>
                  <div className="flex items-center space-x-3 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                    <input type="checkbox" id="debris" checked={params.hasDebris} onChange={e => updateParam('hasDebris', e.target.checked)} className="accent-red-500 h-3.5 w-3.5 rounded border-red-500/50 bg-slate-900" />
                    <label htmlFor="debris" className="text-[10px] font-black text-red-400 uppercase tracking-tighter leading-none">拱顶存在物理掉块/背后空洞</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <h4 className="font-black text-indigo-400 text-[10px] uppercase tracking-[0.2em] flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-2" /> 加固处治实时预演
                </h4>
                <div className={`p-4 rounded-2xl border transition-all ${activeMeasure !== 'none' ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-slate-800/40 border-slate-700/50'}`}>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest outline-none cursor-pointer" value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}>
                    <option value="none">Baseline: 无加固背景</option>
                    <option value="S1">S1: 高聚物主动注浆</option>
                    <option value="S2">S2: 型钢挂板复合支护</option>
                    <option value="S3">S3: 柔性金属网复合喷锚</option>
                  </select>
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
                  <span>PROCESS_SOLVING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>执行围岩压力与结构诊断</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shadow-2xl relative z-20">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/10 animate-scan pointer-events-none" />
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Database className="w-5 h-5 text-blue-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100 tracking-wider uppercase">InfraGuard | 隧道围岩压力与衬砌健康度评估系统</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic uppercase border-l border-slate-700 pl-2">Lining Integrity Diagnostics // Load-Equivalent Height Mode</p>
              </div>
            </div>
            <button onClick={saveToHistory} className="group flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-700/50 shadow-lg active:scale-95">
              <Save className="w-3.5 h-3.5 mr-2 text-emerald-500 group-hover:scale-125 transition-transform" /> 案例归档
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20 custom-scrollbar relative z-10">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            {!results ? null : (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Result Dash Cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch font-mono">
                   <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group col-span-2">
                         <div className="absolute top-0 right-0 p-4 opacity-10 flex space-x-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full" />
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping" />
                         </div>
                         <div className="flex items-center justify-between">
                            <div>
                               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-blue-400" /> 自动工况判定 (Condition Analysis)
                               </div>
                               <div className={`text-4xl font-black italic tracking-tighter ${results.tunnel_type === '深埋隧道' ? 'text-blue-500' : 'text-emerald-500'} text-shadow-glow`}>
                                  {results.tunnel_type}
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">等效计算高度 (hq)</div>
                               <div className="text-2xl font-black text-slate-100">{results.hq.toFixed(2)} <span className="text-xs text-slate-600 uppercase">m</span></div>
                            </div>
                         </div>
                      </div>
                      
                      <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">垂直压力 (q)</div>
                         <div className="flex items-baseline space-x-2">
                            <div className="text-4xl font-black text-slate-100 tracking-tighter">{results.q_kPa.toFixed(1)}</div>
                            <div className="text-xs text-slate-600 font-bold uppercase tracking-widest">kPa</div>
                         </div>
                      </div>
                      
                      <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">侧压系数 (λ)</div>
                         <div className="flex items-baseline space-x-2 text-blue-400">
                            <div className="text-4xl font-black tracking-tighter font-mono italic">{results.lambda.toFixed(3)}</div>
                            <div className="text-[10px] font-black uppercase opacity-40">Matrix Coeff</div>
                         </div>
                      </div>
                   </div>

                   <div className={`md:col-span-4 p-8 rounded-[2.5rem] border relative flex flex-col justify-center overflow-hidden shadow-2xl ${results.damage_level >= 3 ? 'bg-red-500/10 border-red-500/50 ring-1 ring-red-500/20' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                      <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                         <div className={`p-5 rounded-full ${results.damage_level >= 3 ? 'bg-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {results.damage_level >= 3 ? <ShieldAlert className="w-12 h-12 animate-pulse" /> : <ShieldCheck className="w-12 h-12" />}
                         </div>
                         <div className="w-full">
                            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60 italic">
                               <span>Lining Performance</span>
                               <span>Ratio: {results.deep_rate.toFixed(1)}%</span>
                            </div>
                            <h3 className={`text-xl font-black tracking-tight leading-tight uppercase ${getDamageStatus(results.damage_level).textCol}`}>
                               {getDamageStatus(results.damage_level).text}
                            </h3>
                         </div>
                         <div className="pt-6 border-t border-white/5 w-full space-y-2">
                             <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                <span>剩余健康度指数</span>
                                <span className={results.health_score < 60 ? 'text-red-500' : 'text-emerald-500'}>{results.health_score.toFixed(1)}</span>
                             </div>
                             <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 shadow-inner p-[1px]">
                                <div className={`h-full rounded-full transition-all duration-1000 ${results.health_score > 85 ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : results.health_score > 60 ? 'bg-yellow-500' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} style={{ width: `${results.health_score}%` }} />
                             </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Physics Scene Visualization */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-10 shadow-3xl flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
                   <div className="absolute top-8 left-10 flex items-center space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">隧道横断面围岩压力与裂缝物理场 (Field Sim)</span>
                   </div>

                   <svg width="600" height="300" viewBox="0 0 600 300" className="relative z-10 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <defs>
                        <linearGradient id="rockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0f172a" />
                          <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                        <filter id="crackGlow">
                          <feGaussianBlur stdDeviation="1.5" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      {/* Surrounding Rock Area */}
                      <rect x="0" y="0" width="600" height="300" fill="url(#rockGrad)" opacity="0.3" />
                      
                      {/* Pressure Lines Top (hq Visualization) */}
                      <g className="animate-in fade-in duration-1000 slide-in-from-top-4">
                         <line x1="150" y1={100 - results.hq * 2} x2="450" y2={100 - results.hq * 2} stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" />
                         <text x="300" y={90 - results.hq * 2} textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="black" className="uppercase italic">Collapse Pressure Boundary (hq={results.hq.toFixed(1)}m)</text>
                         
                         {/* Down arrows for pressure */}
                         {[180, 240, 300, 360, 420].map((x, i) => (
                            <path key={i} d={`M ${x} ${100 - results.hq * 2} L ${x} 80`} stroke="#3b82f6" strokeWidth="1" markerEnd="url(#arrowhead)" opacity="0.4" />
                         ))}
                      </g>

                      {/* Tunnel Lining Outer */}
                      <path d="M 150 250 A 150 150 0 0 1 450 250" fill="none" stroke="#334155" strokeWidth="25" strokeLinecap="round" />
                      <line x1="150" y1="250" x2="450" y2="250" stroke="#334155" strokeWidth="15" />

                      {/* Tunnel Lining Inner (The dynamic one) */}
                      <path d="M 162 250 A 138 138 0 0 1 438 250" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
                      
                      {/* Cracks Rendering */}
                      {params.dCrack > 0 && (
                         <g filter="url(#crackGlow)">
                            {/* Vault Crack */}
                            <path 
                               d={`M 300 112 L ${300 + (Math.random() - 0.5) * 10} ${112 + params.dCrack/3} L 300 ${112 + params.dCrack/2}`} 
                               stroke="#f43f5e" 
                               strokeWidth={params.dCrack / 40} 
                               fill="none" 
                               className="animate-pulse"
                            />
                            {/* Shoulder Cracks */}
                            <path 
                               d={`M 200 150 L ${200 + params.dCrack/10} ${150 + params.dCrack/10}`} 
                               stroke="#f43f5e" 
                               strokeWidth={params.dCrack / 60} 
                               fill="none" 
                            />
                            <path 
                               d={`M 400 150 L ${400 - params.dCrack/10} ${150 + params.dCrack/10}`} 
                               stroke="#f43f5e" 
                               strokeWidth={params.dCrack / 60} 
                               fill="none" 
                            />
                         </g>
                      )}

                      {/* Debris Visualization */}
                      {params.hasDebris && (
                         <g className="animate-bounce">
                             <polygon points="290,120 310,120 300,140" fill="#475569" stroke="#ef4444" strokeWidth="1" />
                             <text x="300" y="160" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="black" className="uppercase">Loose_Block_Detected</text>
                         </g>
                      )}

                      {/* Arrow Marker Def */}
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                        </marker>
                      </defs>
                   </svg>
                   
                   <div className="absolute bottom-10 flex space-x-12 px-10 w-full justify-between items-center bg-slate-900/40 py-4 border-t border-slate-800/50 border-dashed">
                      <div className="flex items-center space-x-3 text-emerald-400">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                         <p className="text-[9px] font-black uppercase tracking-widest leading-none">Diagnostic: {params.rockClass} Class Rock // {activeMeasure === 'none' ? 'Baseline' : activeMeasure}</p>
                      </div>
                      <div className="flex items-center space-x-6 font-mono text-[10px]">
                         <div className="text-slate-500">Vertical Pressure (q): <span className="text-slate-100">{results.q_kPa.toFixed(1)} kN/m²</span></div>
                         <div className="text-slate-500">Safety Index: <span className={results.health_score < 70 ? 'text-red-500 underline' : 'text-emerald-400'}>{(results.health_score / 10).toFixed(2)} / 10</span></div>
                      </div>
                   </div>
                </div>

                {/* Optimization & AI Recommendation */}
                {results.health_score < 85 && !optResults && activeMeasure === 'none' && (
                  <div className="bg-slate-900/50 border-2 border-dashed border-indigo-500/30 rounded-[2rem] p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden animate-in fade-in zoom-in duration-500">
                    <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 flex items-center">
                         <Zap className="w-4 h-4 mr-2" /> AI 智能寻优矩阵激活 (Optimization Matrix)
                      </div>
                      <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">发现结构冗余不足 // 建议启动寻优</h3>
                      <p className="text-xs text-slate-500 font-mono italic max-w-lg">Neural compute detected sub-basal health scores. Initializing multi-objective reinforcement scheme traversal to optimize Costs, Time, and Structural Integrity.</p>
                    </div>
                    <button onClick={runOptimization} className="relative z-10 mt-8 md:mt-0 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/40 transition-all hover:scale-105 active:scale-95">
                      启动方案矩阵寻优
                    </button>
                  </div>
                )}

                {optResults && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center space-x-3 pl-4">
                       <Trophy className="w-6 h-6 text-yellow-500" />
                       <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest leading-none">最优处治方案矩阵 (Ranked Scheme Atlas)</h3>
                    </div>
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 shadow-3xl border border-indigo-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                           <Trophy className="w-48 h-48 text-white stroke-[1]" />
                        </div>
                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                           <div className="space-y-4 flex-1">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] block mb-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-fit">Top Predicted Model</span>
                              <h4 className="text-5xl font-black text-white italic tracking-tighter leading-none mb-6 underline decoration-indigo-500/30 underline-offset-8 decoration-4">{optResults[0].name}</h4>
                              <div className="flex flex-wrap gap-3">
                                 {optResults[0].measures.map((m: string, i: number) => (
                                    <div key={i} className="px-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-lg text-[9px] font-black font-mono text-slate-400 uppercase tracking-widest">{m}</div>
                                 ))}
                              </div>
                           </div>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:text-right font-mono">
                              <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase mb-2">估计全寿期造价</p>
                                 <p className="text-3xl font-black text-emerald-400 tracking-tighter shadow-emerald-500/20">¥{Math.round(optResults[0].cost).toLocaleString()}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase mb-2">预估施工工期</p>
                                 <p className="text-3xl font-black text-slate-100 tracking-tighter italic underline decoration-slate-800 underline-offset-4">{optResults[0].time.toFixed(1)} <span className="text-xs text-slate-600">D</span></p>
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                 <p className="text-[10px] font-black text-slate-500 uppercase mb-2">预期回归健康度</p>
                                 <p className="text-5xl font-black text-emerald-400 font-serif leading-none tracking-tighter shadow-glow">{optResults[0].finalHealth.toFixed(1)}</p>
                              </div>
                           </div>
                        </div>
                    </div>
                  </div>
                )}

                {/* Final Diagnostic Message */}
                <div className="bg-slate-900/50 rounded-3xl p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-10 p-6 opacity-5">
                      <Zap className="w-32 h-32 text-indigo-500" />
                   </div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center">
                     <Info className="w-4 h-4 mr-2 text-indigo-400" /> 结构动力学专家组决策简述
                   </h4>
                   <p className="text-xs leading-relaxed text-slate-500 font-medium italic">
                     根据围岩压力计算结果（q={results.q_kPa.toFixed(1)}kPa）及二衬病害深度比（{results.deep_rate.toFixed(1)}%），当前结构已处于{results.damage_level >= 3 ? '高度不安全状态' : '基本稳定工况'}。
                     {results.damage_level >= 3 
                       ? ' 建议立即建立受灾区段围挡，采用型钢拱架（I18以上）进行紧急补强支撑，并配合大流量径向注浆，改善背后脱空状态，封闭衬砌表面裂纹防止钢筋进一步氧化劣变。' 
                       : ' 建议维持现状监控频率，可采用柔性树脂填充微裂缝，提升二衬表观完整性，无需启动大型加固工程。'}
                   </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TunnelAnalysis;
