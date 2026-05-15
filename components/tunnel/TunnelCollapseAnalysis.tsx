import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Info, Settings, Layers, Target, AlertTriangle, Zap, Rocket, ChevronRight, Gauge, Database, Trash2, Box } from 'lucide-react';
import { calculate_tunnel_collapse } from '../../lib/tunnelCalculations';

const TunnelCollapseAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState({
    B: 10.0,
    Ht: 7.0,
    f: 0.8,
    collapse_length: 15.0
  });
  const [results, setResults] = useState<any>(null);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_tunnel_collapse(params);
      setResults(res);
      setIsCalculating(false);
    }, 600);
  };

  useEffect(() => { runAnalysis(); }, []);

  const getStatusColor = (ratio: number) => {
    if (ratio > 70) return 'text-red-500';
    if (ratio > 30) return 'text-orange-500';
    return 'text-emerald-500';
  };

  const getIntensityText = (ratio: number) => {
    if (ratio > 80) return 'CRITICAL_MAX_BLOCK';
    if (ratio > 30) return 'MEDIUM_OBSTRUCTION';
    return 'LOW_IMPACT_FRAG';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
          
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 坍塌规模仿真配置
            </h3>
            <div className="flex space-x-1">
               <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
               <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse [animation-delay:200ms]" />
            </div>
          </div>
          
          <div className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Parameters */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Target className="w-3.5 h-3.5 mr-2 text-red-500" /> 地质与几何参数矩阵
              </h4>
              <div className="space-y-6">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-red-400/20 animate-scan pointer-events-none" />
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">普氏坚固系数 f</label>
                  <input type="number" step="0.1" className="w-full bg-slate-950 border border-red-500/30 rounded-lg p-2.5 text-lg font-black font-mono text-red-500 outline-none shadow-inner" value={params.f} onChange={e => updateParam('f', parseFloat(e.target.value))} />
                  <p className="mt-2 text-[7px] text-slate-500 leading-tight font-mono italic">REF: 极软弱_0.5 // 中等_1.0 // 坚硬_2.0+</p>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">隧道开挖宽度 B (m)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-300" value={params.B} onChange={e => updateParam('B', parseFloat(e.target.value))} />
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">纵向坍塌长度 (m)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-300" value={params.collapse_length} onChange={e => updateParam('collapse_length', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md sticky bottom-0 z-10">
            <button 
              onClick={runAnalysis} disabled={isCalculating}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-2xl ${isCalculating ? 'bg-slate-800 text-slate-600' : 'bg-red-600 text-white hover:bg-red-500 shadow-red-500/20'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-red-400" />
                  <span>MATRIX_SOLVING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>执行坍塌动态推演</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shadow-2xl relative z-20">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/10 animate-scan pointer-events-none" />
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <Box className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100 tracking-wider uppercase">InfraGuard | 隧道冒顶、坍塌与封堵灾毁评估系统</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic uppercase border-l border-slate-700 pl-2">Protodyakonov's Arch Theory Implementation</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[8px] uppercase tracking-widest text-slate-500">
               <Database className="w-3 h-3 text-red-500" /> Arch_Method: Static_Active
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20 custom-scrollbar relative z-10">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            {!results ? null : (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Result Dash Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono">
                  <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">普氏拱高度 hq</div>
                    <div className="flex items-baseline space-x-2">
                       <div className="text-4xl font-black text-orange-500 tracking-tighter shadow-orange-500/20">{results.hq.toFixed(2)}</div>
                       <div className="text-[10px] text-slate-600 font-bold uppercase">Meters</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">坍塌总体积</div>
                    <div className="flex items-baseline space-x-2">
                       <div className="text-4xl font-black text-slate-100 tracking-tighter">{Math.round(results.volume).toLocaleString()}</div>
                       <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">m³</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                       <span>断面封堵率</span>
                       <span className="text-red-500 opacity-50">#BLOCK</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                       <div className={`text-4xl font-black tracking-tighter ${results.blockage_ratio > 70 ? 'text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'text-blue-500'}`}>
                          {results.blockage_ratio.toFixed(1)}%
                       </div>
                       <div className="text-[10px] text-slate-600 font-black uppercase">Ratio</div>
                    </div>
                    <div className="mt-4 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                       <div className={`h-full transition-all duration-1000 ${results.blockage_ratio > 70 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${results.blockage_ratio}%` }} />
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl border flex flex-col justify-center relative overflow-hidden shadow-2xl ${results.blockage_ratio > 70 ? 'bg-red-500/10 border-red-500/50 ring-1 ring-red-500/20' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">灾害分级 (Tier)</div>
                    <div className={`text-4xl font-black tracking-tighter italic ${results.blockage_ratio > 70 ? 'text-red-500' : 'text-orange-500 underline decoration-orange-500/30'}`}>
                       {getIntensityText(results.blockage_ratio)}
                    </div>
                  </div>
                </div>

                <div className={`p-10 rounded-[2.5rem] border relative overflow-hidden shadow-3xl transition-all ${results.blockage_ratio > 50 ? 'bg-red-500/10 border-red-500/40' : 'bg-orange-500/10 border-orange-500/40'}`}>
                    <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                       <div className={`p-6 rounded-full shadow-2xl ${results.blockage_ratio > 50 ? 'bg-red-500/20 text-red-500 shadow-red-500/20' : 'bg-orange-500/20 text-orange-500 shadow-orange-500/20 text-shadow-glow'}`}>
                          <AlertTriangle className={`w-12 h-12 ${results.blockage_ratio > 80 ? 'animate-bounce' : 'animate-pulse'}`} />
                       </div>
                       <div className="flex-1 text-center md:text-left">
                          <span className={`text-[10px] font-black uppercase tracking-[0.5em] mb-3 block ${results.blockage_ratio > 50 ? 'text-red-400' : 'text-orange-400'}`}>通行中断与灾毁级别实时判定 (Real-time Alert)</span>
                          <h3 className={`text-2xl font-black tracking-tight leading-tight uppercase italic ${results.blockage_ratio > 50 ? 'text-white underline decoration-red-500 decoration-4 underline-offset-8' : 'text-slate-100'}`}>
                            {results.blockage_ratio > 80 
                              ? '隧道已发生灾难性大范围冒顶封堵，双向交通完全中断 // 立即进入一级响应状态' 
                              : results.blockage_ratio > 30 
                                ? '局部坍塌物质已侵入二衬净空限界，存在持续掉块风险 // 建议强制交通管制' 
                                : '监测到低强度结构掉块，围岩压力轴微偏 // 维持常规巡检频率'}
                          </h3>
                       </div>
                       <div className="flex flex-col items-center bg-slate-950/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 space-y-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Security_Index</span>
                          <div className={`text-4xl font-black ${results.blockage_ratio > 70 ? 'text-red-500' : 'text-emerald-500'}`}>
                             {Math.max(0, 100 - results.blockage_ratio).toFixed(1)}
                          </div>
                          <p className="text-[8px] font-black text-slate-600 uppercase italic">Basal_Integrity</p>
                       </div>
                    </div>
                </div>

                {/* Physics Visualization */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-10 shadow-3xl flex flex-col items-center justify-center relative overflow-hidden min-h-[460px]">
                   <div className="absolute top-8 left-10 flex items-center space-x-3">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">普氏拱动态坍落与断面封堵可视化 (Structural Simulation)</span>
                   </div>

                   <div className="relative w-full max-w-lg h-80 bg-slate-950/80 rounded-3xl shadow-inner overflow-hidden flex items-end justify-center border border-slate-800">
                      <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />
                      
                      {/* Scale Grid */}
                      <div className="absolute left-6 top-6 flex flex-col space-y-1">
                         <div className="w-8 h-[1px] bg-slate-800" />
                         <div className="w-8 h-[1px] bg-slate-800" />
                         <div className="w-8 h-[1px] bg-slate-800" />
                         <text className="text-[8px] font-mono text-slate-600 uppercase font-black italic tracking-tighter mt-2">H_Scale: 1:150</text>
                      </div>

                      {/* Tunnel Arch Outline */}
                      <div className="absolute w-[300px] h-[150px] border-[1px] border-slate-700/50 rounded-t-full bottom-0 left-1/2 -translate-x-1/2 bg-slate-900/40 z-0 shadow-2xl">
                          <div className="absolute inset-2 border-[1px] border-slate-800/30 rounded-t-full" />
                      </div>
                      
                      {/* Falling Rocks Effect (SVG overlay for particles) */}
                      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
                         {Array.from({ length: 8 }).map((_, i) => (
                            <rect 
                              key={i} 
                              x={150 + Math.random() * 200} 
                              y="-20" 
                              width={4 + Math.random() * 8} 
                              height={4 + Math.random() * 8} 
                              fill="#94a3b8" 
                              opacity="0.6"
                              className="animate-[fall_2s_infinite]"
                              style={{ animationDelay: `${i * 300}ms` }}
                            />
                         ))}
                         <style>{`
                           @keyframes fall {
                             0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                             10% { opacity: 0.8; }
                             90% { opacity: 0.8; }
                             100% { transform: translateY(280px) rotate(360deg); opacity: 0; }
                           }
                         `}</style>
                      </svg>
                      
                      {/* Debris Pile (Accumulated) */}
                      <div 
                        className="absolute bg-gradient-to-t from-slate-700 to-orange-500/40 w-[240px] transition-all duration-1000 ease-out z-10 border-t border-orange-500/30 overflow-hidden backdrop-blur-sm"
                        style={{ 
                          height: `${(results.blockage_ratio / 100) * 160}px`,
                          bottom: '0',
                          borderTopLeftRadius: '45% 100%',
                          borderTopRightRadius: '45% 100%',
                          boxShadow: '0 -10px 30px rgba(249,115,22,0.1)'
                        }}
                      >
                         <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.1]" />
                      </div>
                      
                      {/* Collapse Protodyakonov's Arch */}
                      <div 
                        className="absolute border-2 border-dashed border-red-500/40 bg-red-500/5 transition-all duration-1000 bottom-0 z-5"
                        style={{
                          width: '300px',
                          height: `${(results.hq / 12) * 150 + 150}px`,
                          left: 'calc(50% - 150px)',
                          borderTopLeftRadius: '50% 100%',
                          borderTopRightRadius: '50% 100%'
                        }}
                      >
                         <div className="absolute top-4 left-1/2 -translate-x-1/2 p-2 bg-slate-900/80 border border-red-500/30 rounded text-[8px] font-black text-red-400 uppercase tracking-widest whitespace-nowrap backdrop-blur-md italic animate-pulse">
                            Active_Protodyakonov_Arch
                         </div>
                      </div>
                   </div>
                   
                   <div className="absolute bottom-10 flex space-x-12 px-10 w-full justify-between items-center bg-slate-900/40 py-4 border-t border-slate-800/50 border-dashed">
                      <div className="flex items-center space-x-3 text-red-500 shadow-glow">
                         <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                         <p className="text-[9px] font-black uppercase tracking-widest leading-none">Simulation: f={params.f} // B={params.B}m // Arch_HQ={results.hq.toFixed(2)}m</p>
                      </div>
                      <div className="flex items-center space-x-6">
                         <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Collapse_Vol: <span className="text-slate-100">{Math.round(results.volume)} m³</span></div>
                         <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${results.blockage_ratio > 50 ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                            Blockage: {results.blockage_ratio.toFixed(1)}%
                         </div>
                      </div>
                   </div>
                </div>

                {/* SOP Actions */}
                <div className="space-y-6">
                   <div className="flex items-center space-x-3 pl-4">
                      <Zap className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest leading-none">应急处治与灾损修复决策 (Recovery SOP Matrix)</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono tracking-tighter">
                      <div className="bg-slate-900 outline outline-1 outline-slate-800 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:outline-blue-500/50 transition-all">
                         <div className="absolute top-0 right-0 p-3 opacity-20">
                            <ChevronRight className="w-8 h-8 text-blue-500" />
                         </div>
                         <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center mr-2 border border-blue-500/20">01</span> Phase: STABILIZE
                         </div>
                         <p className="text-xs leading-relaxed text-slate-400 font-medium italic">
                           立即启动“超前大管棚”预支护，向塌体顶部及拱脚注入早强改性浆液，形成人工拱圈隔离带，防止松散岩体持续冒顶剥离。
                         </p>
                      </div>
                      <div className="bg-slate-900 outline outline-1 outline-slate-800 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:outline-orange-500/50 transition-all">
                         <div className="absolute top-0 right-0 p-3 opacity-20">
                            <ChevronRight className="w-8 h-8 text-orange-500" />
                         </div>
                         <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center mr-2 border border-orange-500/20">02</span> Phase: REMOVE
                         </div>
                         <p className="text-xs leading-relaxed text-slate-400 font-medium italic">
                           在预支护形成保护伞后，遵循“短进尺、弱爆破、强支护”原则，采用多台阶CD法谨慎清理塌方物质，实时监测二衬偏心应变增量。
                         </p>
                      </div>
                      <div className="bg-slate-900 outline outline-1 outline-slate-800 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group hover:outline-emerald-500/50 transition-all">
                         <div className="absolute top-0 right-0 p-3 opacity-20">
                            <ChevronRight className="w-8 h-8 text-emerald-500" />
                         </div>
                         <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center mr-2 border border-emerald-500/20">03</span> Phase: RESTORE
                         </div>
                         <p className="text-xs leading-relaxed text-slate-400 font-medium italic">
                            整体复核衬砌刚度，针对受损严重的DCV区段，增加内衬型钢拱架（I20b以上）进行永久加固，并配合大流量径向回填注浆确保整体性。
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

export default TunnelCollapseAnalysis;
