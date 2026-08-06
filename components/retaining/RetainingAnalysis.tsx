import React, { useState, useEffect } from 'react';
import { 
  Activity, Zap, Settings, Rocket, 
  ShieldCheck, Brain, Cpu
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer
} from 'recharts';
import { 
  calculate_coulomb_retaining_wall, 
  CoulombRetainingParams 
} from '../../lib/retainingCalculations';
import { KPICard } from '../common/KPICard';

const RetainingAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState<CoulombRetainingParams>(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_retaining_load') : null;
    if (pendingLoad) {
      try {
        const parsed = JSON.parse(pendingLoad);
        if (parsed.H) {
          return {
            H: parsed.H ?? 6.0,
            B_top: parsed.B_top ?? 1.0,
            B: parsed.B ?? parsed.wall_width ?? 3.5,
            gamma: parsed.gamma ?? 19.0,
            phi: parsed.phi ?? 30.0,
            delta: parsed.delta ?? 15.0,
            alpha: parsed.alpha ?? 80.0,
            beta: parsed.beta ?? 10.0,
            mu: parsed.mu ?? parsed.friction_base ?? 0.4,
            gamma_c: parsed.gamma_c ?? 23.0,
          };
        }
      } catch (e) {
        console.error("Failed to parse retaining load", e);
      }
    }
    return {
      H: 6.0,
      B_top: 1.0,
      B: 3.5,
      gamma: 19.0,
      phi: 30.0,
      delta: 15.0,
      alpha: 80.0,
      beta: 10.0,
      mu: 0.4,
      gamma_c: 23.0,
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_retaining_load')) {
         localStorage.removeItem('roadbedguard_pending_retaining_load');
      }
      const pending = localStorage.getItem('pending_injected_disease_retaining_structure');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.injectedParameters) {
            const { delta_water, mu_factor } = parsed.injectedParameters;
            if (delta_water !== undefined) setWaterDepth(delta_water);
            if (mu_factor !== undefined) {
              setParams(prev => ({ ...prev, mu: 0.4 * mu_factor }));
            }
            localStorage.removeItem('pending_injected_disease_retaining_structure');
          }
        } catch (e) {
          console.error("Error reading pending retaining disease", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const results = calculate_coulomb_retaining_wall(params);

  const updateParam = (key: keyof CoulombRetainingParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
    }, 200);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* LEFT: Parameters Input Matrix */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-900/90">
            <span className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-sky-400" /> 参数输入矩阵 (Coulomb Params)
            </span>
          </div>
          
          <div className="flex-1 pt-3 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {/* Geometry */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              挡土墙几何形貌 Geometry
            </div>
            <div className="space-y-2 text-xs">
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">墙身高度 H (m)</label>
                 <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.H} onChange={e => updateParam('H', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">墙顶宽度 B_top (m)</label>
                 <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.B_top} onChange={e => updateParam('B_top', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">墙底宽度 B (m)</label>
                 <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.B} onChange={e => updateParam('B', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">墙背倾角 α (°)</label>
                 <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.alpha} onChange={e => updateParam('alpha', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">填土坡角 β (°)</label>
                 <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.beta} onChange={e => updateParam('beta', parseFloat(e.target.value) || 0)} />
               </div>
            </div>

            {/* Geotechnical & Material */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
              岩土及墙体物理参数 Material
            </div>
            <div className="space-y-2 text-xs">
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">填土重度 γ (kN/m³)</label>
                 <input type="number" step="0.1" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.gamma} onChange={e => updateParam('gamma', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">内摩擦角 φ (°)</label>
                 <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.phi} onChange={e => updateParam('phi', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">墙背摩擦角 δ (°)</label>
                 <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.delta} onChange={e => updateParam('delta', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">基底摩擦系数 μ</label>
                 <input type="number" step="0.01" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" value={params.mu ?? 0.4} onChange={e => updateParam('mu', parseFloat(e.target.value) || 0)} />
               </div>
               <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                 <label className="text-slate-300 font-medium">混凝土重度 γc (kN/m³)</label>
                 <input type="number" step="0.5" className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-slate-200 font-mono text-xs font-bold focus:outline-none" value={params.gamma_c ?? 23.0} onChange={e => updateParam('gamma_c', parseFloat(e.target.value) || 0)} />
               </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button 
              onClick={runAnalysis}
              disabled={isCalculating}
              className={`w-full bg-sky-600 hover:bg-sky-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center space-x-2 ${
                isCalculating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCalculating ? <Activity className="animate-spin h-4 w-4" /> : <Rocket className="h-4 w-4" />}
              <span>{isCalculating ? 'SOLVING...' : '执行双驱动计算 SOLVE'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Main Dashboard Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-5">
          <header className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                    <ShieldCheck className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-100 tracking-wider uppercase">场景 1.3：支挡失效 | 库仑主动土压力 + 完整神经网络 (ANN) 双驱动引擎</h2>
                  <p className="text-[10px] text-slate-400 font-mono">Coulomb Earth Pressure & MLP Neural Network Model</p>
                </div>
            </div>
            {results && (
              <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${results.status === 'critical' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse' : results.status === 'warning' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'}`}>
                  {results.status === 'critical' ? 'CRITICAL: 失稳高风险' : results.status === 'warning' ? 'WARNING: 边缘状态' : 'NOMINAL: 稳态'}
              </div>
            )}
          </header>

          <main className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1 pb-10">
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Activity className="w-12 h-12 mb-4 animate-pulse" />
                <p className="text-xs font-mono tracking-widest uppercase">Dispatcher Idle: Awaiting Parameters...</p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-700">
                
                {/* 核心双驱动指标看板 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard
                    title="抗滑移安全系数 (Ks)"
                    value={results.Ks.toFixed(3)}
                    subtitle="规范目标 ≥ 1.300"
                    status={results.Ks < 1.3 ? 'critical' : 'safe'}
                  />
                  <KPICard
                    title="神经网络预测 (Fs_ANN)"
                    value={results.Fs_ANN.toFixed(3)}
                    subtitle="MLP 8-16-8-1 深度推理"
                    status={results.Fs_ANN < 1.3 ? 'warning' : 'safe'}
                  />
                  <KPICard
                    title="双驱动对齐偏差 Error"
                    value={`${results.error_pct.toFixed(2)}%`}
                    subtitle={results.error_pct < 10 ? "物理与AI高精度收敛" : "高阶非线性响应"}
                    status={results.error_pct > 15 ? 'warning' : 'safe'}
                  />
                  <KPICard
                    title="抗倾覆安全系数 (K0)"
                    value={results.K0.toFixed(3)}
                    subtitle="规范目标 ≥ 1.600"
                    status={results.K0 < 1.6 ? 'warning' : 'safe'}
                  />
                </div>

                {/* 库仑土压力分量解耦 */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5">
                  <div className="pb-3 mb-4 border-b border-slate-800 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                      <Zap className="w-3.5 h-3.5 mr-2 text-sky-400" /> 库仑理论土压力及作用分量 Coulomb Mechanics Matrix
                    </h4>
                    <span className="text-xs font-mono text-sky-400 font-bold">Ka = {results.Ka.toFixed(4)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">主动土压力合力 Pa</div>
                      <div className="text-xl font-bold text-slate-100 font-mono">{results.Pa.toFixed(2)} <span className="text-xs text-slate-400 font-normal">kN/m</span></div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] text-sky-400 font-bold uppercase mb-1">水平分量 Pax</div>
                      <div className="text-xl font-bold text-sky-400 font-mono">{results.Pax.toFixed(2)} <span className="text-xs text-slate-400 font-normal">kN/m</span></div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] text-indigo-400 font-bold uppercase mb-1">竖向分量 Pay</div>
                      <div className="text-xl font-bold text-indigo-400 font-mono">{results.Pay.toFixed(2)} <span className="text-xs text-slate-400 font-normal">kN/m</span></div>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">墙体自重 W</div>
                      <div className="text-xl font-bold text-slate-100 font-mono">{results.W.toFixed(2)} <span className="text-xs text-slate-400 font-normal">kN/m</span></div>
                    </div>
                  </div>
                </div>

                {/* 科学可视化与物理几何示图 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* Left 2 Cols: Interactive 2D Mechanical Vector Canvas */}
                  <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-4 bg-sky-500 rounded-full" />
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">库仑体受力矢量动态分析 (Coulomb Stress Diagram)</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">α={params.alpha}° | β={params.beta}° | δ={params.delta}°</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative py-4 bg-slate-950 rounded-xl border border-slate-800">
                      <svg width="520" height="320" viewBox="0 0 520 320" className="w-full h-auto max-h-[280px]">
                        <defs>
                          <marker id="coulombArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
                          </marker>
                          <marker id="weightArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#f8fafc" />
                          </marker>
                          <pattern id="soilGrid" width="12" height="12" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="12" x2="12" y2="0" stroke="#1e293b" strokeWidth="1" />
                          </pattern>
                        </defs>

                        {/* Ground Base */}
                        <line x1="20" y1="270" x2="500" y2="270" stroke="#334155" strokeWidth="2" strokeDasharray="4 2" />

                        {/* Retaining Wall Body */}
                        <polygon 
                          points={`140,270 ${140 + params.B * 25},270 ${140 + params.B_top * 25},${270 - params.H * 25} 140,${270 - params.H * 25}`} 
                          fill="#1e293b" 
                          stroke="#475569" 
                          strokeWidth="2" 
                        />
                        <text x={145} y={270 - params.H * 12} className="text-[10px] fill-slate-300 font-mono font-bold">挡土墙 (Wall)</text>

                        {/* Soil Backfill */}
                        <polygon 
                          points={`${140 + params.B * 25},270 480,270 480,${270 - params.H * 25 - 20} ${140 + params.B_top * 25},${270 - params.H * 25}`} 
                          fill="url(#soilGrid)" 
                          stroke="#334155" 
                          strokeWidth="1" 
                        />
                        <text x={320} y={270 - params.H * 10} className="text-[10px] fill-amber-400 font-mono font-bold">库仑填土楔体 (Backfill)</text>

                        {/* Force Vector W (Weight) */}
                        <g transform={`translate(${140 + (params.B_top + params.B) * 12.5}, ${270 - params.H * 12.5})`}>
                          <circle r="4" fill="#f8fafc" />
                          <line x1="0" y1="0" x2="0" y2="60" stroke="#f8fafc" strokeWidth="2" markerEnd="url(#weightArrow)" />
                          <text x="8" y="55" className="text-[10px] fill-slate-100 font-mono font-bold">W={results.W.toFixed(1)}kN</text>
                        </g>

                        {/* Active Earth Pressure Vector Pa */}
                        <g transform={`translate(${140 + params.B * 25}, ${270 - (params.H * 25) / 3})`}>
                          <circle r="4" fill="#38bdf8" />
                          <line x1="70" y1="-20" x2="5" y2="-2" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#coulombArrow)" />
                          <text x="75" y="-20" className="text-[11px] fill-sky-400 font-mono font-bold">Pa={results.Pa.toFixed(1)}kN</text>
                        </g>

                        {/* Dimensions Annotation */}
                        <text x={120} y={270 - (params.H * 25) / 2} className="text-[10px] fill-sky-400 font-bold font-mono">H={params.H}m</text>
                        <text x={140 + (params.B * 25) / 2} y={288} className="text-[10px] fill-sky-400 font-bold font-mono text-center">B={params.B}m</text>
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800 mt-2">
                      <span>• 库仑公式计算基础: 沿墙背滑移面受力平衡</span>
                      <span>• 神经网络训练集: 10,000+ 样本数据超平面收敛</span>
                    </div>
                  </div>

                  {/* Right 1 Col: Radar Envelope Analysis */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">
                        双引擎多维评估包络 Radar
                      </div>
                      <div className="h-[210px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={[
                            { subject: 'Ks(抗滑)', A: Math.min(2.0, results.Ks) },
                            { subject: 'Fs_ANN', A: Math.min(2.0, results.Fs_ANN) },
                            { subject: 'K0(抗倾)', A: Math.min(2.0, results.K0) },
                            { subject: 'Ka(土压)', A: Math.min(2.0, 1 / Math.max(0.1, results.Ka)) },
                            { subject: '对齐精度', A: Math.max(0.5, 2.0 - results.error_pct / 10) },
                          ]}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 2]} tick={false} axisLine={false} />
                            <Radar name="Coulomb Engine" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 text-[10px] font-mono space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>物理建模 (Mechanics):</span>
                        <span className="font-bold text-sky-400">Coulomb Ka</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>AI 神经网络 (MLP):</span>
                        <span className="font-bold text-indigo-400">ANN JSON v1.0</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* AI & Mechanics Joint Decision Protocol */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                   <div className="flex items-center space-x-3 mb-3 border-b border-slate-800 pb-3">
                      <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
                         <Brain className="w-4 h-4 text-sky-400" />
                      </div>
                      <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">支挡结构双驱动综合研判与工程建议 (Dual-Engine Engineering Verdict)</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Physical Coulomb Theory × Neural Network Deep Inference</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="md:col-span-2 space-y-2">
                       <p className="text-xs leading-relaxed text-slate-300 font-mono">
                         {results.status === 'critical' 
                           ? '⚠️ 警告: 库仑主动土压力推力较大或墙身底宽不足，结构抗滑移/抗倾覆安全系数低于安全门限 (Ks < 1.0 或 K0 < 1.2)。建议增加墙底宽度 B，或增设预应力锚索与墙趾防滑坎。'
                           : results.status === 'warning'
                           ? '⚡ 提示: 结构处于临界边缘状态 (Ks < 1.3 或 K0 < 1.6)。神经网络与力学求解器显示滑动风险趋近阈值，建议加强墙背排水并定期进行几何位移监测。'
                           : '✅ 正常: 库仑力学计算与神经网络 Fs 预测均满足规范安全裕度需求，整体支挡结构稳态指标良好。'}
                       </p>
                       <div className="text-[10px] text-slate-400 font-mono">
                         输入向量: [H={params.H}, B_top={params.B_top}, B={params.B}, γ={params.gamma}, φ={params.phi}, δ={params.delta}, α={params.alpha}, β={params.beta}]
                       </div>
                     </div>

                     <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl flex flex-col justify-center text-center">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ANN 预测结果 (Fs_ANN)</span>
                       <span className="text-xl font-black text-indigo-400 font-mono my-1">{results.Fs_ANN.toFixed(3)}</span>
                       <span className="text-[10px] font-bold text-emerald-400 font-mono">对齐误差 {results.error_pct.toFixed(2)}%</span>
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
