import React, { useState, useEffect } from 'react';
import { 
  Activity, Settings, Rocket, Save, ShieldCheck, 
  Zap, Brain, Cpu, FileText
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { 
  calculate_tunnel_lining_crack_width, 
  TunnelLiningCrackParams 
} from '../../lib/tunnelCalculations';
import { KPICard } from '../common/KPICard';

interface LiningCrackFormState {
  M: number;       // 弯矩 (kN·m/m)
  N: number;       // 轴力 (kN/m)
  t: number;       // 衬砌厚度 (m)
  fc: number;      // 混凝土抗压强度 (MPa)
  f_ctm: number;   // 混凝土平均抗拉强度 (MPa)
  Es: number;      // 钢筋弹性模量 (GPa)
  Ec: number;      // 混凝土弹性模量 (GPa)
  As_ratio: number;// 配筋率 %
  c_nom: number;  // 保护层净厚度 (m)
  phi_mm: number;  // 钢筋直径 (mm)
}

const TunnelAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState<LiningCrackFormState>(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_tunnel_load') : null;
    if (pendingLoad) {
      try {
        const parsed = JSON.parse(pendingLoad);
        if (parsed.M !== undefined || parsed.N !== undefined || parsed.t !== undefined) {
          return {
            M: parsed.M ?? 112.5,
            N: parsed.N ?? 525.0,
            t: parsed.t ?? (parsed.dLining ? parsed.dLining / 1000 : 0.30),
            fc: parsed.fc ?? 30.0,
            f_ctm: parsed.f_ctm ?? 2.2,
            Es: parsed.Es ?? 200.0,
            Ec: parsed.Ec ?? 30.0,
            As_ratio: parsed.As_ratio ?? 1.0,
            c_nom: parsed.c_nom ?? 0.05,
            phi_mm: parsed.phi_mm ?? (parsed.phi ? parsed.phi * 1000 : 20.0),
          };
        }
      } catch (e) {
        console.error("Failed to parse tunnel lining load", e);
      }
    }
    return {
      M: 112.5,
      N: 525.0,
      t: 0.30,
      fc: 30.0,
      f_ctm: 2.2,
      Es: 200.0,
      Ec: 30.0,
      As_ratio: 1.0,
      c_nom: 0.05,
      phi_mm: 20.0,
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_tunnel_load')) {
         localStorage.removeItem('roadbedguard_pending_tunnel_load');
      }
      const pending = localStorage.getItem('pending_injected_disease_lining_failure') ||
                      localStorage.getItem('pending_injected_disease_rock_pressure');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.injectedParameters) {
            const { M_boost, N_factor } = parsed.injectedParameters;
            setParams(prev => ({
              ...prev,
              M: 112.5 * (M_boost || 1.0),
              N: 525.0 * (N_factor || 1.0)
            }));
            localStorage.removeItem('pending_injected_disease_lining_failure');
            localStorage.removeItem('pending_injected_disease_rock_pressure');
          }
        } catch (e) {
          console.error("Error reading lining failure disease", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateParam = (key: keyof LiningCrackFormState, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
    }, 200);
  };

  const engineParams: TunnelLiningCrackParams = {
    M: params.M,
    N: params.N,
    t: params.t,
    fc: params.fc,
    f_ctm: params.f_ctm,
    Es: params.Es,
    Ec: params.Ec,
    As_ratio: params.As_ratio,
    c_nom: params.c_nom,
    phi: params.phi_mm / 1000.0,
  };

  const results = calculate_tunnel_lining_crack_width(engineParams);

  const saveToHistory = () => {
    const historyRecord = {
      id: `TN-CRACK-${Date.now()}`,
      date: new Date().toISOString(),
      params: { ...params },
      results: { ...results }
    };
    const existingHistory = JSON.parse(localStorage.getItem('roadbedguard_tunnel_history') || '[]');
    localStorage.setItem('roadbedguard_tunnel_history', JSON.stringify([historyRecord, ...existingHistory]));
    alert('当前衬砌破坏与裂缝宽度案例已成功归档！');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        
        {/* LEFT: Parameters Input Matrix */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-900/90">
            <span className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-sky-400" /> 参数输入矩阵 (MC2010)
            </span>
          </div>
          
          <div className="flex-1 pt-3 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {/* Section Internal Forces */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              衬砌截面内力荷载 Section Forces
            </div>
            <div className="space-y-2 text-xs">
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">截面弯矩 M (kN·m/m)</label>
                 <input type="number" step="1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.M} onChange={e => updateParam('M', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">截面轴力 N (kN/m)</label>
                 <input type="number" step="10" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.N} onChange={e => updateParam('N', parseFloat(e.target.value) || 0)} />
               </div>
            </div>

            {/* Geometry & Structural Details */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
              几何与结构配筋 Geometry & Rebar
            </div>
            <div className="space-y-2 text-xs">
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">衬砌厚度 t (m)</label>
                 <input type="number" step="0.01" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.t} onChange={e => updateParam('t', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">保护层厚度 c_nom (m)</label>
                 <input type="number" step="0.005" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.c_nom} onChange={e => updateParam('c_nom', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">钢筋直径 φ (mm)</label>
                 <input type="number" step="1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.phi_mm} onChange={e => updateParam('phi_mm', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">配筋率 As (%)</label>
                 <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.As_ratio} onChange={e => updateParam('As_ratio', parseFloat(e.target.value) || 0)} />
               </div>
            </div>

            {/* Material Properties */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
              材料与力学属性 Material Properties
            </div>
            <div className="space-y-2 text-xs">
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">混凝土抗压 fc (MPa)</label>
                 <input type="number" step="1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.fc} onChange={e => updateParam('fc', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">抗拉 f_ctm (MPa)</label>
                 <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.f_ctm} onChange={e => updateParam('f_ctm', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">混凝土模量 Ec (GPa)</label>
                 <input type="number" step="1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.Ec} onChange={e => updateParam('Ec', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">钢筋模量 Es (GPa)</label>
                 <input type="number" step="5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-sky-500" value={params.Es} onChange={e => updateParam('Es', parseFloat(e.target.value) || 0)} />
               </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button 
              onClick={runAnalysis}
              disabled={isCalculating}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center space-x-2"
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>推理计算中...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 text-sky-200" />
                  <span>执行 MC2010 裂缝计算 SOLVE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Main Dashboard Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-5">
          <header className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-100 tracking-wider uppercase italic">场景 3.1：衬砌破坏 | MC2010 偏心受力衬砌特征裂缝宽度预测</h2>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">fib Model Code 2010 Non-linear Crack Prediction Model</p>
                </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={saveToHistory} className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-700 shadow transition-all">
                <Save className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 案例归档
              </button>
              {results.status === 'critical' && (
                <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
                  🔴 CRITICAL: 裂缝严重超限 (&gt;0.4mm)
                </span>
              )}
              {results.status === 'warning' && (
                <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-mono font-bold">
                  🟡 WARNING: 裂缝接近限值 (0.2~0.4mm)
                </span>
              )}
              {results.status === 'safe' && (
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-mono font-bold">
                  🟢 NOMINAL: 稳态安全 (≤0.2mm)
                </span>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1 pb-10">
            {/* 核心双驱动指标看板 */}
            <div className="grid grid-cols-4 gap-4">
              <KPICard
                title="特征裂缝宽度 (w_max)"
                value={results.w_max.toFixed(3)}
                unit="mm"
                subtitle="/ 0.200 mm [规范控制限值]"
                status={results.w_max > 0.4 ? 'critical' : results.w_max > 0.2 ? 'warning' : 'safe'}
              />
              <KPICard
                title="受拉钢筋应力 (σ_s)"
                value={results.sigma_s_MPa.toFixed(2)}
                unit="MPa"
                subtitle="/ 400.0 MPa [屈服极限 fy]"
                status={results.sigma_s_MPa > 300 ? 'warning' : 'safe'}
              />
              <KPICard
                title="最大裂缝间距 (s_r,max)"
                value={results.s_r_max_mm.toFixed(1)}
                unit="mm"
                subtitle="MC2010 式(7.6-5) 约束"
                status="neutral"
              />
              <KPICard
                title="中性轴相对高度 (x/t)"
                value={results.x_ratio.toFixed(1)}
                unit="%"
                subtitle="受压区深度比例"
                status="neutral"
              />
            </div>

            {/* 荷载及受力特性概览 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Zap className="w-3.5 h-3.5 mr-2 text-sky-400" /> 衬砌截面偏心受力参数 Section Force Metrics
                </h4>
                <span className="text-[10px] font-mono text-sky-400 font-bold">偏心距 e = {(Math.abs(params.M) / Math.max(1, Math.abs(params.N))).toFixed(3)} m</span>
              </div>
              <div className="grid grid-cols-4 gap-6 font-mono">
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">设计弯矩 M</div>
                  <div className="text-2xl font-extrabold text-slate-100">{params.M.toFixed(1)} <span className="text-xs text-slate-400 font-normal">kN·m/m</span></div>
                </div>
                <div className="border-l border-slate-800 pl-6">
                  <div className="text-[9px] text-sky-400 font-bold uppercase mb-1">设计轴力 N</div>
                  <div className="text-2xl font-extrabold text-sky-400">{params.N.toFixed(1)} <span className="text-xs text-slate-400 font-normal">kN/m</span></div>
                </div>
                <div className="border-l border-slate-800 pl-6">
                  <div className="text-[9px] text-indigo-400 font-bold uppercase mb-1">换算弹性模量比 α_e</div>
                  <div className="text-2xl font-extrabold text-indigo-400">{(params.Es / params.Ec).toFixed(2)}</div>
                </div>
                <div className="border-l border-slate-800 pl-6">
                  <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">衬砌有效高度 d_eff</div>
                  <div className="text-2xl font-extrabold text-slate-100">{(params.t * 0.9).toFixed(3)} <span className="text-xs text-slate-400 font-normal">m</span></div>
                </div>
              </div>
            </div>

            {/* 科学可视化与物理几何示图 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: 2D Concrete Lining Cross-Section Stress & Crack Diagram */}
              <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-5 bg-sky-500 rounded-full" />
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">MC2010 偏心受力衬砌开裂截面剖面图 (Crack & Stress Diagram)</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">t={params.t}m | b=1.0m | c_nom={params.c_nom}m</span>
                </div>

                <div className="flex-1 flex items-center justify-center relative py-4 bg-slate-950 rounded-xl border border-slate-800">
                  <svg width="520" height="280" viewBox="0 0 520 280" className="w-full h-auto max-h-[280px]">
                    <defs>
                      <pattern id="concreteHatch" width="10" height="10" patternUnits="userSpaceOnUse">
                        <rect width="10" height="10" fill="#0f172a" />
                        <circle cx="2" cy="2" r="0.8" fill="#334155" />
                        <circle cx="7" cy="7" r="0.8" fill="#1e293b" />
                      </pattern>
                      <pattern id="compZoneHatch" width="8" height="8" patternUnits="userSpaceOnUse">
                        <rect width="8" height="8" fill="#0369a1" fillOpacity="0.2" />
                        <line x1="0" y1="8" x2="8" y2="0" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
                      </pattern>
                      <marker id="forceArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                        <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
                      </marker>
                    </defs>

                    {/* Main Concrete Section */}
                    <rect x="80" y="70" width="360" height="140" fill="url(#concreteHatch)" stroke="#475569" strokeWidth="2" />
                    <text x="260" y="55" className="text-[10px] fill-slate-400 font-mono font-bold text-center">衬砌截面 (Section b=1.0m)</text>

                    {/* Compressed Zone */}
                    {(() => {
                      const x_px = Math.max(10, Math.min(130, (results.x_ratio / 100) * 140));
                      return (
                        <g>
                          <rect x="80" y="70" width="360" height={x_px} fill="url(#compZoneHatch)" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
                          <line x1="60" y1={70 + x_px} x2="460" y2={70 + x_px} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 3" />
                          <text x="465" y={73 + x_px} className="text-[9px] fill-rose-400 font-mono font-bold">中性轴 NA (x={(params.t * (results.x_ratio / 100)).toFixed(3)}m)</text>
                        </g>
                      );
                    })()}

                    {/* Rebar Dots */}
                    <g>
                      <line x1="90" y1="196" x2="430" y2="196" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
                      {[100, 140, 180, 220, 260, 300, 340, 380, 420].map((cx, idx) => (
                        <circle key={idx} cx={cx} cy="196" r="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                      ))}
                      <text x="435" y="199" className="text-[8px] fill-slate-400 font-mono font-bold">受拉钢筋 φ{params.phi_mm}mm</text>
                    </g>

                    {/* Tension Cracks rendering */}
                    {results.w_max > 0.01 && (
                      <g>
                        {[130, 190, 250, 310, 370].map((cx, idx) => {
                          const crackH = Math.min(60, Math.max(15, (1 - results.x_ratio / 100) * 100));
                          return (
                            <path 
                              key={idx} 
                              d={`M ${cx} 210 L ${cx - (idx % 2 === 0 ? 3 : -3)} ${210 - crackH / 2} L ${cx} ${210 - crackH}`} 
                              stroke="#f43f5e" 
                              strokeWidth={Math.max(1.5, results.w_max * 3)} 
                              fill="none" 
                            />
                          );
                        })}
                        <text x="250" y="230" className="text-[10px] fill-rose-400 font-mono font-bold text-center">
                          预测最大特征裂缝宽度 w_max = {results.w_max.toFixed(3)} mm
                        </text>
                      </g>
                    )}

                    {/* Forces Annotations */}
                    <g transform="translate(30, 140)">
                      <line x1="0" y1="0" x2="45" y2="0" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#forceArrow)" />
                      <text x="0" y="-8" className="text-[10px] fill-sky-400 font-mono font-bold">N={params.N}kN</text>
                    </g>

                    <g transform="translate(260, 248)">
                      <path d="M -30 -5 Q 0 -20 30 -5" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#forceArrow)" />
                      <text x="0" y="15" className="text-[10px] fill-sky-400 font-mono font-bold text-center">M={params.M}kN·m</text>
                    </g>

                    {/* Section Height Indicator */}
                    <line x1="68" y1="70" x2="68" y2="210" stroke="#64748b" strokeWidth="1" />
                    <line x1="64" y1="70" x2="72" y2="70" stroke="#64748b" strokeWidth="1" />
                    <line x1="64" y1="210" x2="72" y2="210" stroke="#64748b" strokeWidth="1" />
                    <text x="45" y="145" className="text-[10px] fill-slate-300 font-mono font-bold">t={params.t}m</text>
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-800">
                  <span>• 依据 fib Model Code 2010 拉伸刚化 (Tension Stiffening) 模型计算</span>
                  <span>• 结合开裂截面平截面假定与有效受拉混凝土面积 A_c_eff</span>
                </div>
              </div>

              {/* Right 1 Col: Radar Envelope Analysis */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                    MC2010 开裂评价多维包络 Radar
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={[
                        { subject: '裂缝余量', A: Math.max(0.2, Math.min(2.0, (0.4 - results.w_max) / 0.2 + 1.0)) },
                        { subject: '钢筋应力', A: Math.max(0.2, Math.min(2.0, (400 - results.sigma_s_MPa) / 200 + 0.5)) },
                        { subject: '压区比(x/t)', A: Math.min(2.0, (results.x_ratio / 50) * 1.5) },
                        { subject: '配筋率', A: Math.min(2.0, params.As_ratio * 1.2) },
                        { subject: '保护层', A: Math.min(2.0, (params.c_nom / 0.05) * 1.2) },
                      ]}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 2]} tick={false} axisLine={false} />
                        <Radar name="MC2010 Engine" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 text-[10px] font-mono space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>有效配筋率 (ρ_eff):</span>
                    <span className="font-bold text-sky-400">{(params.As_ratio / Math.max(0.1, 2.5 * (1 - 0.9))).toFixed(2)} %</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>规范计算依据:</span>
                    <span className="font-bold text-indigo-400">MC2010 / GB 50010</span>
                  </div>
                </div>
              </div>

            </div>

            {/* AI & Mechanics Joint Decision Protocol */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 relative overflow-hidden">
               <div className="flex items-center space-x-3 mb-4 border-b border-slate-800 pb-3">
                  <div className="w-8 h-8 bg-sky-500/10 flex items-center justify-center rounded-xl border border-sky-500/20">
                     <FileText className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 italic">衬砌结构破坏诊断与加固决策协议 (MC2010 Decision)</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Structural Damage Assessment & Maintenance Recommendations</p>
                  </div>
               </div>
               <div className="flex items-start space-x-6">
                 <p className="text-xs leading-relaxed text-slate-300 font-medium tracking-wide flex-1 italic">
                    {results.w_max > 0.4 ? (
                      `【高危预警】实测及计算最大特征裂缝宽度 w_max = ${results.w_max.toFixed(3)} mm，已超过规范严重开裂极限 0.40 mm。受拉钢筋应力达到 ${results.sigma_s_MPa.toFixed(1)} MPa。建议处置措施：1. 立即实施裂缝表面封闭与高聚物/环氧树脂注浆灌缝；2. 针对衬砌背后实施回填注浆，降低偏心弯矩；3. 必要时增设型钢拱架或二次衬砌套拱加固。`
                    ) : results.w_max > 0.2 ? (
                      `【耐久性预警】最大特征裂缝宽度 w_max = ${results.w_max.toFixed(3)} mm，处于 0.20 mm ~ 0.40 mm 区间，接近规范控制限值。建议处置措施：1. 涂覆柔性防水涂层与裂缝表层树脂封闭，防止地下水入渗引起钢筋锈蚀；2. 加设多点位位移与裂缝计进行连续监测。`
                    ) : (
                      `【状态正常】最大特征裂缝宽度 w_max = ${results.w_max.toFixed(3)} mm，低于 0.20 mm 限值，衬砌结构整体处于微裂缝或弹性工作状态，符合 GB50010 及 MC2010 耐久性设计要求，建议维持日常巡检。`
                    )}
                 </p>
                 <div className="w-36 flex flex-col items-center justify-center p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl text-center font-mono">
                    <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">评估结论</div>
                    <div className={`text-sm font-bold uppercase ${results.w_max > 0.4 ? 'text-rose-400' : results.w_max > 0.2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {results.w_max > 0.4 ? '严重开裂' : results.w_max > 0.2 ? '开裂预警' : '结构安全'}
                    </div>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TunnelAnalysis;
