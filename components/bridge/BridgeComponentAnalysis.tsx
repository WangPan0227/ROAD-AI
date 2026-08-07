import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Settings, Rocket, Waves, Gauge, AlertTriangle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { calculate_debris_flow_component_damage, DebrisFlowImpactParams } from '../../lib/bridgeCalculations';
import { KPICard } from '../common/KPICard';

const BridgeComponentAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState<DebrisFlowImpactParams>(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_bridge_component_load') : null;
    if (pendingLoad) {
      try {
        const parsed = JSON.parse(pendingLoad);
        return {
          D: parsed.D ?? 1.2,
          Dst: parsed.Dst ?? 14,
          Nmin: parsed.Nmin ?? 3650,
          fc: parsed.fc ?? 19.1,
          fyt: parsed.fyt ?? 360,
          miu_d: parsed.miu_d ?? 6.0,
          s: parsed.s ?? 10,
          cc: parsed.cc ?? 5,
          rho_df: parsed.rho_df ?? 1800,
          v_df: parsed.v_df ?? 6.0,
          H_df: parsed.H_df ?? 2.5,
        };
      } catch (e) {
        console.error("Failed to parse component load", e);
      }
    }
    return {
      D: 1.2,
      Dst: 14,
      Nmin: 3650,
      fc: 19.1,
      fyt: 360,
      miu_d: 6.0,
      s: 10,
      cc: 5,
      rho_df: 1800,
      v_df: 6.0,
      H_df: 2.5,
    };
  });

  const [results, setResults] = useState(() => calculate_debris_flow_component_damage(params));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const pending = localStorage.getItem('pending_injected_disease_component_damage') || 
                      localStorage.getItem('pending_injected_disease_component_corrosion');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.injectedParameters) {
            const { rho_df, v_df } = parsed.injectedParameters;
            setParams(prev => {
              const next = {
                ...prev,
                rho_df: rho_df !== undefined ? rho_df : prev.rho_df,
                v_df: v_df !== undefined ? v_df : prev.v_df
              };
              setResults(calculate_debris_flow_component_damage(next));
              return next;
            });
            localStorage.removeItem('pending_injected_disease_component_damage');
            localStorage.removeItem('pending_injected_disease_component_corrosion');
          }
        } catch (e) {
          console.error("Error reading component damage disease", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateParam = (key: keyof DebrisFlowImpactParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_debris_flow_component_damage(params);
      setResults(res);
      setIsCalculating(false);
    }, 200);
  };

  const forceRatio = results?.force_ratio ?? 0;
  const status = results?.status ?? 'safe';

  // Radar chart capacity data
  const radarData = [
    { subject: '截面抗剪 (Vn)', value: Math.min(100, Math.round(((results?.Vn ?? 0) / 1500) * 100)) },
    { subject: '冲击储备', value: Math.max(0, Math.min(100, Math.round((1 - forceRatio) * 100))) },
    { subject: '延性韧性 (λ)', value: Math.min(100, Math.round(((results?.lamda ?? 0) / 0.3) * 100)) },
    { subject: '抗开裂能力', value: Math.min(100, Math.round(((results?.delta_s1 ?? 0) / 0.05) * 100)) },
    { subject: '极度限位储备', value: Math.min(100, Math.round(((results?.delta_s2 ?? 0) / 0.25) * 100)) },
  ];

  // Flow velocity response curve
  const velocityTrend = Array.from({ length: 10 }, (_, i) => {
    const testVelocity = (i + 1) * 1.5;
    const testRes = calculate_debris_flow_component_damage({ ...params, v_df: testVelocity });
    return {
      v: testVelocity.toFixed(1),
      Fs: Math.round(testRes.Fs),
      Vn: Math.round(testRes.Vn),
      ratio: parseFloat(testRes.force_ratio.toFixed(2))
    };
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-900/90">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-sky-400" /> 泥石流冲击与物理参数
            </h3>
          </div>
          
          <div className="flex-1 pt-3 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {/* 泥石流动力参数 */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">泥石流动力学特征</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">泥石流密度 ρ_df (kg/m³)</label>
                <input type="number" step="50" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.rho_df} onChange={e => updateParam('rho_df', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">泥石流流速 v_df (m/s)</label>
                <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.v_df} onChange={e => updateParam('v_df', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">冲击泥深 H_df (m)</label>
                <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.H_df} onChange={e => updateParam('H_df', parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            {/* 桥墩构件结构参数 */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">桥墩构件结构与材料</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">墩柱直径 D (m)</label>
                <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.D} onChange={e => updateParam('D', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">螺旋箍筋直径 Dst (mm)</label>
                <input type="number" step="1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.Dst} onChange={e => updateParam('Dst', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">箍筋间距 s (cm)</label>
                <input type="number" step="1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.s} onChange={e => updateParam('s', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">保护层厚度 cc (cm)</label>
                <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.cc} onChange={e => updateParam('cc', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">最小轴力 Nmin (kN)</label>
                <input type="number" step="100" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.Nmin} onChange={e => updateParam('Nmin', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">砼抗压 fc (MPa)</label>
                <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.fc} onChange={e => updateParam('fc', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">箍筋抗拉 fyt (MPa)</label>
                <input type="number" step="10" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.fyt} onChange={e => updateParam('fyt', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">延性系数 miu_d</label>
                <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.miu_d} onChange={e => updateParam('miu_d', parseFloat(e.target.value) || 0)} />
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
              {isCalculating ? <Activity className="animate-spin w-4 h-4" /> : <Rocket className="w-4 h-4" />}
              <span>{isCalculating ? 'SIMULATING...' : '执行泥石流冲击损伤仿真'}</span>
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-100 tracking-wider uppercase">场景 2.3：构件损伤 | 桥梁构件损伤与泥石流冲击承载力评估</h2>
                <span className="text-[10px] text-slate-400 font-mono">DEBRIS FLOW COMPONENT IMPACT V3.0</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono border flex items-center space-x-1.5 ${
                status === 'safe' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                status === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
              }`}>
                <span className={`w-2 h-2 rounded-full ${status === 'safe' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                <span>{status === 'safe' ? '安全 (SAFE)' : status === 'warning' ? '预警 (WARNING)' : '危险破坏 (CRITICAL)'}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1 pb-10">
            <div className="space-y-5 animate-in fade-in duration-500">
              {/* 核心指标卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="截面抗剪承载力 Vn"
                  value={(results?.Vn ?? 0).toFixed(1)}
                  unit="kN"
                  subtitle={`抗剪强度 vc: ${(results?.vc ?? 0).toFixed(3)} MPa`}
                  status="safe"
                />
                <KPICard
                  title="泥石流冲击推力 Fs"
                  value={(results?.Fs ?? 0).toFixed(1)}
                  unit="kN"
                  subtitle={`ρ: ${params.rho_df} kg/m³ | v: ${params.v_df} m/s`}
                  status="neutral"
                />
                <KPICard
                  title="冲击受力比 Fs / Vn"
                  value={`${(forceRatio * 100).toFixed(1)}%`}
                  subtitle={`延性折减 λ: ${(results?.lamda ?? 0).toFixed(3)}`}
                  status={forceRatio >= 1.0 ? 'critical' : forceRatio >= 0.6 ? 'warning' : 'safe'}
                />
                <KPICard
                  title="位移阈值 (δs1 / δs2)"
                  value={`${((results?.delta_s1 ?? 0) * 100).toFixed(1)} cm`}
                  subtitle={`极限位移 δs2: ${((results?.delta_s2 ?? 0) * 100).toFixed(1)} cm`}
                  status="neutral"
                />
              </div>

              {/* 核心视觉与受力模型 */}
              <div className="grid grid-cols-12 gap-5">
                {/* 泥石流冲击仿真视图 */}
                <div className="col-span-12 lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col items-center justify-center relative min-h-[380px]">
                  <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-sky-400" /> DEBRIS FLOW IMPACT SIMULATION DYNAMICS
                  </div>

                  <svg width="560" height="300" viewBox="0 0 560 300" className="relative z-10">
                    {/* Ground Bed */}
                    <rect x="20" y="240" width="520" height="40" fill="#0f172a" rx="2" />
                    <line x1="20" y1="240" x2="540" y2="240" stroke="#334155" strokeWidth="2" />

                    {/* Bridge Deck & Cap Beam */}
                    <rect x="120" y="20" width="320" height="24" fill="#334155" rx="2" />
                    <rect x="210" y="44" width="140" height="20" fill="#475569" rx="1" />

                    {/* Bridge Pier Cylinder */}
                    <rect x="250" y="64" width="60" height="176" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

                    {/* Stirrup/Rebar Cage Indication */}
                    <g opacity="0.4" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3">
                      <line x1="255" y1="80" x2="305" y2="80" />
                      <line x1="255" y1="110" x2="305" y2="110" />
                      <line x1="255" y1="140" x2="305" y2="140" />
                      <line x1="255" y1="170" x2="305" y2="170" />
                      <line x1="255" y1="200" x2="305" y2="200" />
                    </g>

                    {/* Mud/Debris Flow Wave */}
                    {(() => {
                      const mudHeightPx = Math.min(160, params.H_df * 30);
                      const mudTopY = 240 - mudHeightPx;
                      return (
                        <g>
                          <path
                            d={`M 20 240 L 20 ${mudTopY} C 100 ${mudTopY - 15}, 180 ${mudTopY + 10}, 250 ${mudTopY} L 250 240 Z`}
                            fill="#78350f" fillOpacity="0.6"
                          />
                          <circle cx="180" cy={mudTopY + 10} r="6" fill="#9a3412" opacity="0.8" />
                          <circle cx="210" cy={mudTopY - 5} r="9" fill="#ea580c" opacity="0.9" />

                          {/* Height Annotation */}
                          <line x1="100" y1="240" x2="100" y2={mudTopY} stroke="#ea580c" strokeWidth="1.5" strokeDasharray="4 2" />
                          <text x="105" y={mudTopY + mudHeightPx / 2} fill="#fdba74" fontSize="10" fontWeight="bold">
                            H_df = {params.H_df}m
                          </text>
                        </g>
                      );
                    })()}

                    {/* Impact Force Vectors Fs */}
                    <g transform={`translate(160, ${240 - Math.min(160, params.H_df * 30) / 2})`}>
                      <line x1="0" y1="0" x2="80" y2="0" stroke="#f43f5e" strokeWidth="3" />
                      <polygon points="80,-5 92,0 80,5" fill="#f43f5e" />
                      <text x="35" y="-10" textAnchor="middle" fill="#f43f5e" fontSize="11" fontWeight="bold" className="font-mono">
                        Fs = {(results?.Fs ?? 0).toFixed(0)} kN
                      </text>
                    </g>

                    {/* Crack / Damage Indication if warning/critical */}
                    {forceRatio >= 0.6 && (
                      <g transform="translate(250, 200)">
                        <path d="M 0 0 L 15 -10 L 25 -5 L 35 -15" stroke="#f43f5e" strokeWidth="2" fill="none" />
                        <text x="40" y="-10" fill="#f43f5e" fontSize="9" fontWeight="bold">塑性开裂区</text>
                      </g>
                    )}

                    {/* Pier Diameter Label */}
                    <line x1="250" y1="255" x2="310" y2="255" stroke="#475569" strokeWidth="1" />
                    <text x="280" y="270" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">D = {params.D}m</text>
                  </svg>
                </div>

                {/* Radar Capability Matrix */}
                <div className="col-span-12 lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-center">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-center">
                    构件防护综合能力图谱
                  </h4>
                  <div className="w-full h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                        <Radar name="Status" dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 流速与推力响应曲线 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center">
                  <Gauge className="w-4 h-4 mr-2 text-sky-400" /> 流速-冲击推力(Fs)与受力比响应特征曲线
                </h4>
                <div className="w-full h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={velocityTrend}>
                      <defs>
                        <linearGradient id="colorFs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="v" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} label={{ value: '流速 v_df (m/s)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="Fs" name="泥石流冲击推力 Fs (kN)" stroke="#fbbf24" fillOpacity={1} fill="url(#colorFs)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Vn" name="截面抗剪承载力 Vn (kN)" stroke="#38bdf8" fillOpacity={0} strokeWidth={1.5} strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 决策防范建议 */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" /> 泥石流冲击防灾及加固综合决策建议
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  根据计算，当前泥石流冲击推力 Fs = <span className="font-bold text-amber-400 font-mono">{(results?.Fs ?? 0).toFixed(1)} kN</span>，
                  桥墩构件截面抗剪承载力 Vn = <span className="font-bold text-sky-400 font-mono">{(results?.Vn ?? 0).toFixed(1)} kN</span>，
                  受力比为 <span className="font-bold text-slate-100 font-mono">{(forceRatio * 100).toFixed(1)}%</span>。
                  {forceRatio >= 1.0 ? (
                    <span className="text-rose-400 font-bold ml-1">
                      结论：冲击推力已突破构件截面极限抗剪承载力，构件存在严重的剪切破坏及断裂风险！建议在上游紧急配置排导槽/格栅坝防撞设施，并在墩身增加钢管混凝土护套。
                    </span>
                  ) : forceRatio >= 0.6 ? (
                    <span className="text-amber-400 font-bold ml-1">
                      结论：冲击受力比处于预警区间，结构可能出现塑性开裂。建议增加螺旋箍筋加密区或外包复合材料加固套箱。
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold ml-1">
                      结论：当前构件抗剪储备充足，冲击变形在安全受控范围内。建议保持常规巡检，监控泥石流物源堆积演变。
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeComponentAnalysis;
