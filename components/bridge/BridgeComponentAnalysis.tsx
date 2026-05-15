import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Info, Settings, Database, Gauge, Zap, Rocket, TrendingDown } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { calculate_bridge_component_damage } from '../../lib/bridgeCalculations';

const BridgeComponentAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_bridge_component_load') : null;
    if (pendingLoad) {
      try {
        return JSON.parse(pendingLoad);
      } catch (e) {
        console.error("Failed to parse component load", e);
      }
    }
    return {
      corrosion_depth: 5, // mm
      corrosion_area_ratio: 0.2, // 20%
      base_Vn: 850 // kN
    };
  });
  const [results, setResults] = useState<any>(() => {
    const res = calculate_bridge_component_damage(params);
    if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_bridge_component_load')) {
       localStorage.removeItem('roadbedguard_pending_bridge_component_load');
    }
    return res;
  });

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    const res = calculate_bridge_component_damage(params);
    setResults(res);
    setIsCalculating(false);
  };

  useEffect(() => {
    // Component initialized
  }, []);

  const chartData = results ? [
    { subject: '名义强度', original: 100, current: 100 * results.damage_factor },
    { subject: '截面有效性', original: 100, current: 100 * (1 - params.corrosion_area_ratio / 2) },
    { subject: '配筋保有量', original: 100, current: 100 * (1 - params.corrosion_depth / 20) },
    { subject: '延性储备', original: 100, current: 100 * results.damage_factor * 0.9 },
    { subject: '抗冲击韧性', original: 100, current: 100 * Math.pow(results.damage_factor, 1.5) },
  ] : [];

  const trendData = Array.from({ length: 11 }, (_, i) => {
    const testParams = { ...params, corrosion_depth: i * 2 };
    const res = calculate_bridge_component_damage(testParams);
    return {
      year: i * 2,
      factor: results ? parseFloat((results?.damage_factor ?? 0).toFixed(3)) : 1.0,
      simulated: parseFloat((res?.damage_factor ?? 0).toFixed(3))
    };
  });

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden relative shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-blue-600" /> 物理劣化参数
            </h3>
          </div>
          
          <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest flex items-center">
                截面损伤因子
              </h4>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                  <label className="block text-[10px] text-gray-500 uppercase mb-2 font-bold">主筋锈蚀深度 (mm)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-sm p-2.5 text-lg font-bold text-blue-700 outline-none focus:border-blue-500" value={params.corrosion_depth} onChange={e => updateParam('corrosion_depth', parseFloat(e.target.value))} />
                </div>
                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                  <label className="block text-[10px] text-gray-500 uppercase mb-1 font-bold">有效面积比 %</label>
                  <input type="number" step="0.01" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-sm font-medium text-gray-800" value={params.corrosion_area_ratio} onChange={e => updateParam('corrosion_area_ratio', parseFloat(e.target.value))} />
                </div>
                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                  <label className="block text-[10px] text-gray-500 uppercase mb-1 font-bold">名义抗剪 Vn (kN)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-sm font-medium text-gray-800" value={params.base_Vn} onChange={e => updateParam('base_Vn', parseFloat(e.target.value))} />
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
                  <span>开始截面劣化仿真</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 relative">
          <div className="h-14 border-b border-gray-200 px-8 flex items-center justify-between bg-white relative z-20 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-sm border border-blue-100">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">关键构件解析/结构健康巡查</h2>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ENGINE: FIBER_ELEMENT_V3.2 // QUANTITATIVE DECAY</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar relative">
            {!results ? null : (
              <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-12 gap-6 items-stretch">
                   <div className="col-span-8 bg-white rounded-sm border border-gray-200 p-8 shadow-sm flex items-center justify-between relative overflow-hidden">
                      <div className="space-y-6 relative z-10 w-full">
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <TrendingDown className="w-4 h-4 text-blue-600" /> 劣化推演核心指标 (Degradation Matrix)
                         </div>
                         <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-12">
                               <div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">劣化折减系数 (DF)</div>
                                  <div className="text-6xl font-bold text-blue-700 tracking-tighter">
                                     {(results?.damage_factor ?? 1).toFixed(3)}
                                  </div>
                               </div>
                               <div className="h-16 w-[1px] bg-gray-100" />
                               <div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 italic">设计基准强度</div>
                                  <div className="text-2xl font-bold text-gray-300 line-through tracking-tight">{params.base_Vn} <span className="text-xs uppercase">kN</span></div>
                                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 mt-2">仿真当前强度</div>
                                  <div className="text-3xl font-bold text-gray-900 tracking-tight font-mono">{(results?.current_Vn ?? 0).toFixed(1)} <span className="text-xs uppercase">kN</span></div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-sm border border-gray-100 shadow-inner min-w-[140px]">
                               <Gauge className={`w-10 h-10 mb-2 ${(results?.damage_factor ?? 1) < 0.7 ? 'text-red-600' : 'text-blue-600'}`} />
                               <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center mb-1">结构健康分指数</div>
                               <div className="text-2xl font-bold text-gray-800">{( (results?.damage_factor ?? 1) * 10).toFixed(2)}</div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="col-span-4 bg-white rounded-sm border border-gray-200 p-6 shadow-sm flex flex-col justify-center">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">损伤维度图谱 (Radar Chart)</h4>
                      <div className="w-full h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                               <PolarGrid stroke="#e2e8f0" />
                               <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} />
                               <Radar name="Status" dataKey="current" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                            </RadarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                   <div className="col-span-5 bg-white rounded-sm border border-gray-200 p-10 shadow-sm flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
                      <div className="absolute top-6 left-8 flex items-center space-x-2">
                         <div className="w-2 h-2 bg-blue-600 rounded-full" />
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">截面纤维模型仿真 (Realistic)</span>
                      </div>
                      
                      <svg width="240" height="240" viewBox="0 0 240 240" className="relative z-10">
                         <defs>
                            <filter id="concreteNoise" x="0" y="0" width="100%" height="100%">
                              <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
                              <feDiffuseLighting in="noise" lightingColor="#f3f4f6" surfaceScale="1.5">
                                <feDistantLight elevation="45" azimuth="45" />
                              </feDiffuseLighting>
                            </filter>
                            
                            <radialGradient id="rebarGrad" cx="50%" cy="50%" r="50%">
                               <stop offset="0%" stopColor="#94a3b8" />
                               <stop offset="100%" stopColor="#475569" />
                            </radialGradient>

                            <radialGradient id="rebarCorroded" cx="50%" cy="50%" r="50%">
                               <stop offset="0%" stopColor="#450a0a" />
                               <stop offset="100%" stopColor="#7f1d1d" />
                            </radialGradient>
                         </defs>
                         
                         {/* Concrete Section */}
                         <rect x="30" y="30" width="180" height="180" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" filter="url(#concreteNoise)" />
                         
                         {/* Scale grid */}
                         <g opacity="0.1" stroke="#64748b" strokeWidth="0.5">
                            <line x1="30" y1="75" x2="210" y2="75" />
                            <line x1="30" y1="120" x2="210" y2="120" />
                            <line x1="30" y1="165" x2="210" y2="165" />
                            <line x1="75" y1="30" x2="75" y2="210" />
                            <line x1="120" y1="30" x2="120" y2="210" />
                            <line x1="165" y1="30" x2="165" y2="210" />
                         </g>

                         {/* Rebars */}
                         {[
                            { x: 60, y: 60 }, { x: 120, y: 60 }, { x: 180, y: 60 },
                            { x: 60, y: 120 }, { x: 180, y: 120 },
                            { x: 60, y: 180 }, { x: 120, y: 180 }, { x: 180, y: 180 }
                         ].map((pos, i) => (
                            <circle 
                               key={i} 
                               cx={pos.x} cy={pos.y} 
                               r={Math.max(2, 8 - params.corrosion_depth/2)} 
                               fill={params.corrosion_depth > 5 ? 'url(#rebarCorroded)' : 'url(#rebarGrad)'} 
                               stroke="#ffffff"
                               strokeWidth="1"
                               className="transition-all duration-1000"
                            />
                         ))}

                         <text x="120" y="232" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" className="uppercase opacity-40">Cross_Sectional_Stress_Map</text>
                      </svg>

                      <div className="mt-8 px-6 py-2 bg-gray-50 border border-gray-100 rounded-sm">
                         <div className={`text-[9px] font-bold uppercase tracking-widest ${params.corrosion_depth > 5 ? 'text-red-700' : 'text-blue-700'}`}>
                            {params.corrosion_depth > 5 ? 'Status: CRITICAL_HAZARD' : 'Status: STRUCTURAL_NOMINAL'}
                         </div>
                      </div>
                   </div>

                   <div className="col-span-7 bg-white rounded-sm border border-gray-200 p-8 shadow-sm flex flex-col min-h-[460px]">
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-2" /> 劣化曲线推演 (Life-Cycle Decay Projection)
                      </h5>
                      <div className="w-full h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                               <defs>
                                  <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                               <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} />
                               <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} domain={[0.4, 1.0]} />
                               <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                               <Area type="monotone" dataKey="simulated" name="折减强度系数" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSim)" strokeWidth={2} />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                {/* AI Recommendation */}
                <div className="bg-white border border-gray-200 rounded-sm p-6 shadow-sm relative overflow-hidden group">
                   <div className="flex items-start space-x-4">
                     <div className="p-3 bg-blue-50 rounded-sm border border-blue-100 mt-1">
                        <Info className="w-5 h-5 text-blue-600" />
                     </div>
                     <div className="flex-1">
                       <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                         核心构件诊断决策建议 (Component Health Consensus)
                       </h4>
                       <p className="text-sm leading-relaxed text-gray-700 font-medium tracking-tight">
                         当前分析显示构件主筋锈蚀已引发显著的物理性能退化。
                         仿真折减系数 DF = <span className="font-bold text-blue-700">{(results?.damage_factor ?? 1).toFixed(3)}</span>。
                         {(results?.damage_factor ?? 1) < 0.75 
                           ? ' 核心结论：截面承载力已低于设计储备 75%，存在脆性失效风险。建议立即执行喷射混凝土加固或外部粘钢板工程。' 
                           : ' 核心结论：构件整体受力性能尚在安全区间。建议加强裂缝自动化监测，并于近 12 个月内执行保护层阻锈剂涂装工程。'}
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

export default BridgeComponentAnalysis;
