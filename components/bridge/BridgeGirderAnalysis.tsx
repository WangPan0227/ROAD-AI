import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Activity, Layers, Settings, Info, Gauge, Zap, Rocket, ChevronRight, AlertTriangle } from 'lucide-react';
import { calculate_girder_unseating } from '../../lib/bridgeCalculations';

const BridgeGirderAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState({
    span_length: 30, // m
    support_length: 80, // cm
    pier_disp_cm: 20 // cm
  });
  const [results, setResults] = useState<any>(null);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_girder_unseating(params);
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
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
          
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 落梁风险评估配置
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
                <Layers className="w-3.5 h-3.5 mr-2 text-blue-500" /> 支承连接与搭接长度矩阵
              </h4>
              <div className="space-y-4">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">主梁跨径 L (m)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-blue-400" value={params.span_length} onChange={e => updateParam('span_length', parseFloat(e.target.value))} />
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">设计支承长度 a_design (cm)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-blue-400" value={params.support_length} onChange={e => updateParam('support_length', parseFloat(e.target.value))} />
                </div>
                <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-red-500/40 animate-scan pointer-events-none" />
                  <label className="block text-[9px] text-red-400 uppercase font-black mb-3 tracking-widest flex justify-between">
                    <span>实测横向位移</span>
                    <span className="text-shadow-glow">Δ_ACTUAL</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="number" 
                      className="flex-1 bg-slate-950 border border-red-500/30 rounded-lg p-3 text-xl font-black text-red-500 font-mono focus:ring-1 focus:ring-red-500 outline-none" 
                      value={params.pier_disp_cm} 
                      onChange={e => updateParam('pier_disp_cm', parseFloat(e.target.value))} 
                    />
                    <span className="text-[10px] font-mono font-black text-red-500/50 uppercase">cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md sticky bottom-0 z-10">
            <button 
              onClick={runAnalysis} disabled={isCalculating}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-2xl ${isCalculating ? 'bg-slate-800 text-slate-600 font-mono' : 'bg-red-600 text-white hover:bg-red-500 shadow-red-500/20 uppercase'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-red-400" />
                  <span>DECODING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  <span>执行落梁风险仿真</span>
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
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100 tracking-wider uppercase">InfraGuard | 梁体垮塌/落梁灾毁评估系统</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic uppercase border-l border-slate-700 pl-2">Unseating Risk Analysis // JTG D62 Model Ver 2.4</p>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg hidden md:block">
               <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center">系统完整度</div>
               <div className="h-1 w-24 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '85%' }} />
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20 custom-scrollbar relative z-10">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            {!results ? null : (
              <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Result Cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch font-mono">
                  <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex justify-between">
                         <span>规范最小搭接长度</span>
                         <span className="text-blue-400">N_REQ</span>
                      </div>
                      <div className="flex items-baseline space-x-2">
                         <div className="text-4xl font-black text-slate-100 tracking-tighter">{results.N_req.toFixed(1)}</div>
                         <div className="text-xs text-slate-600 font-bold uppercase tracking-widest">CM</div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">当前剩余搭接长度</div>
                      <div className="flex items-baseline space-x-2">
                         <div className={`text-4xl font-black tracking-tighter ${results.remaining_support < 10 ? 'text-red-500 text-shadow-glow' : 'text-blue-500 underline decoration-blue-500/20'}`}>
                            {results.remaining_support.toFixed(1)}
                         </div>
                         <div className="text-xs text-slate-600 font-bold uppercase tracking-widest">CM</div>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl col-span-1 md:col-span-2 flex justify-between items-center relative overflow-hidden border-l-4 border-l-orange-500/50">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-orange-500">
                          <Activity className="w-24 h-24 stroke-[1]" />
                       </div>
                       <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                             <Activity className="w-3.5 h-3.5 mr-2 text-orange-500" /> 动态支座脱空风险系数 (Overlap Ratio)
                          </div>
                          <div className="flex items-baseline space-x-4">
                             <div className={`text-7xl font-black tracking-tighter italic ${results.risk_ratio >= 1.0 ? 'text-red-500' : 'text-orange-400'}`}>
                                {(results.risk_ratio * 100).toFixed(1)}%
                             </div>
                             <div className="text-xs font-black uppercase tracking-widest opacity-30">Risk Matrix Factor</div>
                          </div>
                       </div>
                       <div className="hidden lg:block w-40">
                          <div className="text-[9px] font-mono text-slate-500 uppercase mb-2">Stability Trace</div>
                          <div className="flex items-end space-x-1 h-12">
                             {[40, 60, 45, 70, 85, 60, 50, 90, params.pier_disp_cm * 2].map((h, i) => (
                                <div key={i} className={`w-2 transition-all duration-500 ${i === 8 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-slate-800'}`} style={{ height: `${Math.min(100, (h / 100) * 100)}%` }} />
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className={`md:col-span-4 p-8 rounded-[2.5rem] border relative flex flex-col justify-center overflow-hidden shadow-2xl ${results.is_unseated ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                     <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                     <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className={`p-5 rounded-full ${results.is_unseated ? 'bg-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-emerald-500/20 text-emerald-500'}`}>
                           {results.is_unseated ? <ShieldAlert className="w-12 h-12 animate-bounce" /> : <ShieldCheck className="w-12 h-12" />}
                        </div>
                        <div>
                           <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic mb-2 block">Critical Safety State</span>
                           <h3 className={`text-2xl font-black tracking-tight leading-tight uppercase ${results.is_unseated ? 'text-red-400' : 'text-emerald-400'}`}>
                              {results.is_unseated ? '❌ 梁体已完全脱空！结构垮塌' : '✅ 支承长度冗余，结构安全'}
                           </h3>
                        </div>
                        <div className="pt-6 border-t border-white/5 w-full">
                            <p className="text-[9px] font-mono leading-relaxed opacity-60 italic tracking-tighter">
                               {results.is_unseated 
                                 ? 'SEVERE_ERROR: Support length N_actual < N_limit. Triggering immediate structural failure protocols.' 
                                 : 'STATUS_STABLE: Minimum support requirements satisfied. Maintaining operative baseline.'}
                            </p>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Dynamic SVG Visualization Container */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-10 shadow-3xl flex flex-col items-center justify-center relative overflow-hidden min-h-[360px]">
                   <div className="absolute top-8 left-10 flex items-center space-x-3">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">物理场景动力学演变 Matrix Viewer</span>
                   </div>

                   <svg width="600" height="240" viewBox="0 0 600 240" className="relative z-10 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <defs>
                        <linearGradient id="pierGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                        <filter id="glow-red">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      
                      {/* Water/Background Ground */}
                      <rect x="0" y="200" width="600" height="40" fill="#020617" />
                      <line x1="0" y1="200" x2="600" y2="200" stroke="#1e293b" strokeWidth="2" strokeDasharray="6 3" />
                      
                      {/* Left Pier (Fixed Reference) */}
                      <g opacity={results.is_unseated ? 0.3 : 1}>
                        <rect x="80" y="100" width="80" height="100" fill="url(#pierGrad)" stroke="#334155" strokeWidth="2" />
                        <rect x="60" y="90" width="120" height="15" fill="#334155" rx="2" />
                      </g>
                      
                      {/* Right Pier (The one moving relatively or affected) */}
                      <g>
                        <rect x="420" y="100" width="80" height="100" fill="url(#pierGrad)" stroke="#334155" strokeWidth="2" />
                        <rect x="400" y="90" width="120" height="15" fill="#334155" rx="2" />
                        {/* Scale Rulers on Pier Top */}
                        <line x1="400" y1="90" x2="520" y2="90" stroke="#475569" strokeWidth="1" strokeDasharray="2 1" />
                      </g>

                      {/* Main Girder */}
                      <g style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                         transform={`translate(${params.pier_disp_cm * 2}, ${results.is_unseated ? 80 : 0}) rotate(${results.is_unseated ? 18 : 0}, 300, 70)`}>
                        <rect x="110" y="60" width="380" height="25" fill="#1e1b4b" stroke="#3730a3" strokeWidth="2" rx="4" className="shadow-lg" />
                        <text x="300" y="77" textAnchor="middle" fill="#4f46e5" fontSize="9" fontWeight="900" letterSpacing="2" className="uppercase opacity-60">BRIDGE_GIRDER_STRUCTURE</text>
                        
                        {/* Highlight on end of girder */}
                        <rect x="470" y="60" width="20" height="25" fill={results.is_unseated ? '#ef4444' : '#2563eb'} fillOpacity={results.is_unseated ? 0.4 : 0.1} />
                      </g>
                      
                      {/* Marker lines & Safety Limits */}
                      <g opacity="0.4">
                         <line x1={180 - results.N_req} y1="40" x2={180 - results.N_req} y2="180" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 2" />
                         <text x={180 - results.N_req} y="30" textAnchor="middle" fill="#f43f5e" fontSize="7" fontWeight="black" className="uppercase">Min_Limit_N_req</text>
                         
                         <line x1="180" y1="40" x2="180" y2="180" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
                         <text x="180" y="30" textAnchor="middle" fill="#3b82f6" fontSize="7" fontWeight="black" className="uppercase">Support_Boundary</text>
                      </g>

                      {/* Displacement Arrow */}
                      <path d={`M 300 130 L ${300 + params.pier_disp_cm * 2} 130`} stroke="#f97316" strokeWidth="2" strokeDasharray="4 2" className="animate-pulse" />
                      <circle cx={300 + params.pier_disp_cm * 2} cy="130" r="3" fill="#f97316" />
                      <text x="310" y="120" fill="#f97316" fontSize="8" fontWeight="black" className="uppercase italic">ACTUAL_SHIFT: {params.pier_disp_cm}cm</text>
                   </svg>
                   
                   <div className="absolute bottom-10 flex space-x-12 px-10 w-full justify-between items-center bg-slate-900/40 py-4 border-t border-slate-800/50 border-dashed">
                      <div className="flex items-center space-x-3">
                         <div className="w-2 h-2 bg-blue-500 rounded-full" />
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Lateral Pier Displacement (Δ)</p>
                      </div>
                      <div className="flex items-center space-x-6 font-mono text-[10px]">
                         <div className="text-slate-400">STATUS: <span className={results.is_unseated ? 'text-red-500' : 'text-emerald-400'}>{results.is_unseated ? 'CRITICAL_FAIL' : 'NOMINAL_OPERATIVE'}</span></div>
                         <div className="text-slate-400">FS: <span className="text-slate-100 italic">{(results.remaining_support / results.N_req).toFixed(2)}</span></div>
                      </div>
                   </div>
                </div>

                {/* Expert Instructions */}
                <div className={`p-8 rounded-[2rem] border relative overflow-hidden ${results.is_unseated ? 'bg-red-500/5 border-red-500/20' : 'bg-blue-500/5 border-blue-500/20'}`}>
                   <div className="absolute top-0 right-0 p-6 opacity-5">
                      <Info className="w-16 h-16 text-white" />
                   </div>
                   <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 flex items-center ${results.is_unseated ? 'text-red-400' : 'text-blue-400'}`}>
                     <Info className="w-4 h-4 mr-2" /> 专家级决策指令矩阵 (Instruction Matrix)
                   </h4>
                   <p className="text-xs leading-relaxed text-slate-400 font-medium">
                     {results.is_unseated 
                       ? '由于支承长度小于规范下限且主梁已发生倾覆轨迹，必须立即启动一级橙色预警。禁止一切车辆进入受灾跨域，并部署重型千斤顶与横向约束锚具进行主梁整体纠编复位，防落梁钢拉索需进行全量张拉检查。' 
                       : '当前计算显示搭接冗余度处于亚健康状态。虽无即时静力落梁风险，但考虑到地震力或温缩引起的累积变位，建议于支座周边增设粘滞阻尼器（VD）或减隔震垫，并安装高精度激光位移传感器进行 7x24h 自动化健康监测。'}
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

export default BridgeGirderAnalysis;
