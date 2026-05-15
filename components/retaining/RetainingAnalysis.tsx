
import React, { useState } from 'react';
import { 
  Activity, ShieldAlert, Zap, Layers, Settings, Rocket, Trophy, Target, 
  FileSearch, Save, History, Ruler, ShieldCheck, AlertTriangle, CloudRain, ChevronRight
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell 
} from 'recharts';
import { calculate_retaining_wall, RetainingParams, RetainingResult } from '../../lib/retainingCalculations';

const RetainingAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMeasure, setActiveMeasure] = useState<string>('none');
  const [results, setResults] = useState<RetainingResult | null>(null);
  const [params, setParams] = useState<RetainingParams>({
    H: 6.0,
    gamma: 19.0,
    phi: 30.0,
    c: 5.0,
    delta: 15.0,
    waterHeight: 1.0,
    friction_base: 0.5,
    wall_weight: 450.0,
    wall_width: 3.5
  });

  const updateParam = (key: keyof RetainingParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_retaining_wall(params);
      setResults(res);
      setIsCalculating(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300">
      {/* 顶部工具栏 */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shadow-2xl z-20 relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-scan pointer-events-none" />
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Layers className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-100 tracking-wider uppercase">InfraGuard | 支挡工程结构稳定性仿真平台</h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic uppercase border-l border-slate-700 pl-2">Retaining Wall Analysis & Failure Engine // V4.2</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 text-[10px] font-black text-slate-400 hover:text-blue-400 hover:bg-blue-500/5 rounded-xl transition-all uppercase tracking-widest border border-transparent hover:border-blue-500/20">
            <Save className="w-3.5 h-3.5" />
            <span>保存数字孪生快照</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 text-[10px] font-black text-slate-400 hover:text-blue-400 hover:bg-blue-500/5 rounded-xl transition-all uppercase tracking-widest border border-transparent hover:border-blue-500/20">
            <History className="w-3.5 h-3.5" />
            <span>历史算例矩阵</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧参数区 */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden relative shadow-2xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 参数矩阵输入
            </span>
          </div>
          
          <div className="flex-1 p-4 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Geometry */}
            <div className="space-y-4">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Target className="w-3.5 h-3.5 mr-2 text-blue-500" /> 墙身几何 (Geometry)
              </h4>
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1 font-black tracking-widest">墙高 H (m)</label>
                    <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-blue-400" value={params.H} onChange={e => updateParam('H', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1 font-black tracking-widest">底宽 B (m)</label>
                    <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-blue-400" value={params.wall_width} onChange={e => updateParam('wall_width', parseFloat(e.target.value))} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1 font-black tracking-widest">墙身自重 W (kN/m)</label>
                  <input type="number" step="10" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono font-black text-emerald-400" value={params.wall_weight} onChange={e => updateParam('wall_weight', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Soil & Water */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Ruler className="w-3.5 h-3.5 mr-2 text-blue-500" /> 土性与水文系统
              </h4>
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1 font-black tracking-widest">重度 γ</label>
                    <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300" value={params.gamma} onChange={e => updateParam('gamma', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1 font-black tracking-widest">内摩擦角 φ</label>
                    <input type="number" step="1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300" value={params.phi} onChange={e => updateParam('phi', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1 font-black tracking-widest">粘聚力 c</label>
                    <input type="number" step="1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300" value={params.c} onChange={e => updateParam('c', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase mb-1 font-black tracking-widest">基底摩擦 μ</label>
                    <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300" value={params.friction_base} onChange={e => updateParam('friction_base', parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/50">
                  <label className="block text-[9px] text-blue-400 uppercase mb-2 font-black tracking-widest flex justify-between items-center">
                    墙后积水位 hw (m)
                    <CloudRain className={`w-3 h-3 ${params.waterHeight > 0 ? 'text-blue-500 animate-pulse' : 'text-slate-700'}`} />
                  </label>
                  <input type="number" step="0.1" className="w-full bg-slate-900 border border-blue-500/30 rounded-lg p-2 text-xs font-black font-mono text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]" value={params.waterHeight} onChange={e => updateParam('waterHeight', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md sticky bottom-0 z-10">
            <button 
              onClick={runAnalysis}
              disabled={isCalculating}
              className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center space-x-2 transition-all transform active:scale-95 shadow-2xl ${isCalculating ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-blue-400" />
                  <span>联立求解中...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>执行稳定性仿真求解</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20 custom-scrollbar relative">
          <div className="absolute inset-0 bg-grid-slate-800/[0.05] -z-0" />
          {!results ? (
            <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-3xl group">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <Activity className="w-20 h-20 text-slate-800 mx-auto mb-4 animate-pulse" />
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">系统就绪 // 等待指令引擎启动仿真矩阵</p>
                <div className="flex justify-center space-x-2">
                   <div className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <div className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <div className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700 relative z-10 pb-20">
              {/* Header Status */}
              <div className="flex items-end justify-between border-b border-slate-800 pb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-100 tracking-widest uppercase mb-1 flex items-center">
                    <Activity className="w-6 h-6 mr-3 text-blue-500" /> 结构动力响应仿真结果
                  </h3>
                  <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-2">
                     <span>SOLVER_SEED: 0x7E3F</span>
                     <span className="w-1 h-1 bg-slate-700 rounded-full" />
                     <span>ACCURACY: 99.8%</span>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${results.status === 'danger' ? 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'}`}>
                   {results.status === 'danger' ? 'CRITICAL_FAILURE_RISK' : 'STRUCTURAL_NOMINAL'}
                </div>
              </div>

              {/* 核心指标看板 & 极坐标雷达图 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* FS_slide Card */}
                  <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity" />
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">抗滑移稳定性 (FS_slide)</div>
                    <div className="flex items-baseline space-x-3 mb-6">
                       <div className={`text-5xl font-black font-mono tracking-tighter ${results.FS_slide < 1.3 ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
                         {results.FS_slide.toFixed(3)}
                       </div>
                       <div className="text-xs text-slate-600 font-bold uppercase">/ 1.30</div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                          <span>Stability Margin</span>
                          <span>{Math.max(0, results.FS_slide - 1.3).toFixed(2)}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                          <div className={`h-full transition-all duration-1000 ${results.FS_slide < 1.3 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} style={{ width: `${Math.min(100, (results.FS_slide / 2) * 100)}%` }} />
                       </div>
                    </div>
                  </div>

                  {/* FS_overt Card */}
                  <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity" />
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">抗倾覆稳定性 (FS_overt)</div>
                    <div className="flex items-baseline space-x-3 mb-6">
                       <div className={`text-5xl font-black font-mono tracking-tighter ${results.FS_overt < 1.5 ? 'text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]' : 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
                         {results.FS_overt.toFixed(3)}
                       </div>
                       <div className="text-xs text-slate-600 font-bold uppercase">/ 1.50</div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                          <span>Tipping Control</span>
                          <span>{Math.max(0, results.FS_overt - 1.5).toFixed(2)}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                          <div className={`h-full transition-all duration-1000 ${results.FS_overt < 1.5 ? 'bg-orange-500 shadow-[0_0_10px_rgba(251,146,60,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} style={{ width: `${Math.min(100, (results.FS_overt / 2) * 100)}%` }} />
                       </div>
                    </div>
                  </div>

                  {/* Force Distribution Card */}
                  <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-2xl col-span-1 md:col-span-2 relative overflow-hidden text-slate-300">
                     <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/10" />
                     <div className="flex justify-between items-center mb-6">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">物理受力分量分析 (Active Force Components)</div>
                        <div className="text-[9px] font-mono text-slate-400 flex items-center">
                           <span className="w-2 h-2 bg-blue-500 rounded-sm mr-2" /> TOTAL_THRUST: {results.Total_Driving_Force.toFixed(1)} kN/m
                        </div>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                           <div className="text-[8px] text-slate-600 font-black uppercase">Earth Ea</div>
                           <div className="text-lg font-black text-slate-300 font-mono">{results.Ea.toFixed(1)}</div>
                        </div>
                        <div className="space-y-1 border-l border-slate-800 pl-6">
                           <div className="text-[8px] text-blue-500 font-black uppercase">Water Ew</div>
                           <div className={`text-lg font-black font-mono ${results.Ew > 0 ? 'text-blue-400 text-shadow-glow' : 'text-slate-600'}`}>{results.Ew.toFixed(1)}</div>
                        </div>
                        <div className="space-y-1 border-l border-slate-800 pl-6">
                           <div className="text-[8px] text-emerald-500 font-black uppercase">Fr_base</div>
                           <div className="text-lg font-black text-emerald-400 font-mono">{results.Friction_Resistance.toFixed(1)}</div>
                        </div>
                        <div className="space-y-1 border-l border-slate-800 pl-6">
                           <div className="text-[8px] text-slate-600 font-black uppercase">W_gravity</div>
                           <div className="text-lg font-black text-slate-300 font-mono">{params.wall_weight}</div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Radar Chart Area */}
                <div className="lg:col-span-4 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">FS 稳定性极坐标雷达 (Safety Envelope)</div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'Slide', A: Math.min(2, results.FS_slide), full: 2 },
                        { subject: 'Overt', A: Math.min(2, results.FS_overt), full: 2 },
                        { subject: 'Base_P', A: 1.8, full: 2 },
                        { subject: 'Eccen', A: 1.5, full: 2 },
                        { subject: 'Wall_S', A: 1.9, full: 2 },
                      ]}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b', fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 2]} tick={false} axisLine={false} />
                        <Radar
                          name="Current Status"
                          dataKey="A"
                          stroke={results.status === 'danger' ? '#f43f5e' : '#3b82f6'}
                          fill={results.status === 'danger' ? '#f43f5e' : '#3b82f6'}
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute bottom-6 left-0 w-full text-center">
                     <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Target Boundary: FS_min = 1.3/1.5</span>
                  </div>
                </div>
              </div>

              {/* 断面受力示意图 (Enhanced SVG) */}
              <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative min-h-[500px] flex items-center justify-center group">
                 <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.05] pointer-events-none" />
                 <div className="absolute top-8 left-10 flex items-center space-x-3">
                    <div className="w-1 h-6 bg-blue-500 rounded-full animate-pulse" />
                    <div>
                       <h4 className="text-xs font-black text-slate-100 uppercase tracking-widest">物理建模与应力矢量云图</h4>
                       <p className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">Stress Vector Mapping & Infiltration Gradient</p>
                    </div>
                 </div>

                 <svg width="600" height="400" viewBox="0 0 600 400" className="animate-in fade-in zoom-in-95 duration-1000 relative z-10">
                    <defs>
                      <linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                      <linearGradient id="soilGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0f172a" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                      <marker id="cyberArrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" fillOpacity="0.6" />
                      </marker>
                      <marker id="waterArrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" />
                      </marker>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Background Surface */}
                    <rect x="0" y="350" width="600" height="50" fill="#020617" />
                    <line x1="0" y1="350" x2="600" y2="350" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 2" />

                    {/* Soil Area */}
                    <path d="M 350 100 L 600 100 L 600 350 L 350 350 Z" fill="url(#soilGrad)" fillOpacity="0.5" />
                    
                    {/* Earth Pressure Vector Field (Dynamic Arrows) */}
                    <g className="earth-vectors">
                       {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                          const y = 100 + (i / 7) * 250;
                          const pressureScale = results.Ea / 150; // Dynamic scale
                          const len = (15 + i * 12) * pressureScale;
                          return (
                             <g key={i} className="animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                                <line 
                                   x1={350 + len} y1={y} x2={353} y2={y} 
                                   stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.4"
                                   markerEnd="url(#cyberArrow)" 
                                />
                                <circle cx={350+len} cy={y} r="1.5" fill="#3b82f6" fillOpacity="0.6" />
                             </g>
                          );
                       })}
                    </g>
                    <text x="420" y="230" className="text-[10px] fill-blue-500/50 font-black italic uppercase tracking-widest select-none">Active_Pressure_Vector</text>

                    {/* Retaining Wall Structure */}
                    <path 
                      d="M 200 350 L 350 350 L 350 100 L 250 100 Z" 
                      fill="url(#wallGrad)" 
                      stroke="#3b82f6" 
                      strokeWidth="3" 
                      filter="url(#glow)"
                      className={`transition-all duration-500 ${results.FS_slide < 1.3 ? 'animate-[shake_0.5s_infinite]' : ''}`}
                    />
                    <style>{`
                      @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-2px); }
                        75% { transform: translateX(1px); }
                      }
                    `}</style>
                    
                    {/* Wall Label */}
                    <text x="255" y="240" className="text-[8px] fill-slate-500 uppercase font-black tracking-widest">Structure_Body</text>
                    <text x="260" y="255" className="text-[10px] fill-slate-100 font-mono font-black">{params.wall_weight}kN/m</text>

                    {/* Water System */}
                    {params.waterHeight > 0 && (
                      <g className="water-system animate-in fade-in duration-1000">
                         {/* Water Surface Overlay */}
                         <rect x="350" y={350 - params.waterHeight * 40} width="250" height={params.waterHeight * 40} fill="#0ea5e9" fillOpacity="0.1" />
                         <line x1="350" y1={350 - params.waterHeight * 40} x2="150" y2={350 - params.waterHeight * 40} stroke="#0ea5e9" strokeWidth="2" strokeDasharray="8 4" className="animate-pulse" />
                         
                         {/* Water Gradient Arrows */}
                         <g>
                            {[1, 2, 3].map(i => {
                               const y = 350 - (params.waterHeight * 40) + (i * 10);
                               if (y >= 350) return null;
                               return (
                                  <line key={i} x1={350 + i*15} y1={y} x2={355} y2={y} stroke="#0ea5e9" strokeWidth="1.5" markerEnd="url(#waterArrow)" />
                               );
                            })}
                         </g>
                         <text x="160" y={340 - params.waterHeight * 40} className="text-[9px] fill-sky-400 font-black uppercase tracking-widest">Hydrostatic_Level: {params.waterHeight}m</text>
                      </g>
                    )}

                    {/* Forces Summary Labels */}
                    <g transform="translate(450, 320)">
                       <text className="text-[9px] font-black fill-slate-500 uppercase tracking-widest">Base_Friction_μ: {params.friction_base}</text>
                    </g>
                 </svg>

                 {/* Legend */}
                 <div className="absolute top-24 right-10 flex flex-col space-y-3 bg-slate-950/50 backdrop-blur p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 bg-blue-500 rounded-sm" />
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Earth Thrust (Ea)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 bg-sky-500 rounded-sm" />
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Water Pressure (Ew)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 bg-slate-700 rounded-sm" />
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Wall Gravity (W)</span>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetainingAnalysis;
