import React, { useState } from 'react';
import { Activity, ShieldAlert, Zap, Layers, Settings, Rocket, Target, Save, Gauge, ChevronRight, AlertTriangle, ShieldCheck, Database, Info } from 'lucide-react';
import { calculate_tunnel_pressure, optimize_tunnel_reinforcement, TunnelEngineParams } from '../../lib/tunnelCalculations';

const TunnelAnalysis: React.FC = () => {
  const [params, setParams] = useState<TunnelEngineParams>(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_tunnel_load') : null;
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('roadbedguard_pending_tunnel_load');
        }
        return loadedParams;
      } catch (e) {
        console.error("历史数据载入失败", e);
      }
    }
    return {
      B: 10.0, Ht: 7.0, H: 25.0, rockClass: 4, 
      gamma: 22.0, mu: 0.3, dLining: 400, dCrack: 120, hasDebris: false,
    };
  });
  const [results, setResults] = useState<any>(() => calculate_tunnel_pressure(params));
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  // const [optResults, setOptResults] = useState<any[] | null>(null);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    // setOptResults(null); 
    
    // 同步执行引擎计算，杜绝闭包陷阱
    const applied_params = { ...params };
    
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
  };

  /*
  const runOptimization = () => {
    setIsCalculating(true);
    // 同步执行寻优计算
    const ecoConfigStr = localStorage.getItem('roadbedguard_tunnel_economics');
    const ecoConfig = ecoConfigStr ? JSON.parse(ecoConfigStr) : {};
    const rankedSchemes = optimize_tunnel_reinforcement(params, ecoConfig);
    setOptResults(rankedSchemes);
    setIsCalculating(false);
  };
  */

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
    <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden relative shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-blue-600" /> 衬砌健康仿真配置
            </h3>
          </div>
          
          <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Parameters */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest flex items-center">
                  <Target className="w-3.5 h-3.5 mr-2 text-blue-500" /> 几何与地质参数矩阵
                </h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm focus-within:border-blue-500 transition-all">
                    <label className="block text-[9px] text-gray-500 uppercase mb-1 font-bold tracking-tight">围岩级别 (I-VI)</label>
                    <select className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-800 outline-none cursor-pointer appearance-none" value={params.rockClass} onChange={e => updateParam('rockClass', parseInt(e.target.value))}>
                      <option value={1}>I 级围岩 (优质)</option>
                      <option value={2}>II 级围岩 (良好)</option>
                      <option value={3}>III 级围岩 (中等)</option>
                      <option value={4}>IV 级围岩 (较差)</option>
                      <option value={5}>V 级围岩 (极差)</option>
                      <option value={6}>VI 级围岩 (散体)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm focus-within:border-blue-500 transition-all">
                      <label className="block text-[9px] text-gray-500 uppercase mb-1 font-bold tracking-tight">跨度 B (m)</label>
                      <input type="number" step="0.1" className="w-full bg-transparent border-none p-0 text-sm font-mono text-gray-800 outline-none" value={params.B} onChange={e => updateParam('B', parseFloat(e.target.value))} />
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm focus-within:border-blue-500 transition-all">
                      <label className="block text-[9px] text-gray-500 uppercase mb-1 font-bold tracking-tight">埋深 H (m)</label>
                      <input type="number" step="0.1" className="w-full bg-transparent border-none p-0 text-sm font-mono text-blue-600 font-bold outline-none" value={params.H} onChange={e => updateParam('H', parseFloat(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-red-600 text-[10px] uppercase tracking-widest flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-2" /> 二衬表观病害参数
                </h4>
                <div className="bg-red-50/30 border border-red-100 p-4 rounded-sm space-y-4">
                  <div>
                    <label className="block text-[9px] text-gray-500 uppercase mb-1 font-bold tracking-tight">全衬砌厚度 (mm)</label>
                    <input type="number" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-sm font-mono text-gray-800 outline-none focus:border-red-400" value={params.dLining} onChange={e => updateParam('dLining', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] text-red-700 uppercase mb-1 font-bold tracking-tight">实测裂缝深度 (mm)</label>
                    <input type="number" className="w-full bg-white border border-red-200 rounded-sm p-2 text-lg font-bold font-mono text-red-600 outline-none focus:border-red-500" value={params.dCrack} onChange={e => updateParam('dCrack', parseFloat(e.target.value))} />
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-sm border border-transparent hover:bg-red-50 transition-all cursor-pointer">
                    <input type="checkbox" id="debris" checked={params.hasDebris} onChange={e => updateParam('hasDebris', e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    <label htmlFor="debris" className="text-[10px] font-bold text-gray-700 uppercase tracking-tight cursor-pointer">拱顶存在掉块/背后空洞</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-indigo-600 text-[10px] uppercase tracking-widest flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-2" /> 加固处治实时预演
                </h4>
                <div className={`p-3 rounded-sm border transition-all ${activeMeasure !== 'none' ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                  <select className="w-full bg-transparent border-none p-0 text-[10px] font-bold text-indigo-700 uppercase tracking-wider outline-none cursor-pointer" value={activeMeasure} onChange={e => setActiveMeasure(e.target.value)}>
                    <option value="none">Baseline: 无加固背景</option>
                    <option value="S1">S1: 高聚物主动注浆</option>
                    <option value="S2">S2: 型钢挂板复合支护</option>
                    <option value="S3">S3: 柔性金属网复合喷锚</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={runStatusAnalysis} disabled={isCalculating}
              className={`w-full py-3 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm ${isCalculating ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>CALCULATING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>执行结构诊断</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm relative z-20">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-sm border border-blue-100">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 tracking-tight flex items-center uppercase">
                  InfraGuard | 隧道围岩压力与衬砌健康评估
                </h2>
              </div>
            </div>
            <button onClick={saveToHistory} className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all border border-gray-300 shadow-sm active:scale-95">
              <Save className="w-3.5 h-3.5 mr-2 text-gray-500" /> 案例归档
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar relative z-10">
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="p-6 bg-white rounded-full border border-gray-200 shadow-sm animate-pulse">
                  <Rocket className="w-12 h-12 text-gray-200" />
                </div>
                <p className="text-sm font-medium uppercase tracking-widest">请在左侧面板配置参数并启动仿真</p>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Result Dash Cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                   <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm relative overflow-hidden col-span-2">
                         <div className="flex items-center justify-between">
                            <div>
                               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-blue-500" /> 工况判定 (Condition)
                               </div>
                               <div className={`text-4xl font-bold tracking-tight ${results.tunnel_type === '深埋隧道' ? 'text-gray-900' : 'text-blue-700'}`}>
                                  {results.tunnel_type}
                               </div>
                            </div>
                            <div className="text-right bg-gray-50 p-4 border border-gray-100 rounded-sm">
                               <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">等效高度 (hq)</div>
                               <div className="text-2xl font-mono font-bold text-gray-900">{(results?.hq ?? 0).toFixed(2)} <span className="text-xs text-gray-400">m</span></div>
                            </div>
                         </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">垂直压力 (q)</div>
                         <div className="flex items-baseline space-x-2">
                            <div className="text-3xl font-bold text-gray-900 font-mono">{(results?.q_kPa ?? 0).toFixed(1)}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">kPa</div>
                         </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">侧压系数 (λ)</div>
                         <div className="flex items-baseline space-x-2">
                            <div className="text-3xl font-bold text-blue-600 font-mono italic">{(results?.lambda ?? 0).toFixed(3)}</div>
                         </div>
                      </div>
                   </div>

                   <div className={`md:col-span-4 p-6 rounded-sm border relative flex flex-col justify-center shadow-sm ${results.damage_level >= 3 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                         <div className={`p-4 rounded-full ${results.damage_level >= 3 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {results.damage_level >= 3 ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
                         </div>
                         <div className="w-full">
                            <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                               <span>Lining Performance</span>
                               <span>{(results?.deep_rate ?? 0).toFixed(1)}%</span>
                            </div>
                            <h3 className={`text-lg font-bold tracking-tight uppercase ${getDamageStatus(results.damage_level).textCol}`}>
                               {getDamageStatus(results.damage_level).text}
                            </h3>
                         </div>
                         <div className="pt-4 border-t border-gray-200 w-full space-y-2">
                             <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                <span>剩余健康度指数</span>
                                <span className="font-mono text-gray-800">{(results?.health_score ?? 0).toFixed(1)}</span>
                             </div>
                             <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${results.health_score > 85 ? 'bg-emerald-500' : results.health_score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${results.health_score}%` }} />
                             </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Physics Scene Visualization */}
                <div className="bg-white rounded-sm border border-gray-200 p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[460px]">
                   <div className="absolute top-6 left-8 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">断面监测数据仿真 (FDM-SIM)</span>
                   </div>

                   <svg width="640" height="340" viewBox="0 0 640 340" className="relative z-10">
                      <defs>
                        {/* Photorealistic Filters */}
                        <filter id="concreteNoise" x="0" y="0" width="100%" height="100%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
                          <feDiffuseLighting in="noise" lightingColor="#f3f4f6" surfaceScale="2">
                            <feDistantLight elevation="45" azimuth="45" />
                          </feDiffuseLighting>
                        </filter>
                        
                        <filter id="crackTurbulence">
                          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="5" result="noise" />
                          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
                        </filter>

                        <filter id="vectorGlow" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>

                        <pattern id="rockTexture" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                           <rect width="50" height="50" fill="#f8fafc" />
                           <circle cx="5" cy="5" r="1" fill="#e2e8f0" />
                           <circle cx="25" cy="15" r="1.5" fill="#cbd5e1" />
                           <circle cx="40" cy="35" r="1.2" fill="#e2e8f0" />
                        </pattern>
                      </defs>

                      {/* Surrounding Rock Area */}
                      <rect x="0" y="0" width="640" height="340" fill="url(#rockTexture)" rx="4" />
                      
                      {/* Pressure Boundary */}
                      <g className="opacity-50">
                         <line x1="160" y1={110 - (results?.hq ?? 0) * 2} x2="480" y2={110 - (results?.hq ?? 0) * 2} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" />
                         <text x="320" y={100 - (results?.hq ?? 0) * 2} textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold" className="uppercase">Load Boundary</text>
                      </g>

                      {/* Tunnel Lining (Industrial Photorealistic) */}
                      <g transform="translate(320, 260)">
                        {/* Outer Concrete Layer */}
                        <path d="M -160 0 A 160 160 0 0 1 160 0" fill="none" stroke="#94a3b8" strokeWidth="32" strokeLinecap="round" filter="url(#concreteNoise)" />
                        
                        {/* Inner Void */}
                        <path d="M -144 0 A 144 144 0 0 1 144 0" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                        <line x1="-160" y1="0" x2="160" y2="0" stroke="#94a3b8" strokeWidth="16" filter="url(#concreteNoise)" />

                        {/* Convergence Vectors (Glow) */}
                        <g filter="url(#vectorGlow)" opacity={results.health_score < 80 ? 0.8 : 0.3}>
                          <path d="M -140 -20 Q 0 -170 140 -20" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
                          <circle cx="0" cy="-144" r="3" fill="#3b82f6" fillOpacity="0.6" />
                          <line x1="0" y1="-144" x2="0" y2="-164" stroke="#3b82f6" strokeWidth="2" />
                        </g>

                        {/* Cracks Rendering with Turbulence */}
                        {params.dCrack > 0 && (
                           <g filter="url(#crackTurbulence)">
                              <path 
                                 d={`M 0 -144 L -2 ${-144 + params.dCrack/2}`} 
                                 stroke="#450a0a" 
                                 strokeWidth={params.dCrack / 50} 
                                 fill="none" 
                                 opacity="0.8"
                              />
                              <path 
                                 d={`M -100 -100 L ${-100 + params.dCrack/15} ${-100 + params.dCrack/10}`} 
                                 stroke="#450a0a" 
                                 strokeWidth={params.dCrack / 80} 
                                 fill="none" 
                              />
                              <path 
                                 d={`M 100 -100 L ${100 - params.dCrack/15} ${-100 + params.dCrack/10}`} 
                                 stroke="#450a0a" 
                                 strokeWidth={params.dCrack / 80} 
                                 fill="none" 
                              />
                           </g>
                        )}

                        {/* Debris / Loose material */}
                        {params.hasDebris && (
                           <g transform="translate(0, -152)">
                              <path d="M -10 5 L 0 15 L 10 5 Z" fill="#475569" stroke="#ef4444" strokeWidth="0.5" />
                              <text y="30" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold" className="uppercase">Void_Detected</text>
                           </g>
                        )}
                      </g>
                   </svg>
                   
                   <div className="absolute bottom-8 px-10 w-full flex justify-between items-center text-[10px] text-gray-500 font-medium">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-sm" /> 围岩: {params.rockClass}类
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-sm" /> 衬砌
                        </div>
                        {params.dCrack > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-900 rounded-sm" /> 生成裂缝
                          </div>
                        )}
                      </div>
                      <div className="font-mono text-gray-400">HQ_CALC: {(results?.hq ?? 0).toFixed(3)}m</div>
                   </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm relative overflow-hidden group">
                   <div className="flex items-start space-x-4">
                     <div className="p-3 bg-indigo-50 rounded-sm border border-indigo-100 mt-1">
                        <Info className="w-5 h-5 text-indigo-600" />
                     </div>
                     <div className="flex-1">
                       <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                         核心结构诊断报告 (Structure Diagnostic Summary)
                       </h4>
                       <p className="text-sm leading-relaxed text-gray-700 font-medium tracking-tight">
                         当前隧道断面{(results?.damage_level ?? 0) >= 3 ? '处于高度危急工况' : '结构稳定性评估正常'}。
                         垂直载荷实测 q={(results?.q_kPa ?? 0).toFixed(1)} kPa。
                         {(results?.damage_level ?? 0) >= 3 
                           ? ' 诊断建议：裂缝深度已穿透二衬厚度 50% 以上，建议立即启动型钢拱架（I20a）支护，并针对背后脱空区进行双浆液充填，防止顶部坍方进一步恶化。' 
                           : ' 诊断建议：结构处于弹性工作阶段，建议保持日常巡检频率（SV.Q3/月），重点观察拱脚及仰拱变形速率。'}
                       </p>
                     </div>
                   </div>
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
