import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Info, Settings, Target, Layers, ArrowRight, Gauge, Zap, Rocket, ChevronRight, AlertTriangle, ShieldCheck, Database, Scan } from 'lucide-react';
import { calculate_tunnel_void } from '../../lib/tunnelCalculations';

const TunnelVoidAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState({
    angle: 60,   // 脱空弧度 (deg)
    depth: 300,  // 空洞深度 (mm)
    radius: 5.5  // 隧道半径 (m)
  });
  const [results, setResults] = useState<any>(null);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_tunnel_void(params);
      setResults(res);
      setIsCalculating(false);
    }, 600);
  };

  useEffect(() => { runAnalysis(); }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-orange-500/20 to-transparent" />
          
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 壁后脱空量化配置
            </h3>
            <div className="flex space-x-1">
               <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
               <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse [animation-delay:200ms]" />
            </div>
          </div>
          
          <div className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Parameters */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Target className="w-3.5 h-3.5 mr-2 text-blue-500" /> 脱空几何参数矩阵
              </h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[8px] text-slate-500 uppercase font-black">脱空扩散范围 (deg)</label>
                    <span className="text-xs font-black font-mono text-orange-500 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-md shadow-inner">{params.angle}°</span>
                  </div>
                  <input 
                    type="range" min="10" max="180" 
                    className="w-full bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer accent-orange-500 shadow-inner" 
                    value={params.angle} 
                    onChange={e => updateParam('angle', parseFloat(e.target.value))} 
                  />
                  <div className="flex justify-between text-[8px] text-slate-600 font-black mt-2 font-mono italic">
                    <span>MIN_10°</span>
                    <span>MAX_180°</span>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-red-400/20 animate-scan pointer-events-none" />
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">空洞深度 (mm)</label>
                  <input type="number" className="w-full bg-slate-950 border border-red-500/30 rounded-lg p-2.5 text-lg font-black font-mono text-red-500 outline-none shadow-inner" value={params.depth} onChange={e => updateParam('depth', parseFloat(e.target.value))} />
                </div>

                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">隧道净径 R (m)</label>
                  <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-300" value={params.radius} onChange={e => updateParam('radius', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md sticky bottom-0 z-10">
            <button 
              onClick={runAnalysis} disabled={isCalculating}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-2xl ${isCalculating ? 'bg-slate-800 text-slate-600 font-mono' : 'bg-slate-100 text-slate-900 hover:bg-white shadow-white/10'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>RE-SOLVING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>执行受力重分布仿真</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shadow-2xl relative z-20">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-orange-500/10 animate-scan pointer-events-none" />
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <Scan className="w-5 h-5 text-orange-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100 tracking-wider uppercase">InfraGuard | 隧道衬砌壁后脱空与偏心受力分析</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic uppercase border-l border-slate-700 pl-2">Lining Eccentricity & Redistribution Matrix</p>
              </div>
            </div>
            <div className="text-[8px] font-black text-slate-600 font-mono uppercase tracking-widest hidden md:block px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg">
               System Status: <span className="text-emerald-500 animate-pulse">Synced</span> // Mode: Static
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20 custom-scrollbar relative z-10">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            {!results ? null : (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Result Dash Cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch font-mono">
                  <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between">
                         <span>应力偏心矩增量</span>
                         <span className="text-shadow-glow">ΔE</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                         <div className="text-4xl font-black text-slate-100 tracking-tighter">{results.e_increment.toFixed(3)}</div>
                         <div className="text-xs text-slate-600 font-bold uppercase tracking-widest">Meters</div>
                      </div>
                      {/* Trend mini spark */}
                      <div className="mt-4 flex items-end space-x-1 h-6 opacity-40">
                         {[30, 45, 60, 40, 50, 70, results.e_increment * 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-slate-700 rounded-t-sm" style={{ height: `${Math.min(100, (h / 100) * 100)}%` }} />
                         ))}
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">承载力有效系数</div>
                      <div className="flex items-baseline space-x-2">
                         <div className={`text-4xl font-black tracking-tighter ${results.reduction_factor < 0.8 ? 'text-orange-500 text-shadow-glow' : 'text-emerald-500'}`}>
                            {(results.reduction_factor * 100).toFixed(1)}%
                         </div>
                         <div className="text-xs text-slate-600 font-bold uppercase tracking-widest">Efficiency</div>
                      </div>
                      <div className="mt-4 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                         <div className={`h-full rounded-full transition-all duration-1000 ${results.reduction_factor > 0.9 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${results.reduction_factor * 100}%` }} />
                      </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl col-span-1 md:col-span-2 flex justify-between items-center relative overflow-hidden border-l-4 border-l-indigo-500/50">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <Activity className="w-32 h-32 text-indigo-500 stroke-[1]" />
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                             <Database className="w-3.5 h-3.5 mr-2 text-indigo-400" /> Stress Displacement Vector Matrix
                          </div>
                          <div className="flex items-baseline space-x-4">
                             <div className="text-5xl font-black tracking-tighter italic text-slate-100">
                                {results.status === 'critical' ? 'CRITICAL_FAIL' : 'NOMINAL_STATE'}
                             </div>
                             <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">Structural Balance Check</div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className={`md:col-span-4 p-8 rounded-[2.5rem] border relative flex flex-col justify-center overflow-hidden shadow-2xl ${results.status === 'critical' ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                     <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                     <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className={`p-5 rounded-full ${results.status === 'critical' ? 'bg-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-emerald-500/20 text-emerald-500'}`}>
                           {results.status === 'critical' ? <ShieldAlert className="w-12 h-12 animate-bounce" /> : <ShieldCheck className="w-12 h-12" />}
                        </div>
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 block opacity-60">Security Analysis</span>
                           <h3 className={`text-2xl font-black tracking-tight leading-tight uppercase ${results.status === 'critical' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {results.status === 'critical' ? '🔴 极高安全风险' : '🟢 结构状态稳定'}
                           </h3>
                        </div>
                        <div className="pt-6 border-t border-white/5 w-full">
                            <p className="text-[9px] font-mono leading-relaxed opacity-60 italic tracking-tighter">
                               {results.status === 'critical' 
                                 ? 'SYSTEM_ERROR: Excessive eccentricity detected. Potential for lining collapse is HIGH.' 
                                 : 'STATUS_NOMINAL: Load distribution within elastic limits. Maintaining structural integrity.'}
                            </p>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Tunnel Visualization */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-10 shadow-3xl flex flex-col items-center justify-center relative overflow-hidden min-h-[460px]">
                   <div className="absolute top-8 left-10 flex items-center space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">断面受力偏移与雷达空洞图谱 (Cross-Section Heatmap)</span>
                   </div>

                   <svg width="600" height="340" viewBox="0 0 600 340" className="relative z-10 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <defs>
                        <linearGradient id="liningGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                        <radialGradient id="voidGrad" cx="50%" cy="50%" r="50%">
                           <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4}/>
                           <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                        </radialGradient>
                      </defs>
                      
                      {/* Surround Rock Base */}
                      <rect x="0" y="0" width="600" height="340" fill="#020617" opacity="0.5" />
                      
                      {/* Radar Scan Ring (Dynamic) */}
                      <circle cx="300" cy="170" r="140" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.2" className="animate-[ping_3s_infinite_linear]" />
                      <circle cx="300" cy="170" r="120" fill="none" stroke="#2563eb" strokeWidth="0.5" strokeOpacity="0.1" />
                      
                      {/* Void Highlight Area */}
                      <path 
                        d={`M 300 170 L ${300 + 130 * Math.sin(-params.angle/2 * Math.PI/180)} ${170 - 130 * Math.cos(-params.angle/2 * Math.PI/180)} A 130 130 0 0 1 ${300 + 130 * Math.sin(params.angle/2 * Math.PI/180)} ${170 - 130 * Math.cos(params.angle/2 * Math.PI/180)} Z`}
                        fill="url(#voidGrad)" 
                        stroke="#ef4444" 
                        strokeWidth="2" 
                        strokeDasharray="4 4"
                        className="animate-pulse"
                      />
                      
                      {/* Tunnel Lining Cross-Section */}
                      <circle cx="300" cy="170" r="110" fill="none" stroke="url(#liningGrad)" strokeWidth="18" className="shadow-2xl" />
                      <circle cx="300" cy="170" r="105" fill="none" stroke="#0f172a" strokeWidth="1" opacity="0.3" />
                      
                      {/* Stress Center Marker */}
                      <g transform={`translate(${results.e_increment * 300}, 0)`}>
                          <circle cx="300" cy="170" r="8" fill="#6366f1" className="shadow-[0_0_15px_rgba(99,102,241,0.8)]">
                             <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                          </circle>
                          <line x1="300" y1="170" x2="300" y2="280" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                          <text x="305" y="275" fill="#6366f1" fontSize="8" fontWeight="black" className="uppercase font-mono tracking-widest italic">Offset_Axis</text>
                      </g>
                      
                      {/* Center Point Reference */}
                      <circle cx="300" cy="170" r="3" fill="#334155" />
                      <line x1="260" y1="170" x2="340" y2="170" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                      <line x1="300" y1="130" x2="300" y2="210" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />

                      {/* Information Overlay */}
                      <text x="300" y="310" textAnchor="middle" fill="#64748b" fontSize="8" fontStyle="italic" fontWeight="black" className="uppercase opacity-40">Dynamic Structural Strain Redistribution View</text>
                   </svg>
                   
                   <div className="absolute top-1/2 right-12 -translate-y-1/2 flex flex-col space-y-6">
                      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
                         <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1.5 flex items-center">
                            <Zap className="w-3.5 h-3.5 mr-2" /> Void Area
                         </div>
                         <div className="text-xl font-black font-mono text-slate-100">{params.angle}°</div>
                         <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-1 italic leading-none">Arc_Spread_Factor</div>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
                         <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center">
                            <Activity className="w-3.5 h-3.5 mr-2" /> Eccen Δ
                         </div>
                         <div className="text-xl font-black font-mono text-slate-100">{results.e_increment.toFixed(3)}m</div>
                         <div className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-1 italic leading-none">Axis_Shift_Value</div>
                      </div>
                   </div>
                </div>

                {/* Expert Diagnostics */}
                <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden group border-l-4 border-l-orange-500/40">
                   <div className="absolute top-0 right-10 p-8 opacity-5">
                      <Info className="w-24 h-24 text-white" />
                   </div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center">
                     <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" /> 壁后脱空及受力重分布专家级评估 (Expert Logic Matrix)
                   </h4>
                   <div className="space-y-4">
                     <p className="text-xs leading-relaxed text-slate-400 font-medium">
                       壁后脱空彻底破坏了隧道原设计的“围岩-衬砌”共同作用机制。当前的计算结果表明，由于
                       <span className="font-black text-orange-500 font-mono italic"> {params.angle}° </span> 范围的荷载支撑缺失，结构主应力轴已发生明显的非对称偏转。
                     </p>
                     <div className={`p-5 rounded-2xl border ${results.status === 'critical' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                        <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center">
                           <Zap className="w-3.5 h-3.5 mr-2" /> Diagnostic Directive
                        </div>
                        <p className="text-xs font-bold leading-relaxed italic">
                           {results.status === 'critical' 
                             ? '🚨 警告：应力偏心量已超出核心区。必须立即启动二级应急预案：对脱空区进行双液注浆充填，同步补强受压侧衬砌纵向钢筋，防止衬砌发生突然性的脆性动力断裂。' 
                             : 'ℹ️ 现状偏心量尚受拉伸区钢筋限制，结构整体表现为带裂缝工作。建议建立自动化激光扫描长期监测系统，观察空洞是否有向两侧伴生扩展的趋势。'}
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

export default TunnelVoidAnalysis;
