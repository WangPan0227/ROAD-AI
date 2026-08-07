import React, { useState, useEffect } from 'react';
import { 
  Settings, Rocket, Activity, AlertTriangle, Circle, 
  Layers, TrendingUp, ShieldCheck, Zap
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend, LineChart, Line, ReferenceLine 
} from 'recharts';
import { calculate_tunnel_wall_void, TunnelWallVoidParams } from '../../lib/tunnelCalculations';
import { KPICard } from '../common/KPICard';

const TunnelVoidAnalysis: React.FC = () => {
  const [params, setParams] = useState<TunnelWallVoidParams>(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_tunnel_void_load') : null;
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('roadbedguard_pending_tunnel_void_load');
        }
        return {
          R: loadedParams.R ?? 3.0,
          t: loadedParams.t ?? 0.3,
          E: loadedParams.E ?? 30.0,
          q_v: loadedParams.q_v ?? 200.0,
          q_h: loadedParams.q_h ?? 100.0,
          theta_void: loadedParams.theta_void ?? 90.0,
          void_width: loadedParams.void_width ?? 30.0,
          void_factor: loadedParams.void_factor ?? 0.0
        };
      } catch (e) {
        console.error("历史数据载入失败", e);
      }
    }
    return {
      R: 3.0,
      t: 0.3,
      E: 30.0,
      q_v: 200.0,
      q_h: 100.0,
      theta_void: 90.0,
      void_width: 30.0,
      void_factor: 0.0
    };
  });

  const [results, setResults] = useState(() => calculate_tunnel_wall_void(params));
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'section' | 'rate' | 'sop'>('profile');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const pending = localStorage.getItem('pending_injected_disease_lining_void');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.injectedParameters) {
            const { void_width, void_factor } = parsed.injectedParameters;
            setParams(prev => {
              const next = {
                ...prev,
                void_width: void_width !== undefined ? void_width : prev.void_width,
                void_factor: void_factor !== undefined ? void_factor : prev.void_factor
              };
              setResults(calculate_tunnel_wall_void(next));
              return next;
            });
            localStorage.removeItem('pending_injected_disease_lining_void');
          }
        } catch (e) {
          console.error("Error reading lining void disease", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateParam = (key: keyof TunnelWallVoidParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (type: 'side_full' | 'top_part' | 'full_contact') => {
    let preset: TunnelWallVoidParams;
    if (type === 'side_full') {
      preset = { R: 3.0, t: 0.3, E: 30, q_v: 200, q_h: 100, theta_void: 90, void_width: 30, void_factor: 0.0 };
    } else if (type === 'top_part') {
      preset = { R: 3.0, t: 0.3, E: 30, q_v: 200, q_h: 100, theta_void: 0, void_width: 20, void_factor: 0.3 };
    } else {
      preset = { R: 3.0, t: 0.3, E: 30, q_v: 200, q_h: 100, theta_void: 90, void_width: 30, void_factor: 1.0 };
    }
    setParams(preset);
    setResults(calculate_tunnel_wall_void(preset));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_tunnel_wall_void(params);
      setResults(res);
      setIsCalculating(false);
    }, 400);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* 左侧控制参数面板 */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-900/90">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-sky-400" /> 壁后脱空受力配置
            </h3>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
              曲梁受力引擎
            </span>
          </div>

          <div className="flex-1 pt-4 space-y-5 overflow-y-auto custom-scrollbar pr-1">
            {/* Quick Presets */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                快捷典型工况
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => applyPreset('side_full')}
                  className="px-2 py-1.5 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl transition-all text-center"
                >
                  拱腰完全脱空
                </button>
                <button
                  onClick={() => applyPreset('top_part')}
                  className="px-2 py-1.5 text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl transition-all text-center"
                >
                  拱顶部分脱空
                </button>
                <button
                  onClick={() => applyPreset('full_contact')}
                  className="px-2 py-1.5 text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all text-center"
                >
                  完全密贴接触
                </button>
              </div>
            </div>

            {/* 脱空几何与分布 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center">
                脱空区域定位与范围
              </h4>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">脱空中心角度 θ_void (°)</span>
                  <span className="font-mono font-bold text-sky-400">{params.theta_void}° ({params.theta_void === 0 ? '拱顶' : params.theta_void === 90 ? '右拱腰' : params.theta_void === 180 ? '拱底' : '拱肋'})</span>
                </div>
                <input
                  type="range" min="0" max="360" step="5"
                  className="accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer w-full"
                  value={params.theta_void} onChange={e => updateParam('theta_void', parseFloat(e.target.value))}
                />
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">脱空半宽 α (°)</span>
                  <span className="font-mono font-bold text-sky-400">{params.void_width}° (总角 {params.void_width * 2}°)</span>
                </div>
                <input
                  type="range" min="5" max="90" step="5"
                  className="accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer w-full"
                  value={params.void_width} onChange={e => updateParam('void_width', parseFloat(e.target.value))}
                />
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">压力折减系数 void_factor</span>
                  <span className="font-mono font-bold text-amber-400">{params.void_factor.toFixed(2)} ({params.void_factor === 0 ? '完全脱空' : '部分脱空'})</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  className="accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer w-full"
                  value={params.void_factor} onChange={e => updateParam('void_factor', parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* 衬砌与围岩参数 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center">
                衬砌几何与围岩荷载
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">衬砌半径 R (m)</label>
                  <input
                    type="number" step="0.1"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    value={params.R} onChange={e => updateParam('R', parseFloat(e.target.value))}
                  />
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">衬砌厚度 t (m)</label>
                  <input
                    type="number" step="0.05"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    value={params.t} onChange={e => updateParam('t', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">竖向压力 q_v (kPa)</label>
                  <input
                    type="number" step="10"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    value={params.q_v} onChange={e => updateParam('q_v', parseFloat(e.target.value))}
                  />
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">水平压力 q_h (kPa)</label>
                  <input
                    type="number" step="10"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    value={params.q_h} onChange={e => updateParam('q_h', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={runAnalysis} disabled={isCalculating}
              className={`w-full bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center space-x-2 ${
                isCalculating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>计算中...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>执行脱空受力分析</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主工作区 */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-5">
          {/* Header Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                <Circle className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 tracking-tight uppercase">【壁后脱空】隧道衬砌壁后脱空与环向应力评估看板</h2>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono mt-0.5">
                  <span>ELASTIC CURVED BEAM MODEL // SCENARIO 3.3</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'profile' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                环向内力与应力分布
              </button>
              <button
                onClick={() => setActiveTab('section')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'section' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                断面脱空范围图示
              </button>
              <button
                onClick={() => setActiveTab('rate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'rate' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                局部弯矩变化率 ΔM
              </button>
              <button
                onClick={() => setActiveTab('sop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'sop' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                脱空注浆处治 SOP
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1 pb-10">
            {/* 核心指标卡片矩阵 (4 KPI Cards) */}
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                title="最大外壁拉应力 σ_outer"
                value={results.max_sigma_outer.toFixed(2)}
                unit="MPa"
                subtitle={`极大值位置 θ = ${results.max_sigma_angle}°`}
                status={results.max_sigma_outer > 1.5 ? 'critical' : results.max_sigma_outer > 0.5 ? 'warning' : 'safe'}
              />
              <KPICard
                title="最大弯矩变化率 ΔM/M0"
                value={results.max_moment_rate.toFixed(1)}
                unit="%"
                subtitle="脱空引发内力重分布"
                status="neutral"
              />
              <KPICard
                title="脱空区弧长 L_void"
                value={results.void_arc_length.toFixed(2)}
                unit="m"
                subtitle={`范围 ${params.theta_void - params.void_width}° ~ ${params.theta_void + params.void_width}°`}
                status="neutral"
              />
              <KPICard
                title="脱空折减强度"
                value={((1 - params.void_factor) * 100).toFixed(0)}
                unit="% 失去侧压"
                subtitle={`侧压力折减系数 ${params.void_factor}`}
                status={params.void_factor === 0 ? 'critical' : 'warning'}
              />
            </div>

            {/* 灾害状态预警横条 */}
            <div className={`bg-slate-900/90 border rounded-2xl shadow-xl backdrop-blur-md p-4 flex items-center justify-between ${
              results.status === 'critical' ? 'border-rose-500/40' :
              results.status === 'warning' ? 'border-amber-500/40' :
              'border-emerald-500/40'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${
                  results.status === 'critical' ? 'bg-rose-500/10 text-rose-400' :
                  results.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    {results.status === 'critical' ? '🚨 红色警示：壁后脱空致使衬砌外壁出现高拉应力，结构存在开裂/破坏风险！' :
                     results.status === 'warning' ? '⚠️ 黄色预警：壁后局域存在脱空，引发弯矩重分布与应力偏心' :
                     '✅ 绿色安全：壁后接触状态良好，衬砌内力与环向应力分布平稳'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    最高外壁拉应力: {results.max_sigma_outer.toFixed(2)} MPa // 最大弯矩变化率: {results.max_moment_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div>
                {results.status === 'safe' && (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-mono font-bold">
                    🟢 STATUS: SAFE
                  </span>
                )}
                {results.status === 'warning' && (
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-mono font-bold">
                    🟡 STATUS: WARNING
                  </span>
                )}
                {results.status === 'critical' && (
                  <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
                    🔴 STATUS: CRITICAL
                  </span>
                )}
              </div>
            </div>

            {/* Tab 1: 环向内力与应力分布 */}
            {activeTab === 'profile' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-slate-100">全环 360° 弯矩 M 与内外壁环向应力 σ 分布曲线</h3>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    FULL RING PROFILE // 360 POINTS
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.profile} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSky" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMvoid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="angle" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" label={{ value: '环向角度 θ (°)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis yAxisId="left" orientation="left" stroke="#f43f5e" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: '弯矩 M (kN·m/m)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: '外壁应力 σ (MPa)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      <Area yAxisId="left" type="monotone" dataKey="M0" name="无脱空基准弯矩 M0" stroke="#818cf8" fillOpacity={1} fill="url(#colorSky)" />
                      <Area yAxisId="left" type="monotone" dataKey="M_void" name="脱空重分布弯矩 M_void" stroke="#f43f5e" fillOpacity={1} fill="url(#colorMvoid)" />
                      <Line yAxisId="right" type="monotone" dataKey="sigma_outer" name="外壁环向应力 σ_outer" stroke="#38bdf8" dot={false} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tab 2: 断面脱空范围图示 */}
            {activeTab === 'section' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-slate-100">衬砌圆环截面与脱空区几何方位剖面视图</h3>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    CROSS-SECTION // R = {params.R}m, t = {params.t}m
                  </div>
                </div>

                <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 600 320">
                    <pattern id="gridVoid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                    <rect width="600" height="320" fill="url(#gridVoid)" />

                    <g transform="translate(300, 160)">
                      <circle cx="0" cy="0" r="130" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                      {(() => {
                        const radStart = ((params.theta_void - params.void_width) * Math.PI) / 180;
                        const radEnd = ((params.theta_void + params.void_width) * Math.PI) / 180;
                        const x1 = 135 * Math.sin(radStart);
                        const y1 = -135 * Math.cos(radStart);
                        const x2 = 135 * Math.sin(radEnd);
                        const y2 = -135 * Math.cos(radEnd);
                        const largeArc = params.void_width * 2 > 180 ? 1 : 0;
                        return (
                          <path
                            d={`M 0 0 L ${x1} ${y1} A 135 135 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill="#f59e0b" fillOpacity="0.35" stroke="#f59e0b" strokeWidth="2"
                          />
                        );
                      })()}

                      <circle cx="0" cy="0" r="110" fill="#1e293b" stroke="#38bdf8" strokeWidth="4" />
                      <circle cx="0" cy="0" r="95" fill="#0f172a" stroke="#475569" strokeWidth="2" />

                      <line x1="0" y1="0" x2={110 * Math.sin((params.theta_void * Math.PI)/180)} y2={-110 * Math.cos((params.theta_void * Math.PI)/180)} stroke="#f43f5e" strokeWidth="2" strokeDasharray="2 2" />

                      <text x="0" y="-120" fill="#94a3b8" fontSize="10" textAnchor="middle">0° (拱顶)</text>
                      <text x="125" y="5" fill="#94a3b8" fontSize="10" textAnchor="start">90° (拱腰)</text>
                      <text x="0" y="130" fill="#94a3b8" fontSize="10" textAnchor="middle">180° (拱底)</text>
                      <text x="-125" y="5" fill="#94a3b8" fontSize="10" textAnchor="end">270° (左拱腰)</text>
                    </g>
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200">脱空分布特征:</div>
                    <div className="text-slate-400">• 中心方位角 θ_void: <span className="font-bold text-slate-100">{params.theta_void}°</span></div>
                    <div className="text-slate-400">• 脱空范围半角 α: <span className="font-bold text-slate-100">{params.void_width}°</span></div>
                    <div className="text-slate-400">• 脱空总弧长 L_void: <span className="font-bold text-sky-400">{results.void_arc_length.toFixed(2)} m</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200">围岩压力与侧压参数:</div>
                    <div className="text-slate-400">• 竖向压力 q_v: <span className="font-bold text-slate-100">{params.q_v} kPa</span></div>
                    <div className="text-slate-400">• 水平压力 q_h: <span className="font-bold text-slate-100">{params.q_h} kPa</span></div>
                    <div className="text-slate-400">• 脱空区有效水平压力 qh_eff: <span className="font-bold text-amber-400">{(params.q_h * params.void_factor).toFixed(1)} kPa</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: 局部弯矩变化率 ΔM */}
            {activeTab === 'rate' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-100">全环各方位局部弯矩变化率 ΔM / M0 (%) 统计</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">MOMENT CHANGE RATE</span>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.profile} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="angle" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" label={{ value: '角度 θ (°)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" label={{ value: '弯矩变化率 (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                      <Line type="monotone" dataKey="moment_change_rate" name="局部弯矩变化率 (%)" stroke="#818cf8" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tab 4: 脱空注浆处治 SOP */}
            {activeTab === 'sop' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">壁后脱空无损修复与回填注浆工程处治 SOP</h3>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs font-sans">
                  <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 relative group hover:border-sky-500 transition-all">
                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center">
                      <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center mr-2 text-[10px] font-mono">01</span>
                      RADAR SCAN
                    </div>
                    <h4 className="font-bold text-slate-100">地质雷达探知脱空</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      利用地质雷达 (GPR) 探测壁后脱空具体范围，精准定位脱空中心角度与深浅分布。
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 relative group hover:border-amber-500 transition-all">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center">
                      <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center mr-2 text-[10px] font-mono">02</span>
                      DRILLING
                    </div>
                    <h4 className="font-bold text-slate-100">衬砌打孔与注浆孔布设</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      在脱空区周围按梅花形布置注浆孔，钻透二衬壁厚，安装带有止浆阀的打孔管嘴。
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 relative group hover:border-purple-500 transition-all">
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center">
                      <span className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center mr-2 text-[10px] font-mono">03</span>
                      POLYMER GROUTING
                    </div>
                    <h4 className="font-bold text-slate-100">高聚物微膨胀注浆</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      采用无损高聚物或水泥-水玻璃双液浆进行压浆，利用微膨胀特性充填壁后空洞，恢复围岩密贴。
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 relative group hover:border-emerald-500 transition-all">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center">
                      <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mr-2 text-[10px] font-mono">04</span>
                      VERIFICATION
                    </div>
                    <h4 className="font-bold text-slate-100">二期雷达复检与监测</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      注浆凝固后重新进行雷达扫描复检，确认密贴程度达到 100%，消除内力集中风险。
                    </p>
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
