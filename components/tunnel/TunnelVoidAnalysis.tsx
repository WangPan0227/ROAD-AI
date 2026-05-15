import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Info, Settings, Target, Layers, ArrowRight, Gauge, Zap, Rocket, ChevronRight, AlertTriangle, ShieldCheck, Database, Scan } from 'lucide-react';
import { calculate_tunnel_void } from '../../lib/tunnelCalculations';

const TunnelVoidAnalysis: React.FC = () => {
  const [params, setParams] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_tunnel_void_load') : null;
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('roadbedguard_pending_tunnel_void_load');
        }
        return loadedParams;
      } catch (e) {
        console.error("历史数据载入失败", e);
      }
    }
    return {
      angle: 60,   // 脱空弧度 (deg)
      depth: 300,  // 空洞深度 (mm)
      radius: 5.5  // 隧道半径 (m)
    };
  });
  const [results, setResults] = useState<any>(() => calculate_tunnel_void(params));
  const [isCalculating, setIsCalculating] = useState(false);

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

  useEffect(() => {}, []);

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden relative shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-blue-600" /> 脱空参数配置
            </h3>
          </div>
          
          <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Parameters */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest flex items-center">
                脱空几何参数
              </h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold">脱空弧度 (deg)</label>
                    <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-100">{params.angle}°</span>
                  </div>
                  <input 
                    type="range" min="10" max="180" 
                    className="w-full bg-gray-200 h-1.5 rounded-sm appearance-none cursor-pointer accent-blue-600" 
                    value={params.angle} 
                    onChange={e => updateParam('angle', parseFloat(e.target.value))} 
                  />
                  <div className="flex justify-between text-[8px] text-gray-400 font-bold mt-1">
                    <span>10°</span>
                    <span>180°</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                  <label className="block text-[10px] text-gray-500 uppercase mb-2 font-bold">空洞深度 (mm)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-lg font-bold font-mono text-blue-700 outline-none focus:border-blue-500" value={params.depth} onChange={e => updateParam('depth', parseFloat(e.target.value))} />
                </div>

                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                  <label className="block text-[10px] text-gray-500 uppercase mb-2 font-bold">隧道半径 R (m)</label>
                  <input type="number" step="0.1" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-sm font-medium text-gray-800" value={params.radius} onChange={e => updateParam('radius', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={runAnalysis} disabled={isCalculating}
              className={`w-full py-3 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm ${isCalculating ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>SIMULATING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-3" />
                  <span>执行受力重分布仿真</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 relative">
          {/* Header */}
          <div className="h-14 border-b border-gray-200 px-8 flex items-center justify-between bg-white relative z-20 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-sm border border-blue-100">
                <Scan className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 tracking-tight uppercase">隧道衬砌壁后脱空与偏心受力分析</h2>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ENGINE: LINING_ECCENTRIC_V4 // STATIC_MODE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar relative">
            {!results ? null : (
              <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Result Cards */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">应力偏心矩增量 ΔE</div>
                    <div className="flex items-baseline space-x-2">
                       <div className="text-3xl font-bold text-gray-900 font-mono">{(results?.e_increment ?? 0).toFixed(3)}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase">M</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">承载力有效系数</div>
                    <div className="flex items-baseline space-x-2">
                       <div className={`text-3xl font-bold font-mono tracking-tighter ${(results?.reduction_factor ?? 1) < 0.8 ? 'text-red-600' : 'text-blue-700'}`}>
                          {((results?.reduction_factor ?? 1) * 100).toFixed(1)}%
                       </div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase">EFF</div>
                    </div>
                  </div>

                  <div className={`p-5 rounded-sm border flex flex-col justify-center shadow-sm ${results.status === 'critical' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                     <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${results.status === 'critical' ? 'bg-red-100' : 'bg-emerald-100'}`}>
                           {results.status === 'critical' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </div>
                        <div>
                           <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">结构稳定性评估</div>
                           <h3 className="text-xs font-bold uppercase tracking-tight leading-none mt-1">
                              {results.status === 'critical' ? '检测到重大安全风险' : '结构状态运行稳定'}
                           </h3>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Tunnel Visualization */}
                <div className="bg-white rounded-sm border border-gray-200 p-10 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[440px]">
                   <div className="absolute top-6 left-10 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">断面受力偏移仿真 (Section View)</span>
                   </div>

                   <svg width="600" height="340" viewBox="0 0 600 340" className="relative z-10 transition-all duration-700">
                      <defs>
                        <filter id="rockNoise" x="0" y="0" width="100%" height="100%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
                          <feDiffuseLighting in="noise" lightingColor="#cbd5e1" surfaceScale="2">
                            <feDistantLight elevation="35" azimuth="45" />
                          </feDiffuseLighting>
                        </filter>
                        
                        <pattern id="concretePattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                           <rect width="100" height="100" fill="#f8fafc" />
                           <circle cx="20" cy="20" r="1.5" fill="#e2e8f0" />
                        </pattern>

                        <radialGradient id="voidEffect" cx="50%" cy="50%" r="50%">
                           <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2}/>
                           <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                        </radialGradient>
                      </defs>
                      
                      {/* Surround Rock */}
                      <rect x="50" y="20" width="500" height="300" fill="#f1f5f9" filter="url(#rockNoise)" opacity="0.3" rx="4" />
                      
                      {/* Void Representation */}
                      <g transform="translate(300, 170)">
                        <path 
                          d={`M 0 0 L ${130 * Math.sin(-params.angle/2 * Math.PI/180)} ${-130 * Math.cos(-params.angle/2 * Math.PI/180)} A 130 130 0 0 1 ${130 * Math.sin(params.angle/2 * Math.PI/180)} ${-130 * Math.cos(params.angle/2 * Math.PI/180)} Z`}
                          fill="url(#voidEffect)" 
                          stroke="#ef4444" 
                          strokeWidth="1" 
                          strokeDasharray="4 2"
                        />
                      </g>
                      
                      {/* Tunnel Lining Cross-Section */}
                      <circle cx="300" cy="170" r="110" fill="none" stroke="url(#concretePattern)" strokeWidth="20" />
                      <circle cx="300" cy="170" r="120" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                      <circle cx="300" cy="170" r="100" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                      
                      {/* Stress Center Axis */}
                      <g transform={`translate(${results.e_increment * 100}, 0)`}>
                          <line x1="300" y1="120" x2="300" y2="220" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5 5" />
                          <circle cx="300" cy="170" r="5" fill="#3b82f6" className="shadow-lg" />
                          <text x="308" y="155" fill="#3b82f6" fontSize="8" fontWeight="bold" className="uppercase font-mono">Stress Axis</text>
                      </g>
                      
                      {/* Geometry Annotation */}
                      <line x1="300" y1="170" x2="410" y2="170" stroke="#94a3b8" strokeWidth="0.5" />
                      <text x="350" y="165" fill="#64748b" fontSize="8" fontWeight="bold" className="uppercase tracking-widest italic">R = {params.radius}m</text>
                   </svg>
                   
                   <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-2xl">
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-sm flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">脱空扩散 Arc</span>
                            <span className="text-xl font-bold font-mono text-gray-900">{params.angle}°</span>
                         </div>
                         <div className="w-1 h-8 bg-blue-500 rounded-full" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-sm flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">主应力偏移 Offset</span>
                            <span className="text-xl font-bold font-mono text-gray-900">{(results?.e_increment ?? 0).toFixed(3)}m</span>
                         </div>
                         <div className="w-1 h-8 bg-blue-500 rounded-full" />
                      </div>
                   </div>
                </div>

                {/* Diagnosis Panel */}
                <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm relative overflow-hidden">
                   <div className="flex items-start space-x-4">
                     <div className="p-3 bg-blue-50 rounded-sm border border-blue-100 mt-1">
                        <AlertTriangle className="w-5 h-5 text-blue-600" />
                     </div>
                     <div className="flex-1">
                       <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                         专家级评估结论 (Structural Diagnostic Consensus)
                       </h4>
                       <p className="text-sm leading-relaxed text-gray-700 font-medium tracking-tight">
                         壁后脱空破坏了衬砌与围岩的协同工作。当前的 <span className="text-blue-700 font-bold">{params.angle}°</span> 脱空区域导致
                         衬砌从受压状态向大偏心受压状态转化。仿真显示其承载力冗余度已折减至 <span className="text-blue-700 font-bold">{((results?.reduction_factor ?? 1) * 100).toFixed(1)}%</span>。
                         {results.status === 'critical' 
                           ? ' 🔴 核心警告：应力偏心量已越出衬砌核心区。建议立即采取：1. 背后注浆充填空洞；2. 受力薄弱区加装锁脚锚杆；3. 预防因受力突变导致的脆性断裂。' 
                           : ' 🟢 现状结论：偏移量尚在可控区间。建议维持现有支护强度，并部署自动化雷达巡检，重点观测脱空范围是否随围岩形变进一步扩展。'}
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
