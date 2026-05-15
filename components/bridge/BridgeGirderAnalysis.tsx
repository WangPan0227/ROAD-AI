import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Activity, Settings, Info, Gauge, Zap, Rocket, AlertTriangle } from 'lucide-react';
import { calculate_girder_unseating } from '../../lib/bridgeCalculations';

const BridgeGirderAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_bridge_girder_load') : null;
    if (pendingLoad) {
      try {
        return JSON.parse(pendingLoad);
      } catch (e) {
        console.error("Failed to parse bridge girder load", e);
      }
    }
    return {
      span_length: 30, // m
      support_length: 80, // cm
      pier_disp_cm: 20 // cm
    };
  });
  const [results, setResults] = useState<any>(() => {
    const res = calculate_girder_unseating(params);
    if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_bridge_girder_load')) {
       localStorage.removeItem('roadbedguard_pending_bridge_girder_load');
    }
    return res;
  });

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    const res = calculate_girder_unseating(params);
    setResults(res);
    setIsCalculating(false);
  };

  useEffect(() => {
    // Component initialized
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧参数区 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden relative shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-blue-600" /> 几何边界参数
            </span>
          </div>
          
          <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest flex items-center">
                结构几何模型
              </h4>
              <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase mb-1 font-bold">主梁跨径 L (m)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-sm font-medium text-gray-900 focus:border-blue-500 outline-none" value={params.span_length} onChange={e => updateParam('span_length', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase mb-1 font-bold">设计搭接长度 a0 (cm)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-sm font-medium text-gray-900 focus:border-blue-500 outline-none" value={params.support_length} onChange={e => updateParam('support_length', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest flex items-center">
                实测变位数据
              </h4>
              <div className="bg-blue-50/30 p-4 rounded-sm border border-blue-100 space-y-4">
                <div className="relative">
                  <label className="block text-[10px] text-blue-700 uppercase font-bold mb-2">相对位移检测 Δ (cm)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-white border border-blue-200 rounded-sm p-3 text-lg font-bold text-blue-700 focus:border-blue-500 outline-none pr-12" 
                      value={params.pier_disp_cm} 
                      onChange={e => updateParam('pier_disp_cm', parseFloat(e.target.value))} 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-300">CM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={runAnalysis}
              disabled={isCalculating}
              className={`w-full py-3 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm ${isCalculating ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>CALCULATING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-3" />
                  <span>落梁仿真计算</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          {/* Header */}
          <div className="h-14 border-b border-gray-200 px-8 flex items-center justify-between bg-white relative z-20 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-sm border border-blue-100">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 tracking-tight uppercase">梁体垮塌/落梁仿真视窗</h2>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ENGINE: UNSEAT_CORE_V2 // JTG D62</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar relative">
            {!results ? null : (
              <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Result Grid */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">规范最小搭接长度 (N)</div>
                    <div className="flex items-baseline space-x-2">
                       <div className="text-3xl font-bold text-gray-900 font-mono">{(results?.N_req ?? 0).toFixed(1)}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase">CM</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">剩余支承余量 (S)</div>
                    <div className="flex items-baseline space-x-2">
                       <div className={`text-3xl font-bold font-mono ${(results?.remaining_support ?? 0) < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {(results?.remaining_support ?? 0).toFixed(1)}
                       </div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase">CM</div>
                    </div>
                  </div>

                  <div className={`p-5 rounded-sm border flex flex-col justify-center shadow-sm ${results.is_unseated ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                     <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${results.is_unseated ? 'bg-red-100' : 'bg-emerald-100'}`}>
                           {results.is_unseated ? <ShieldAlert className="w-5 h-5 text-red-600" /> : <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <div>
                           <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">结构安全性评级</div>
                           <h3 className="text-xs font-bold uppercase tracking-tight">
                              {results.is_unseated ? '梁体现存落梁垮塌风险' : '支承安全余量充足'}
                           </h3>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Main Visualization Container */}
                <div className="bg-white rounded-sm border border-gray-200 p-10 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[440px]">
                   <div className="absolute top-6 left-8 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">仿真模型渲染 (High Fidelity)</span>
                   </div>

                   <svg width="600" height="280" viewBox="0 0 600 280" className="relative z-10">
                      <defs>
                        {/* Photorealistic Filters */}
                        <filter id="concreteNoise" x="0" y="0" width="100%" height="100%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
                          <feDiffuseLighting in="noise" lightingColor="#f3f4f6" surfaceScale="2">
                            <feDistantLight elevation="45" azimuth="45" />
                          </feDiffuseLighting>
                        </filter>
                        
                        <pattern id="concreteTexture" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                           <rect width="100" height="100" fill="#f1f5f9" />
                           <circle cx="20" cy="20" r="1" fill="#cbd5e1" />
                           <circle cx="80" cy="40" r="1.5" fill="#e2e8f0" />
                           <circle cx="50" cy="70" r="1" fill="#cbd5e1" />
                        </pattern>

                        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#94a3b8" />
                          <stop offset="50%" stopColor="#cbd5e1" />
                          <stop offset="100%" stopColor="#94a3b8" />
                        </linearGradient>

                        <filter id="shadowHeavy">
                          <feDropShadow dx="0" dy="10" stdDeviation="5" shadowOpacity="0.2" />
                        </filter>
                      </defs>
                      
                      {/* Floor Line */}
                      <line x1="0" y1="240" x2="600" y2="240" stroke="#e2e8f0" strokeWidth="1" />
                      
                      {/* Fixed Pier (Reference) */}
                      <g opacity={results.is_unseated ? 0.4 : 1}>
                        <rect x="80" y="120" width="80" height="120" fill="url(#concreteTexture)" stroke="#94a3b8" strokeWidth="0.5" filter="url(#concreteNoise)" />
                        <rect x="60" y="110" width="120" height="12" fill="url(#metalGrad)" stroke="#64748b" strokeWidth="1" rx="1" />
                      </g>
                      
                      {/* Target Pier (Moving) */}
                      <g>
                        <rect x="420" y="120" width="80" height="120" fill="url(#concreteTexture)" stroke="#94a3b8" strokeWidth="0.5" filter="url(#concreteNoise)" />
                        <rect x="400" y="110" width="120" height="12" fill="url(#metalGrad)" stroke="#64748b" strokeWidth="1" rx="1" />
                        {/* Displacement Indicator */}
                        <line x1="460" y1="245" x2={460 + params.pier_disp_cm * 2} y2="245" stroke="#3b82f6" strokeWidth="1" markerEnd="url(#arrow-blue)" />
                      </g>

                      {/* Bridge Girder - Realistic Render */}
                      <g style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                         transform={`translate(${params.pier_disp_cm * 2}, ${results.is_unseated ? 80 : 0}) rotate(${results.is_unseated ? 15 : 0}, 300, 80)`}
                         filter="url(#shadowHeavy)">
                        <rect x="100" y="70" width="400" height="30" fill="url(#concreteTexture)" stroke="#64748b" strokeWidth="1" rx="1" filter="url(#concreteNoise)" />
                        {/* Detail lines on girder */}
                        <line x1="100" y1="85" x2="500" y2="85" stroke="#cbd5e1" strokeWidth="0.5" strokeOpacity="0.5" />
                        <text x="300" y="88" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold" className="uppercase tracking-[0.3em] opacity-30">Prestressed_Reinforced_Girder</text>
                      </g>
                      
                      {/* Technical Dimension Lines */}
                      <g opacity="0.5" fontSize="8" fontWeight="bold" fill="#64748b">
                         <line x1={180 - results.N_req} y1="30" x2={180 - results.N_req} y2="220" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 3" />
                         <text x={185 - results.N_req} y="40" fill="#ef4444">Req N_{results.N_req.toFixed(1)}</text>
                         
                         <line x1="180" y1="30" x2="180" y2="220" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="3 3" />
                         <text x="185" y="55" fill="#3b82f6">Baseline</text>
                      </g>

                      {/* Marker Defs */}
                      <defs>
                        <marker id="arrow-blue" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                        </marker>
                      </defs>
                   </svg>
                   
                   <div className="mt-8 flex justify-between items-center bg-gray-50 px-8 py-4 rounded-sm border border-gray-200 w-full max-w-2xl text-[10px] font-bold text-gray-500 uppercase">
                      <div className="flex items-center space-x-3">
                         <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm" />
                         <span>桥墩相对变位监测 Δ</span>
                      </div>
                      <div className="flex items-center space-x-8 font-mono">
                         <div>风险比率: <span className={(results?.risk_ratio ?? 0) >= 0.8 ? 'text-red-600' : 'text-blue-700'}>{((results?.risk_ratio ?? 0) * 100).toFixed(2)}%</span></div>
                         <div className="w-[1px] h-4 bg-gray-300" />
                         <div>稳定余量: <span className="text-gray-900">{results?.is_unseated ? '0.00' : (results?.remaining_support ?? 0).toFixed(2)}cm</span></div>
                      </div>
                   </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm relative overflow-hidden group">
                   <div className="flex items-start space-x-4">
                     <div className="p-3 bg-blue-50 rounded-sm border border-blue-100 mt-1">
                        <Zap className="w-5 h-5 text-blue-600" />
                     </div>
                     <div className="flex-1">
                       <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                         AI 加固决策建议 (Decision Assistance)
                       </h4>
                       <p className="text-sm leading-relaxed text-gray-700 font-medium tracking-tight">
                         {results.is_unseated 
                           ? '🚨 危险通告：结构已触发落梁阈值。仿真显示主梁重心已偏离支撑中心。当前建议：1. 立即实施交通导流及封闭；2. 部署紧急钢结构冗余支撑（I型紧急支架）；3. 开展桥梁顶升复位后的支座更换与限位件补强。' 
                           : '⚖️ 运行评估：当前支承宽度满足规范最小要求。由于相对位移 Δ 仍在可控区间，建议维持日常巡检强度，并安装桥梁健康监测（SHM）倾角传感器，重点关注环境温差及重载通行下的累织位移发展。'}
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

export default BridgeGirderAnalysis;
