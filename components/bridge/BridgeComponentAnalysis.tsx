import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Info, Settings, Database, Gauge, Zap, Rocket, ChevronRight, AlertTriangle, TrendingDown } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { calculate_bridge_component_damage } from '../../lib/bridgeCalculations';

const BridgeComponentAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState({
    corrosion_depth: 5, // mm
    corrosion_area_ratio: 0.2, // 20%
    base_Vn: 850 // kN
  });
  const [results, setResults] = useState<any>(null);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_bridge_component_damage(params);
      setResults(res);
      setIsCalculating(false);
    }, 600);
  };

  useEffect(() => { runAnalysis(); }, []);

  const chartData = results ? [
    { subject: '名义强度', original: 100, current: 100 * results.damage_factor },
    { subject: '截面有效性', original: 100, current: 100 * (1 - params.corrosion_area_ratio / 2) },
    { subject: '配筋保有量', original: 100, current: 100 * (1 - params.corrosion_depth / 20) },
    { subject: '延性储备', original: 100, current: 100 * results.damage_factor * 0.9 },
    { subject: '抗冲击韧性', original: 100, current: 100 * Math.pow(results.damage_factor, 1.5) },
  ] : [];

  // Trend data for damage factor
  const trendData = Array.from({ length: 11 }, (_, i) => {
    const testParams = { ...params, corrosion_depth: i * 2 };
    const res = calculate_bridge_component_damage(testParams);
    return {
      year: i * 2,
      factor: parseFloat(results?.damage_factor.toFixed(3)) || 1.0,
      simulated: parseFloat(res.damage_factor.toFixed(3))
    };
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />
          
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 关键构件损伤量化配置
            </h3>
            <div className="flex space-x-1">
               <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
               <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse [animation-delay:200ms]" />
            </div>
          </div>
          
          <div className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Parameters */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Database className="w-3.5 h-3.5 mr-2 text-blue-500" /> 病害实测参数矩阵
              </h4>
              <div className="space-y-4">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-orange-500/20 animate-scan pointer-events-none" />
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">主筋锈蚀深度 (mm)</label>
                  <input type="number" className="w-full bg-slate-950 border border-orange-500/30 rounded-lg p-2.5 text-lg font-black font-mono text-orange-500 shadow-inner outline-none focus:border-orange-500 transition-all" value={params.corrosion_depth} onChange={e => updateParam('corrosion_depth', parseFloat(e.target.value))} />
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">截面劣化面积比 %</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-blue-400 outline-none focus:border-blue-500" value={params.corrosion_area_ratio} onChange={e => updateParam('corrosion_area_ratio', parseFloat(e.target.value))} />
                </div>
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] text-slate-500 uppercase mb-2 font-black">设计抗剪承载力 Vn (kN)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-300 outline-none focus:border-blue-500" value={params.base_Vn} onChange={e => updateParam('base_Vn', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md sticky bottom-0 z-10">
            <button 
              onClick={runAnalysis} disabled={isCalculating}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-2xl ${isCalculating ? 'bg-slate-800 text-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>DECAY_SOLVING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>执行损伤性能推演</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between shadow-2xl relative z-20">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/10 animate-scan pointer-events-none" />
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-100 tracking-wider uppercase">InfraGuard | 桥梁结构构件损伤性能劣化分析</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic uppercase border-l border-slate-700 pl-2">Component Degradation Analysis // Fiber Element Model v3.2</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20 custom-scrollbar relative z-10">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            {!results ? null : (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Result Dashboard Top */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                   {/* Main Metrics */}
                   <div className="lg:col-span-8 bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-10 shadow-3xl relative overflow-hidden flex items-center justify-between">
                      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                         <TrendingDown className="w-40 h-40 text-orange-500" />
                      </div>
                      <div className="space-y-6 relative z-10">
                         <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                             <TrendingDown className="w-4 h-4 text-orange-500" /> Damage Evolution Results
                         </div>
                         <div className="flex items-center space-x-8">
                            <div className="text-center md:text-left">
                               <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">劣化折减系数 (DF)</div>
                               <div className="text-7xl font-black font-mono text-orange-500 tracking-tighter text-shadow-glow">
                                  {results.damage_factor.toFixed(3)}
                               </div>
                            </div>
                            <div className="h-20 w-[1px] bg-slate-800 hidden md:block mx-4" />
                            <div className="hidden md:block">
                               <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Design Capacity Base</div>
                               <div className="text-3xl font-mono text-slate-600 line-through tracking-tighter italic mb-1">{params.base_Vn} <span className="text-sm">kN</span></div>
                               <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Calculated Current Vn</div>
                               <div className="text-4xl font-mono text-emerald-400 font-black tracking-tighter italic">{results.current_Vn.toFixed(1)} <span className="text-sm">kN</span></div>
                            </div>
                         </div>
                      </div>
                      
                      <div className="hidden xl:flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-3xl border border-slate-800 shadow-inner">
                         <Gauge className={`w-12 h-12 mb-4 ${results.damage_factor < 0.7 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`} />
                         <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 text-center italic leading-tight">Structural<br/>Reserve Index</div>
                         <div className="text-xl font-mono font-black text-slate-300">{(results.damage_factor * 10).toFixed(1)}/10</div>
                      </div>
                   </div>

                   {/* Radar Summary */}
                   <div className="lg:col-span-4 bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 shadow-3xl flex flex-col justify-center min-h-[300px]">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 text-center">多维损伤图谱 (Damage Profile)</h4>
                      <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                               <defs>
                                  <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                                     <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                                     <stop offset="100%" stopColor="#10b981" stopOpacity={0.2}/>
                                  </radialGradient>
                               </defs>
                               <PolarGrid stroke="#1e293b" />
                               <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b', fontWeight: '900' }} />
                               <Radar name="Status Quo" dataKey="current" stroke="#10b981" fill="url(#radarGrad)" fillOpacity={0.6} />
                               <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }} />
                            </RadarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                {/* Secondary Content: SVG Scene & Trend Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   {/* SVG Visualization - Cross Section */}
                   <div className="lg:col-span-5 bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-10 shadow-3xl relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                      <div className="absolute top-8 left-10 flex items-center space-x-3">
                         <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">构件截面锈蚀劣化仿真 (Corrosion Sim)</span>
                      </div>
                      
                      <svg width="240" height="240" viewBox="0 0 240 240" className="relative z-10 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                         {/* Beams Section */}
                         <rect x="20" y="20" width="200" height="200" fill="#1e293b" stroke="#334155" strokeWidth="4" rx="10" />
                         
                         {/* Concrete Degradation Texture (Optional Overlay) */}
                         <rect x="20" y="20" width="200" height="200" fill="url(#concretePore)" fillOpacity={params.corrosion_area_ratio * 0.5} rx="10" />
                         
                         {/* Reinforcements (Rebars) */}
                         {[
                            { x: 50, y: 50 }, { x: 120, y: 50 }, { x: 190, y: 50 },
                            { x: 50, y: 120 }, { x: 190, y: 120 },
                            { x: 50, y: 190 }, { x: 120, y: 190 }, { x: 190, y: 190 }
                         ].map((pos, i) => (
                            <circle 
                               key={i} 
                               cx={pos.x} cy={pos.y} 
                               r={6 + params.corrosion_depth/2} 
                               fill={params.corrosion_depth > 5 ? '#92400e' : '#3b82f6'} 
                               stroke={params.corrosion_depth > 5 ? '#78350f' : '#60a5fa'}
                               strokeWidth="2"
                               className="transition-all duration-700"
                            />
                         ))}

                         {/* Cracks Rendering */}
                         {params.corrosion_depth > 8 && (
                            <g stroke="#78350f" strokeWidth="1" strokeOpacity="0.6" strokeLinecap="round" className="animate-in fade-in duration-1000">
                               <path d="M 210 100 L 230 110 M 215 120 L 235 115" />
                               <path d="M 30 50 L 10 40 M 25 60 L 5 65" />
                               <path d="M 120 215 L 125 240 M 130 215 L 140 235" />
                            </g>
                         )}
                         
                         <defs>
                            <pattern id="concretePore" width="4" height="4" patternUnits="userSpaceOnUse">
                               <circle cx="1" cy="1" r="0.5" fill="#000" fillOpacity="0.2" />
                            </pattern>
                         </defs>
                      </svg>
                      <div className="absolute bottom-10 flex flex-col items-center italic">
                         <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Reinforcement_Status</div>
                         <div className={`text-xs font-mono font-black ${params.corrosion_depth > 8 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                            {params.corrosion_depth > 8 ? 'CRITICAL_CORROSION' : 'NOMINAL_STRENGTH'}
                         </div>
                      </div>
                   </div>

                   {/* Damage Factor Curve Chart */}
                   <div className="lg:col-span-7 bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 shadow-3xl flex flex-col h-[400px]">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-2 text-blue-500" /> 截面性能劣化趋势矩阵 (Decay Matrix)
                      </h5>
                      <div className="flex-1">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                               <defs>
                                  <linearGradient id="colorFactor" x1="0" y1="0" x2="0" y2="100%">
                                     <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                               <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
                               <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} domain={[0.4, 1.0]} />
                               <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '10px' }} />
                               <Area type="monotone" dataKey="simulated" name="性能折减率 (DF)" stroke="#f97316" fillOpacity={1} fill="url(#colorFactor)" strokeWidth={3} />
                               <Area type="monotone" dataKey="factor" name="当前评估点" stroke="#10b981" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>

                {/* Report Section */}
                <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-10 p-6 opacity-5">
                      <Zap className="w-32 h-32 text-white" />
                   </div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center">
                     <AlertTriangle className="w-4 h-4 mr-2 text-blue-400" /> 结构健康度定量诊断系统 (Structural AI Diagnosis)
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <div className="flex items-start space-x-3 group/item">
                            <div className={`mt-1 p-2 rounded-xl transition-colors ${results.damage_factor < 0.8 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                               <Activity className="w-4 h-4" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-300 uppercase tracking-tight mb-1">承载力衰减分析</p>
                               <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                                 当前构件实测损伤已造成整体剪切刚度下降约 <span className="text-orange-500 font-black">{((1 - results.damage_factor) * 100).toFixed(1)}%</span>。主要失效机理定性为由于主筋有效直径削减触发的粘结锚固性能弱化。
                               </p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4 border-l border-slate-800 pl-8">
                         <div className="flex items-start space-x-3 group/item">
                            <div className="mt-1 p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                               <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-300 uppercase tracking-tight mb-1">AI 养护决策矩阵</p>
                               <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
                                 建议方案：1级响应 —— 采用高渗透型阻锈剂（MCI）封闭微裂缝，同步采用改性环氧树脂进行碳纤维复合材料（CFRP）补强制动劣化趋势，预计可恢复承载力 15.2%。
                               </p>
                            </div>
                         </div>
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
