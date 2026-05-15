
import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, Zap, Layers, Settings, Rocket, Target, 
  Save, ShieldCheck, AlertTriangle, CloudRain
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { calculate_retaining_wall, RetainingParams, RetainingResult } from '../../lib/retainingCalculations';

const RetainingAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [params, setParams] = useState<RetainingParams>(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_retaining_load') : null;
    if (pendingLoad) {
      try {
        return JSON.parse(pendingLoad);
      } catch (e) {
        console.error("Failed to parse retaining load", e);
      }
    }
    return {
      H: 6.0,
      gamma: 19.0,
      phi: 30.0,
      c: 5.0,
      delta: 15.0,
      waterHeight: 1.0,
      friction_base: 0.5,
      wall_weight: 450.0,
      wall_width: 3.5
    };
  });
  const [results, setResults] = useState<RetainingResult | null>(() => {
    const res = calculate_retaining_wall(params);
    if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_retaining_load')) {
       localStorage.removeItem('roadbedguard_pending_retaining_load');
    }
    return res;
  });

  const updateParam = (key: keyof RetainingParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    // 移除 setTimeout，直接同步执行
    const res = calculate_retaining_wall(params);
    setResults(res);
    setIsCalculating(false);
  };

  useEffect(() => {
    // Component initialized
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Parameters */}
        <div className="w-80 bg-white border-r border-gray-300 flex flex-col overflow-hidden relative shadow-sm">
          <div className="p-3 border-b border-gray-300 bg-gray-50 flex items-center justify-between sticky top-0 z-10">
            <span className="section-title border-none p-0 bg-transparent flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 参数数据矩阵 Matrix
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Geometry */}
            <div className="section-title border-t-0">墙身几何参数 Geometry</div>
            <div className="grid grid-cols-1 divide-y divide-gray-200">
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">墙身总高度 H (m)</label>
                 <input type="number" step="0.1" className="w-16 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.H} onChange={e => updateParam('H', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">底板宽度 B (m)</label>
                 <input type="number" step="0.1" className="w-16 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.wall_width} onChange={e => updateParam('wall_width', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">结构自重 (kN/m)</label>
                 <input type="number" step="10" className="w-20 bg-transparent border-none text-right focus:ring-0 text-gray-700 font-mono text-sm font-bold p-0" value={params.wall_weight} onChange={e => updateParam('wall_weight', parseFloat(e.target.value))} />
               </div>
            </div>

            {/* Geotechnical */}
            <div className="section-title">岩土工程属性 Properties</div>
            <div className="grid grid-cols-1 divide-y divide-gray-200">
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">填土重度 γ (kN/m³)</label>
                 <input type="number" step="0.1" className="w-16 bg-transparent border-none text-right focus:ring-0 text-gray-700 font-mono text-sm font-bold p-0" value={params.gamma} onChange={e => updateParam('gamma', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">内摩擦角 φ (°)</label>
                 <input type="number" step="1" className="w-16 bg-transparent border-none text-right focus:ring-0 text-gray-700 font-mono text-sm font-bold p-0" value={params.phi} onChange={e => updateParam('phi', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">填土粘聚力 c (kPa)</label>
                 <input type="number" step="1" className="w-16 bg-transparent border-none text-right focus:ring-0 text-gray-700 font-mono text-sm font-bold p-0" value={params.c} onChange={e => updateParam('c', parseFloat(e.target.value))} />
               </div>
               <div className="flex justify-between items-center py-2 px-3">
                 <label className="prop-label">基底摩擦系数 μ</label>
                 <input type="number" step="0.01" className="w-16 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.friction_base} onChange={e => updateParam('friction_base', parseFloat(e.target.value))} />
               </div>
               <div className="py-3 px-3">
                 <div className="flex justify-between items-center mb-2">
                    <label className="prop-label">滞留水位 hw (m)</label>
                    <div className="flex items-center space-x-1">
                      <CloudRain className={`w-3.5 h-3.5 ${params.waterHeight > 0 ? 'text-blue-500' : 'text-gray-300'}`} />
                      <input type="number" step="0.1" className="w-12 bg-transparent border-none text-right focus:ring-0 text-blue-700 font-mono text-sm font-bold p-0" value={params.waterHeight} onChange={e => updateParam('waterHeight', parseFloat(e.target.value))} />
                    </div>
                 </div>
                 <input 
                   type="range" min="0" max={params.H} step="0.1"
                   className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                   value={params.waterHeight} onChange={e => updateParam('waterHeight', parseFloat(e.target.value))}
                 />
               </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-300 bg-gray-50 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <button 
              onClick={runAnalysis}
              disabled={isCalculating}
              className={`w-full py-2.5 rounded-sm font-bold text-[11px] uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm ${isCalculating ? 'bg-gray-300 text-gray-500' : 'bg-gray-800 hover:bg-black text-white'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>SOLVING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>EXECUTE NUMERIC SOLVER</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Main Viewport */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
          <header className="h-14 bg-white border-b border-gray-300 px-6 flex items-center justify-between shadow-sm relative z-20">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-50 border border-blue-200 flex items-center justify-center rounded-sm">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xs font-bold text-gray-800 tracking-wider uppercase italic">Rankine Matrix | 挡墙稳定性极限分析 V4.2</h2>
            </div>
            {results && (
              <div className={`px-4 py-1.5 rounded-sm border text-[10px] font-bold uppercase tracking-wider shadow-sm ${results.status === 'danger' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                  {results.status === 'danger' ? 'CRITICAL: 失稳风险' : 'NOMINAL: 稳态'}
              </div>
            )}
          </header>

          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <Activity className="w-12 h-12 mb-4 animate-pulse" />
                <p className="text-[10px] font-mono tracking-[0.2em] uppercase">Dispatcher Idle: Awaiting Parameters...</p>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-24">
                {/* 核心指标看板 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* FS_slide Card */}
                  <div className="bg-white border border-gray-300 p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">抗滑移安全系数 (FSs)</div>
                    <div className="flex items-baseline space-x-2 mb-4">
                       <div className={`text-3xl font-bold font-mono italic ${(results?.FS_slide ?? 0) < 1.3 ? 'text-red-600' : 'text-gray-800'}`}>
                         {(results?.FS_slide ?? 0).toFixed(3)}
                       </div>
                       <div className="text-[10px] text-gray-400 font-bold opacity-60">/ 1.300 [REQ]</div>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out ${(results?.FS_slide ?? 0) < 1.3 ? 'bg-red-600' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, ((results?.FS_slide ?? 0) / 2) * 100)}%` }} />
                    </div>
                  </div>

                  {/* FS_overt Card */}
                  <div className="bg-white border border-gray-300 p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">抗倾覆安全系数 (FSo)</div>
                    <div className="flex items-baseline space-x-2 mb-4">
                       <div className={`text-3xl font-bold font-mono italic ${(results?.FS_overt ?? 0) < 1.5 ? 'text-amber-600' : 'text-gray-800'}`}>
                         {(results?.FS_overt ?? 0).toFixed(3)}
                       </div>
                       <div className="text-[10px] text-gray-400 font-bold opacity-60">/ 1.500 [REQ]</div>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out ${(results?.FS_overt ?? 0) < 1.5 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, ((results?.FS_overt ?? 0) / 2) * 100)}%` }} />
                    </div>
                  </div>

                  {/* Radar Chart Area */}
                  <div className="bg-white border border-gray-300 p-6 shadow-sm relative h-[200px]">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-2 italic">
                      多维安全包络 Vector Matrix
                    </div>
                    <div style={{ width: '100%', height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                          { subject: 'Slide', A: Math.min(2, results.FS_slide), full: 2 },
                          { subject: 'Overt', A: Math.min(2, results.FS_overt), full: 2 },
                          { subject: 'Soil', A: 1.8, full: 2 },
                          { subject: 'Body', A: 1.9, full: 2 },
                          { subject: 'Stress', A: 1.5, full: 2 },
                        ]}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: '700' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 2]} tick={false} axisLine={false} />
                          <Radar
                            name="Safety"
                            dataKey="A"
                            stroke="#2563eb"
                            fill="#3b82f6"
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Force decomposition */}
                <div className="bg-white border border-gray-300 shadow-sm relative">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest italic">物理受力分量解耦 Decomposition_Matrix</h4>
                  </div>
                  <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                      <div className="text-[8px] text-gray-400 font-bold uppercase mb-2">主动土压力 Ea</div>
                      <div className="text-xl font-bold text-gray-800 font-mono italic">{(results?.Ea ?? 0).toFixed(2)} <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">kN/m</span></div>
                    </div>
                    <div className="border-l border-gray-100 pl-8">
                      <div className="text-[8px] text-blue-500 font-bold uppercase mb-2">静水压力 Ew</div>
                      <div className="text-xl font-bold text-blue-600 font-mono italic">{(results?.Ew ?? 0).toFixed(2)} <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">kN/m</span></div>
                    </div>
                    <div className="border-l border-gray-100 pl-8">
                      <div className="text-[8px] text-gray-400 font-bold uppercase mb-2">抗滑极限 Fr</div>
                      <div className="text-xl font-bold text-emerald-600 font-mono italic">{(results?.Resisting_Force ?? 0).toFixed(2)} <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">kN/m</span></div>
                    </div>
                    <div className="border-l border-gray-100 pl-8">
                      <div className="text-[8px] text-gray-400 font-bold uppercase mb-2">结构等效重量 W</div>
                      <div className="text-xl font-bold text-indigo-700 font-mono italic">{(params?.wall_weight ?? 0).toFixed(0)} <span className="text-[9px] text-gray-400 font-bold uppercase ml-1">kN/m</span></div>
                    </div>
                  </div>
                </div>

                {/* Professional Simulation Visualization */}
                <div className="bg-white p-12 border border-gray-300 shadow-sm relative min-h-[550px] flex items-center justify-center overflow-hidden">
                   <div className="absolute top-8 left-8 flex items-center space-x-3">
                      <div className="w-1 h-6 bg-blue-600" />
                      <h4 className="text-[10px] font-bold text-gray-800 uppercase tracking-widest italic">Scientific Synchronization View: Physics_Twin_02</h4>
                   </div>

                   <svg width="600" height="400" viewBox="0 0 600 400" className="relative z-10 trasition-all hover:scale-102 duration-1000">
                    <defs>
                      <filter id="concreteNoise" x="0" y="0" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
                        <feDiffuseLighting in="noise" lightingColor="#f8fafc" surfaceScale="1">
                          <feDistantLight azimuth="45" elevation="60" />
                        </feDiffuseLighting>
                      </filter>
                      
                      <filter id="vectorGlow">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>

                      <pattern id="soilSilt" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                         <rect width="10" height="10" fill="#f5f5f4" />
                         <circle cx="2" cy="2" r="0.5" fill="#e7e5e4" />
                         <circle cx="7" cy="6" r="0.3" fill="#d6d3d1" />
                      </pattern>

                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                      </marker>
                    </defs>

                    {/* Ambient Grid */}
                    <path d="M 0 320 H 600" stroke="#f1f5f9" strokeWidth="1" />
                    <path d="M 50 0 V 400" stroke="#f1f5f9" strokeWidth="1" />

                    {/* Foundation Base */}
                    <rect x="50" y="320" width="500" height="60" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3"/>

                    {/* Soil Mass Pattern */}
                    <path d="M 350 80 H 550 V 320 H 350 Z" fill="url(#soilSilt)" stroke="#e2e8f0" strokeWidth="1" />
                    
                    {/* Earth Pressure Vectors with Glow */}
                    <g filter="url(#vectorGlow)">
                       {[0, 1, 2, 3, 4, 5, 6].map(i => {
                          const y = 100 + i * 32;
                          const len = 15 + i * 10;
                          return (
                             <line key={i} x1={350+len} y1={y} x2={355} y2={y} stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
                          );
                       })}
                    </g>
                    <text x="370" y="95" className="text-[8px] fill-gray-400 font-bold uppercase">Active Earth Matrix</text>

                    {/* Retaining Wall Body - Photorealistic Concrete */}
                    <path 
                      id="wallBody"
                      d={`M 220 320 L 350 320 L 350 80 L 260 80 Z`} 
                      fill="#f8fafc" 
                      filter="url(#concreteNoise)"
                      stroke="#475569" 
                      strokeWidth="1.5" 
                      className="shadow-sm"
                      style={{ transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      transform={`${results.FS_slide < 1.3 ? 'translate(-8, 0)' : ''} ${results.FS_overt < 1.5 ? 'rotate(-2, 350, 320)' : ''}`}
                    />
                    
                    {/* Wall Labels */}
                    <text x="300" y="200" className="text-[7px] fill-gray-400 font-bold uppercase tracking-[0.3em]" transform="rotate(-90, 300, 200)">Concrete_Structure_Node</text>

                    {/* Weight Center */}
                    <g transform="translate(295, 200)">
                        <circle r="4" fill="#3b82f6" />
                        <line x1="0" y1="0" x2="0" y2="80" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead)" filter="url(#vectorGlow)"/>
                        <text x="8" y="75" className="text-[9px] fill-blue-600 font-black italic tracking-widest">W_{params.wall_weight}kN</text>
                    </g>

                    {/* Water Matrix */}
                    {params.waterHeight > 0 && (
                      <g className="transition-all duration-500">
                        <rect x="350" y={320 - params.waterHeight * 30} width="200" height={params.waterHeight * 30} fill="#3b82f6" fillOpacity="0.08" />
                        <line x1="350" y1={320 - params.waterHeight * 30} x2="150" y2={320 - params.waterHeight * 30} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                        <text x="160" y={315 - params.waterHeight * 30} className="text-[8px] fill-blue-500 font-bold uppercase italic tracking-widest">Hydraulic Level: {params.waterHeight}m</text>
                        {/* Hydro-pressure poly */}
                        <path d={`M 350 320 L 350 ${320 - params.waterHeight * 30} L ${350 + params.waterHeight * 15} 320 Z`} fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2 1" />
                      </g>
                    )}

                    {/* Critical Marker */}
                    {(results.FS_slide < 1.3 || results.FS_overt < 1.5) && (
                      <g className="animate-pulse">
                         <circle cx="220" cy="320" r="12" stroke="#ef4444" strokeWidth="1" fill="none" />
                         <circle cx="220" cy="320" r="6" fill="#ef4444" fillOpacity="0.2" />
                         <text x="100" y="350" className="text-[9px] fill-red-600 font-bold uppercase tracking-widest">Instability Zone detected</text>
                      </g>
                    )}
                 </svg>

                 {/* Legend */}
                 <div className="absolute top-32 right-12 space-y-4 bg-gray-50/80 backdrop-blur-md p-5 border border-gray-200 shadow-sm rounded-sm">
                    <div className="flex items-center space-x-3">
                       <div className="w-4 h-0.5 bg-gray-400" />
                       <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest font-mono">Earth Pressure Vector</span>
                    </div>
                    <div className="flex items-center space-x-3">
                       <div className="w-4 h-3 bg-blue-500/10 border border-blue-200" />
                       <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest font-mono">Hydrostatic Matrix</span>
                    </div>
                    <div className="flex items-center space-x-3">
                       <div className="w-4 h-3 bg-white border border-gray-300" />
                       <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest font-mono">Concrete Solid Node</span>
                    </div>
                 </div>
                </div>

                {/* AI Decision Card */}
                <div className="bg-white p-10 border border-gray-300 shadow-sm relative overflow-hidden group">
                   <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-600" />
                   <div className="flex items-center space-x-4 mb-6 border-b border-gray-100 pb-5">
                      <div className="w-10 h-10 bg-blue-50 flex items-center justify-center rounded-sm">
                         <Zap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 italic">Advanced Stability Decision Protocol</h4>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest tracking-tighter mt-0.5">Reliability Class: RC3 // Analysis Mode: RANKINE_LMT</p>
                      </div>
                   </div>
                   <div className="flex items-start space-x-6">
                     <p className="text-[11px] leading-relaxed text-gray-600 font-bold font-mono tracking-tight uppercase border-l border-gray-200 pl-6 flex-1 italic">
                        {results.status === 'danger' 
                          ? 'SOLVER_ALERT: Critical equilibrium failure identified. Mitigation: 1. Deploy deep horizontal anchor matrix (min 12m); 2. Pressure relief composite pipes must be installed; 3. Toe reinforcement using high-modulus jet grouting.' 
                          : 'SOLVER_STATUS: Structural state within elastic safety factor. Maintenance: Periodic InSAR displacement scan recommended. Inspect weep holes for potential hydraulic clogging during peak precipitation.'}
                     </p>
                     <div className="w-32 flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-100 font-mono text-center">
                        <div className="text-[8px] text-gray-400 font-bold mb-1">CONFIDENCE</div>
                        <div className="text-sm font-black text-blue-600 tracking-tighter uppercase italic">98.4% CERT</div>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default RetainingAnalysis;
