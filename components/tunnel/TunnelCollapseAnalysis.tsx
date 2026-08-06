import React, { useState } from 'react';
import { 
  Settings, Rocket, Activity, AlertTriangle, Box, 
  Layers, Cpu, TrendingUp, ShieldCheck
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend 
} from 'recharts';
import { calculate_rock_plastic_collapse, RockPlasticCollapseParams } from '../../lib/tunnelCalculations';
import { KPICard } from '../common/KPICard';

const TunnelCollapseAnalysis: React.FC = () => {
  const [params, setParams] = useState<RockPlasticCollapseParams>(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_tunnel_collapse_load') : null;
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('roadbedguard_pending_tunnel_collapse_load');
        }
        return {
          E: loadedParams.E ?? 30,
          nu: loadedParams.nu ?? 0.2,
          sigma_y: loadedParams.sigma_y ?? 5.0,
          sigma_x0: loadedParams.sigma_x0 ?? -0.15,
          sigma_y0: loadedParams.sigma_y0 ?? -0.20,
          max_strain: loadedParams.max_strain ?? -0.0015,
          tunnel_span: loadedParams.tunnel_span ?? 10.0,
          collapse_length: loadedParams.collapse_length ?? 15.0
        };
      } catch (e) {
        console.error("历史数据载入失败", e);
      }
    }
    return {
      E: 30,
      nu: 0.2,
      sigma_y: 5.0,
      sigma_x0: -0.15,
      sigma_y0: -0.20,
      max_strain: -0.0015,
      tunnel_span: 10.0,
      collapse_length: 15.0
    };
  });

  const [results, setResults] = useState(() => calculate_rock_plastic_collapse(params));
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'evolution' | 'section' | 'tensor' | 'sop'>('evolution');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const pending = localStorage.getItem('pending_injected_disease_rock_collapse_plugging') ||
                      localStorage.getItem('pending_injected_disease_crown_collapse');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.injectedParameters) {
            const { strain_max, sigma_y_factor } = parsed.injectedParameters;
            setParams(prev => {
              const next = {
                ...prev,
                max_strain: strain_max !== undefined ? strain_max : prev.max_strain,
                sigma_y: sigma_y_factor !== undefined ? 5.0 * sigma_y_factor : prev.sigma_y
              };
              setResults(calculate_rock_plastic_collapse(next));
              return next;
            });
            localStorage.removeItem('pending_injected_disease_rock_collapse_plugging');
            localStorage.removeItem('pending_injected_disease_crown_collapse');
          }
        } catch (e) {
          console.error("Error reading tunnel collapse disease", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateParam = (key: keyof RockPlasticCollapseParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetType: 'soft' | 'default' | 'hard') => {
    let preset: RockPlasticCollapseParams;
    if (presetType === 'soft') {
      preset = { E: 15, nu: 0.25, sigma_y: 2.5, sigma_x0: -0.25, sigma_y0: -0.35, max_strain: -0.0025, tunnel_span: 12.0, collapse_length: 20.0 };
    } else if (presetType === 'hard') {
      preset = { E: 50, nu: 0.18, sigma_y: 12.0, sigma_x0: -0.10, sigma_y0: -0.15, max_strain: -0.0008, tunnel_span: 10.0, collapse_length: 10.0 };
    } else {
      preset = { E: 30, nu: 0.2, sigma_y: 5.0, sigma_x0: -0.15, sigma_y0: -0.20, max_strain: -0.0015, tunnel_span: 10.0, collapse_length: 15.0 };
    }
    setParams(preset);
    setResults(calculate_rock_plastic_collapse(preset));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_rock_plastic_collapse(params);
      setResults(res);
      setIsCalculating(false);
    }, 400);
  };

  const G = (params.E / (2 * (1 + params.nu))).toFixed(2);
  const K = (params.E / (3 * (1 - 2 * params.nu))).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* 左侧控制参数面板 */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-900/90">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-rose-400" /> 围岩塑性与坍塌配置
            </h3>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
              Von Mises 引擎
            </span>
          </div>

          <div className="flex-1 pt-4 space-y-5 overflow-y-auto custom-scrollbar pr-1">
            {/* Quick Presets */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                快捷预设工况
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => applyPreset('soft')}
                  className="px-2 py-1.5 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl transition-all text-center"
                >
                  软弱围岩
                </button>
                <button
                  onClick={() => applyPreset('default')}
                  className="px-2 py-1.5 text-[11px] font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl transition-all text-center"
                >
                  基准偏压
                </button>
                <button
                  onClick={() => applyPreset('hard')}
                  className="px-2 py-1.5 text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all text-center"
                >
                  硬岩低塑
                </button>
              </div>
            </div>

            {/* 本构与力学参数 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center">
                围岩材料本构参数 (Mises Ideal Plastic)
              </h4>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">弹性模量 E (GPa)</span>
                  <span className="font-mono font-bold text-sky-400">{params.E}</span>
                </div>
                <input
                  type="range" min="5" max="100" step="1"
                  className="accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer w-full"
                  value={params.E} onChange={e => updateParam('E', parseFloat(e.target.value))}
                />
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">泊松比 ν</span>
                  <span className="font-mono font-bold text-sky-400">{params.nu}</span>
                </div>
                <input
                  type="range" min="0.1" max="0.45" step="0.01"
                  className="accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer w-full"
                  value={params.nu} onChange={e => updateParam('nu', parseFloat(e.target.value))}
                />
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">屈服强度 σy (MPa)</span>
                  <span className="font-mono font-bold text-rose-400">{params.sigma_y}</span>
                </div>
                <input
                  type="range" min="1.0" max="30.0" step="0.5"
                  className="accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer w-full"
                  value={params.sigma_y} onChange={e => updateParam('sigma_y', parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* 地应力与加载参数 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center">
                地应力场与位移约束 (Initial Stress)
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">水平应力 σx0 (MPa)</label>
                  <input
                    type="number" step="0.05"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    value={params.sigma_x0} onChange={e => updateParam('sigma_x0', parseFloat(e.target.value))}
                  />
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">竖向应力 σy0 (MPa)</label>
                  <input
                    type="number" step="0.05"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    value={params.sigma_y0} onChange={e => updateParam('sigma_y0', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">最大竖向压缩应变 εy_max</span>
                  <span className="font-mono font-bold text-amber-400">{params.max_strain}</span>
                </div>
                <input
                  type="range" min="-0.005" max="-0.0002" step="0.0001"
                  className="accent-sky-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer w-full"
                  value={params.max_strain} onChange={e => updateParam('max_strain', parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* 隧道几何参数 */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center">
                隧道几何与坍塌段尺寸
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">隧道跨度 B (m)</label>
                  <input
                    type="number" step="0.5"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    value={params.tunnel_span} onChange={e => updateParam('tunnel_span', parseFloat(e.target.value))}
                  />
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">坍塌段长度 L (m)</label>
                  <input
                    type="number" step="1"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    value={params.collapse_length} onChange={e => updateParam('collapse_length', parseFloat(e.target.value))}
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
                  <span>Mises 弹塑性求解中...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>执行 Mises 弹塑性坍塌推演</span>
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
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Box className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100 tracking-tight uppercase">【坍塌封堵】围岩塑性应变与回填注浆量评估看板</h2>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono mt-0.5">
                  <span>VON MISES ELASTO-PLASTIC MODEL // SCENARIO 3.2</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('evolution')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'evolution' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                塑性演化曲线
              </button>
              <button
                onClick={() => setActiveTab('section')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'section' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                断面塌穴与注浆视图
              </button>
              <button
                onClick={() => setActiveTab('tensor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'tensor' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                应力张量矩阵
              </button>
              <button
                onClick={() => setActiveTab('sop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'sop' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                坍塌封堵 SOP 处治
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1 pb-10">
            {/* 核心指标卡片矩阵 (4 KPI Cards) */}
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                title="累积等效塑性应变 εp_eq"
                value={results.ep_eq_total.toFixed(5)}
                subtitle={results.ep_eq_total > 0.001 ? '⚠️ 塑性区快速扩展' : results.ep_eq_total > 0 ? '⚡ 进入屈服塑性流动' : '✅ 完全处于弹性阶段'}
                status={results.ep_eq_total > 0.001 ? 'critical' : results.ep_eq_total > 0 ? 'warning' : 'safe'}
              />
              <KPICard
                title="Von Mises 等效应力"
                value={results.sigma_mises.toFixed(2)}
                unit="MPa"
                subtitle={`屈服极限 σy = ${params.sigma_y.toFixed(1)} MPa`}
                status="neutral"
              />
              <KPICard
                title="每延米坍塌体积 V_collapse"
                value={results.V_collapse_per_m.toFixed(2)}
                unit="m³/m"
                subtitle={`对应塌穴高度 ≈ ${Math.min(params.tunnel_span * 0.8, results.ep_eq_total * 2000).toFixed(2)} m`}
                status="neutral"
              />
              <KPICard
                title="回填注浆总需量 V_plugging"
                value={results.V_plugging.toFixed(1)}
                unit="m³"
                subtitle={`包含 25% 充填富余 (L=${params.collapse_length}m)`}
                status="critical"
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
                  <h3 className="font-bold text-sm text-slate-100 uppercase tracking-tight">
                    {results.status === 'critical' ? '🚨 红色警示：围岩产生显著塑性屈服，塌穴拱顶存在特大坍塌风险！' :
                     results.status === 'warning' ? '⚠️ 黄色预警：围岩局部进入塑性屈服状态，需密切关注掉块与塌穴扩展' :
                     '✅ 绿色安全：围岩处于弹塑性安全可控区间，无大面积坍塌隐患'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    终态应力向量: [σx={results.final_stresses.sx} MPa, σy={results.final_stresses.sy} MPa, σz={results.final_stresses.sz} MPa, τxy={results.final_stresses.txy} MPa]
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

            {/* Tab 1: 塑性应变与应力演化 */}
            {activeTab === 'evolution' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold text-slate-100">围岩等效塑性应变与 Von Mises 应力响应全过程演化</h3>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Radial Return Algorithm // 100 Steps
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMises" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis dataKey="step" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#475569" label={{ value: '加载步 (Step)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis yAxisId="left" orientation="left" stroke="#f43f5e" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: '等效塑性应变 εp_eq', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'Mises 应力 (MPa)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      <Area yAxisId="left" type="monotone" dataKey="ep_eq" name="累积等效塑性应变 εp_eq" stroke="#f43f5e" fillOpacity={1} fill="url(#colorEp)" />
                      <Area yAxisId="right" type="monotone" dataKey="sigma_mises" name="Von Mises 应力 (MPa)" stroke="#38bdf8" fillOpacity={1} fill="url(#colorMises)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs font-mono bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="font-bold text-slate-400">弹性剪切模量 G:</span>
                    <span className="font-mono font-bold text-slate-100 ml-2">{G} GPa</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">体积模量 K:</span>
                    <span className="font-mono font-bold text-slate-100 ml-2">{K} GPa</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400">屈服强度边界 σy:</span>
                    <span className="font-mono font-bold text-rose-400 ml-2">{params.sigma_y} MPa</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: 断面塌穴与注浆视图 */}
            {activeTab === 'section' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-slate-100">隧道拱顶坍塌塌穴与回填注浆封堵断面可视化</h3>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    CROSS-SECTION // SPAN B = {params.tunnel_span}m
                  </div>
                </div>

                <div className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 600 320">
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                    <rect width="600" height="320" fill="url(#gridPattern)" />

                    <ellipse
                      cx="300" cy="180" rx={140 + results.ep_eq_total * 10000} ry={110 + results.ep_eq_total * 8000}
                      fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4"
                    />

                    <rect x="50" y="20" width="500" height="280" fill="none" stroke="#334155" strokeWidth="2" />

                    <path d="M 180 100 L 300 30 L 420 100" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 3" />
                    <circle cx="180" cy="100" r="4" fill="#38bdf8" />
                    <circle cx="240" cy="65" r="4" fill="#38bdf8" />
                    <circle cx="300" cy="30" r="4" fill="#38bdf8" />
                    <circle cx="360" cy="65" r="4" fill="#38bdf8" />
                    <circle cx="420" cy="100" r="4" fill="#38bdf8" />

                    <path
                      d={`M 180 180 Q 300 ${180 - Math.min(120, results.ep_eq_total * 40000 + 30)} 420 180 Q 300 130 180 180`}
                      fill="#f59e0b" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="2"
                    />

                    <path
                      d={`M 180 250 Q 300 ${250 - Math.min(70, results.V_collapse_per_m * 4)} 420 250 Z`}
                      fill="#64748b" fillOpacity="0.8" stroke="#475569" strokeWidth="1"
                    />

                    <path
                      d="M 180 250 L 180 180 A 120 100 0 0 1 420 180 L 420 250 Z"
                      fill="none" stroke="#38bdf8" strokeWidth="4"
                    />

                    <line x1="180" y1="250" x2="420" y2="250" stroke="#38bdf8" strokeWidth="3" />

                    <text x="300" y="290" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                      开挖跨度 B = {params.tunnel_span}m // 拱顶塌穴高 h ≈ {Math.min(params.tunnel_span * 0.8, results.ep_eq_total * 2000).toFixed(2)}m
                    </text>
                    <text x="300" y="80" fill="#f59e0b" fontSize="11" fontWeight="bold" textAnchor="middle">
                      塌穴回填区 (需浆量 V_plugging = {results.V_plugging.toFixed(1)} m³)
                    </text>
                    <text x="300" y="25" fill="#38bdf8" fontSize="10" textAnchor="middle">
                      超前大管棚预加固圈 (Pipe Roof Protection)
                    </text>
                    <text x="140" y="140" fill="#f43f5e" fontSize="10">
                      塑性圈边界 (εp_eq={results.ep_eq_total.toFixed(4)})
                    </text>
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200">坍塌几何参数:</div>
                    <div className="text-slate-400">• 坍塌段纵向长度 L: <span className="font-bold text-slate-100">{params.collapse_length} m</span></div>
                    <div className="text-slate-400">• 每延米坍塌体体积: <span className="font-bold text-slate-100">{results.V_collapse_per_m.toFixed(2)} m³/m</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200">回填注浆控制参数:</div>
                    <div className="text-slate-400">• 塌穴填充总浆量 (含25%富余): <span className="font-bold text-rose-400">{results.V_plugging.toFixed(1)} m³</span></div>
                    <div className="text-slate-400">• 推荐浆液类型: <span className="font-bold text-sky-400">双液水玻璃-水泥浆 / 高聚物微膨胀材料</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: 应力张量矩阵 */}
            {activeTab === 'tensor' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-100">终态平面应变地应力张量与弹塑性本构参数</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">STRESS TENSOR MATRIX</span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3 font-mono">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-1">
                      终态应力分量 (Final Stress Tensor, MPa)
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">水平正应力 σx</span>
                        <span className="text-base font-bold text-slate-100">{results.final_stresses.sx} MPa</span>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">竖向正应力 σy</span>
                        <span className="text-base font-bold text-slate-100">{results.final_stresses.sy} MPa</span>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">纵向正应力 σz (平面应变)</span>
                        <span className="text-base font-bold text-slate-100">{results.final_stresses.sz} MPa</span>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">剪应力 τxy</span>
                        <span className="text-base font-bold text-slate-100">{results.final_stresses.txy} MPa</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3 font-mono">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-1">
                      弹塑性控制判据与模量 (Constitutive Checks)
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                        <span className="text-slate-400">Mises 屈服强度阈值 σy:</span>
                        <span className="font-bold text-rose-400">{params.sigma_y} MPa</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                        <span className="text-slate-400">计算得 Von Mises 等效应力 q:</span>
                        <span className="font-bold text-sky-400">{results.sigma_mises.toFixed(2)} MPa</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                        <span className="text-slate-400">弹性剪切模量 G = E / [2(1+ν)]:</span>
                        <span className="font-bold text-slate-100">{G} GPa</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                        <span className="text-slate-400">体积模量 K = E / [3(1-2ν)]:</span>
                        <span className="font-bold text-slate-100">{K} GPa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: 坍塌封堵 SOP */}
            {activeTab === 'sop' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">应急坍塌封堵与回填注浆工程处治矩阵 (Recovery SOP Matrix)</h3>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs font-sans">
                  <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 relative group hover:border-sky-500 transition-all">
                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center">
                      <span className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center mr-2 text-[10px] font-mono">01</span>
                      PHASE: STABILIZE
                    </div>
                    <h4 className="font-bold text-slate-100">超前管棚与预加固</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      施作“超前大管棚”或小导管注浆，向塌体顶部注浆形成强力保护拱圈，防止坍塌范围扩展。
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 relative group hover:border-amber-500 transition-all">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center">
                      <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center mr-2 text-[10px] font-mono">02</span>
                      PHASE: PLUGGING
                    </div>
                    <h4 className="font-bold text-slate-100">塌穴高聚物/双液注浆</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      按设计需浆量 <span className="font-bold text-rose-400 font-mono">{results.V_plugging.toFixed(1)} m³</span> 进行塌穴密闭填充，利用膨胀材料快速填满拱顶空洞。
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 relative group hover:border-purple-500 transition-all">
                    <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center">
                      <span className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center mr-2 text-[10px] font-mono">03</span>
                      PHASE: EXCAVATION
                    </div>
                    <h4 className="font-bold text-slate-100">分段开挖与型钢拱架</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      在管棚与回填体保护下，遵循“短进尺、弱爆破、强支护”原则分段开挖塌方渣体，并加密架设重型型钢拱架。
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 relative group hover:border-emerald-500 transition-all">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center">
                      <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mr-2 text-[10px] font-mono">04</span>
                      PHASE: COMPACT
                    </div>
                    <h4 className="font-bold text-slate-100">压力补偿与二衬浇筑</h4>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      施作永久二次衬砌，并进行二次壁后高压补强注浆，确保衬砌与围岩密贴、传力均匀。
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

export default TunnelCollapseAnalysis;
