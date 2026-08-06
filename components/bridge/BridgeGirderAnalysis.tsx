import React, { useState } from 'react';
import { Activity, Settings, Zap, Rocket, AlertTriangle } from 'lucide-react';
import { calculate_girder_unseating, SeismicGirderParams } from '../../lib/bridgeCalculations';
import { KPICard } from '../common/KPICard';

const BridgeGirderAnalysis: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [params, setParams] = useState<SeismicGirderParams>(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_bridge_girder_load') : null;
    if (pendingLoad) {
      try {
        const parsed = JSON.parse(pendingLoad);
        return {
          span: parsed.span || parsed.span_length || 30,
          mass: parsed.mass || 800,
          K_total: parsed.K_total || 50,
          support_length: parsed.support_length || parsed.support_length_mm || 800,
          bridge_class: parsed.bridge_class || 'A',
          site_class: parsed.site_class || 'III',
          intensity: parsed.intensity || 7
        };
      } catch (e) {
        console.error("Failed to parse bridge girder load", e);
      }
    }
    return {
      span: 30,           // 主梁跨径 L (m)
      mass: 800,          // 墩梁上部质量 M (t)
      K_total: 50,        // 支座/墩柱总刚度 K_total (kN/mm)
      support_length: 800,// 盖梁实际有效支撑长度 Na (mm)
      bridge_class: 'A',  // 桥梁类别
      site_class: 'III',  // 场地类别
      intensity: 7        // 烈度
    };
  });

  const [results, setResults] = useState(() => {
    const res = calculate_girder_unseating(params);
    if (typeof window !== 'undefined' && localStorage.getItem('roadbedguard_pending_bridge_girder_load')) {
       localStorage.removeItem('roadbedguard_pending_bridge_girder_load');
    }
    return res;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const pending = localStorage.getItem('pending_injected_disease_girder_unseating');
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.injectedParameters) {
            const { intensity_boost, support_loss } = parsed.injectedParameters;
            setParams(prev => {
              const next = {
                ...prev,
                intensity: Math.min(9, 7 + (intensity_boost || 0)),
                support_length: Math.max(300, 800 - (support_loss || 0))
              };
              setResults(calculate_girder_unseating(next));
              return next;
            });
            localStorage.removeItem('pending_injected_disease_girder_unseating');
          }
        } catch (e) {
          console.error("Error reading girder unseating disease", e);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateParam = (key: keyof SeismicGirderParams, value: any) => {
    setParams(prev => {
      const next = { ...prev, [key]: value };
      setResults(calculate_girder_unseating(next));
      return next;
    });
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_girder_unseating(params);
      setResults(res);
      setIsCalculating(false);
    }, 150);
  };

  const { T, Sa, delta_rel, Na_actual, Na_req, SF, Ci, Cs, status } = results;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans overflow-hidden p-6">
      <div className="flex-1 flex overflow-hidden gap-6">
        {/* 左侧参数区 */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex flex-col overflow-hidden relative flex-shrink-0">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-slate-900/90">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-sky-400" /> 结构与抗震边界参数
            </span>
          </div>
          
          <div className="flex-1 pt-3 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {/* 1. 结构几何与质量刚度 */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">结构体系参数</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">主梁跨径 L (m)</label>
                <input 
                  type="number" step="1"
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" 
                  value={params.span} 
                  onChange={e => updateParam('span', parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">墩梁上部质量 M (t)</label>
                <input 
                  type="number" step="10"
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" 
                  value={params.mass} 
                  onChange={e => updateParam('mass', parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">总刚度 K_total (kN/mm)</label>
                <input 
                  type="number" step="1"
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" 
                  value={params.K_total} 
                  onChange={e => updateParam('K_total', parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
                <label className="text-slate-300 font-medium">支撑长度 Na (mm)</label>
                <input 
                  type="number" step="10"
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-sky-400 font-mono text-xs font-bold focus:outline-none" 
                  value={params.support_length} 
                  onChange={e => updateParam('support_length', parseFloat(e.target.value) || 0)} 
                />
              </div>
            </div>

            {/* 2. 抗震设防与场地条件 */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">抗震设防与场地条件</div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">桥梁工程类别</label>
                <select 
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  value={params.bridge_class}
                  onChange={e => updateParam('bridge_class', e.target.value as any)}
                >
                  <option value="A">A类 (特大桥/重要桥梁, Ci=1.70)</option>
                  <option value="B_express">B类 (高速/一级公路, Ci=1.70)</option>
                  <option value="B_normal">B类 (二级公路, Ci=1.30)</option>
                  <option value="C">C类 (三/四级公路, Ci=1.00)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">场地工程类别</label>
                <select 
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  value={params.site_class}
                  onChange={e => updateParam('site_class', e.target.value as any)}
                >
                  <option value="I">I 类场地 (坚硬岩石, Cs=0.85)</option>
                  <option value="II">II 类场地 (中硬土, Cs=1.00)</option>
                  <option value="III">III 类场地 (软弱土/一般土, Cs=1.25)</option>
                  <option value="IV">IV 类场地 (淤泥/极软土, Cs=1.50)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-xs mb-1 block">地震烈度 (E2设防)</label>
                <select 
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  value={params.intensity}
                  onChange={e => updateParam('intensity', parseInt(e.target.value, 10))}
                >
                  <option value={7}>7度 (0.10g 罕遇地震)</option>
                  <option value={8}>8度 (0.20g 罕遇地震)</option>
                  <option value={9}>9度 (0.40g 罕遇地震)</option>
                </select>
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
              <span>{isCalculating ? 'SOLVING...' : 'E2罕遇地震落梁仿真评估'}</span>
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden space-y-5">
          {/* Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md p-5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                <AlertTriangle className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-100 tracking-wider uppercase">场景 2.2：梁体垮塌 | 梁体垮塌/落梁抗震安全评估</h2>
                <span className="text-[10px] text-slate-400 font-mono">E2 REACTION SPECTRUM MODEL // JTG/T 2231-01-2020</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1 pb-10">
            <div className="space-y-5 animate-in fade-in duration-500">
              {/* 4 Main Parameter KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                  title="垮塌安全系数 (SF)"
                  value={SF.toFixed(2)}
                  subtitle={`状态: ${status === 'safe' ? '安全 (SAFE)' : status === 'warning' ? '预警 (WARNING)' : '危险 (CRITICAL)'}`}
                  status={status === 'safe' ? 'safe' : status === 'warning' ? 'warning' : 'critical'}
                />
                <KPICard
                  title="E2相对位移响应 Δ_rel"
                  value={delta_rel.toFixed(1)}
                  unit="mm"
                  subtitle={`自振周期 T = ${T.toFixed(3)} s`}
                  status="neutral"
                />
                <KPICard
                  title="设计反应谱加速度 S_a"
                  value={Sa.toFixed(2)}
                  unit="m/s²"
                  subtitle={`Ci: ${Ci.toFixed(2)} | Cs: ${Cs.toFixed(2)}`}
                  status="neutral"
                />
                <KPICard
                  title="最小支撑长度 N_a,req"
                  value={Na_req.toFixed(0)}
                  unit="mm"
                  subtitle={`实际支撑 N_a: ${Na_actual.toFixed(0)} mm`}
                  status={Na_actual < Na_req ? 'warning' : 'safe'}
                />
              </div>

              {/* Main Visualization Container */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden min-h-[380px]">
                 <div className="absolute top-4 left-5 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-sky-400 rounded-full" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">E2地震动力位移与支撑边界仿真</span>
                 </div>

                 <svg width="600" height="260" viewBox="0 0 600 260" className="relative z-10">
                    <defs>
                      <marker id="arrow-blue" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
                      </marker>
                      <marker id="arrow-red" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#f43f5e" />
                      </marker>
                    </defs>
                    
                    {/* Floor Baseline */}
                    <line x1="0" y1="220" x2="600" y2="220" stroke="#334155" strokeWidth="1" />
                    
                    {/* Left Fixed Pier */}
                    <g opacity={status === 'critical' ? 0.4 : 1}>
                      <rect x="80" y="110" width="80" height="110" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
                      <rect x="50" y="100" width="140" height="12" fill="#334155" stroke="#475569" strokeWidth="1" rx="1" />
                      <rect x="100" y="93" width="40" height="7" fill="#475569" rx="1" />
                    </g>
                    
                    {/* Right Pier / Cap Beam */}
                    <g>
                      <rect x="420" y="110" width="80" height="110" fill="#1e293b" stroke="#475569" strokeWidth="0.5" />
                      <rect x="380" y="100" width="160" height="12" fill="#334155" stroke="#475569" strokeWidth="1" rx="1" />
                      <rect x="440" y="93" width="40" height="7" fill="#475569" rx="1" />
                      
                      {/* Seismic displacement vector arrow */}
                      <line 
                        x1="460" y1="228" 
                        x2={460 + Math.min(100, delta_rel / 3)} y2="228" 
                        stroke={status === 'critical' ? '#f43f5e' : '#38bdf8'} 
                        strokeWidth="2" 
                        markerEnd={status === 'critical' ? 'url(#arrow-red)' : 'url(#arrow-blue)'} 
                      />
                      <text x="460" y="248" fill={status === 'critical' ? '#f43f5e' : '#38bdf8'} fontSize="9" fontWeight="bold">
                        E2地震相对位移 Δrel = {delta_rel.toFixed(1)} mm
                      </text>
                    </g>

                    {/* Bridge Girder */}
                    <g style={{ transition: 'all 0.8s ease-in-out' }} 
                       transform={`translate(${Math.min(120, delta_rel / 3)}, ${status === 'critical' ? 70 : 0}) rotate(${status === 'critical' ? 14 : 0}, 300, 70)`}>
                      <rect x="90" y="55" width="410" height="38" fill="#1e293b" stroke={status === 'critical' ? '#f43f5e' : '#475569'} strokeWidth="1.5" rx="1" />
                      <line x1="90" y1="74" x2="500" y2="74" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.5" />
                      <text x="295" y="78" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" className="uppercase tracking-[0.2em]">
                        {status === 'critical' ? '⚠️ UNSEATING / GIRDER COLLAPSE RISK' : 'PRESTRESSED CONCRETE BOX GIRDER'}
                      </text>
                    </g>
                    
                    {/* Dimension Lines */}
                    <g fontSize="8" fontWeight="bold" fill="#94a3b8">
                       <line x1="380" y1="20" x2="540" y2="20" stroke="#475569" strokeWidth="0.8" strokeDasharray="2 2" />
                       <text x="460" y="15" textAnchor="middle" fill="#94a3b8">实际支撑长度 Na = {Na_actual.toFixed(0)} mm</text>
                    </g>
                 </svg>
                 
                 <div className="mt-4 flex justify-between items-center bg-slate-800/50 px-6 py-2.5 rounded-xl border border-slate-700/60 w-full max-w-2xl text-xs font-bold text-slate-300">
                    <div className="flex items-center space-x-2">
                       <div className={`w-2.5 h-2.5 rounded-full ${status === 'safe' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-500 animate-pulse'}`} />
                       <span>安全状态评估: {status === 'safe' ? '安全余量充足' : status === 'warning' ? '存在支承预警' : '触发落梁垮塌风险'}</span>
                    </div>
                    <div className="flex items-center space-x-6 font-mono">
                       <div>位移支撑比: <span className={status === 'critical' ? 'text-rose-400 font-bold' : 'text-sky-400'}>{((delta_rel / Math.max(1, Na_actual)) * 100).toFixed(1)}%</span></div>
                       <div className="w-[1px] h-3 bg-slate-700" />
                       <div>安全系数 SF: <span className="text-slate-100 font-bold">{SF.toFixed(2)}</span></div>
                    </div>
                 </div>
              </div>

              {/* AI Recommendation */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                 <div className="flex items-start space-x-4">
                   <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 mt-1">
                      <Zap className="w-5 h-5 text-sky-400" />
                   </div>
                   <div className="flex-1">
                     <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                       抗震防落梁决策建议 (E2 Seismic Retrofit Guidance)
                     </h4>
                     <p className="text-xs leading-relaxed text-slate-300 font-mono">
                       {status === 'critical'
                         ? '🚨 紧急警戒：E2 罕遇地震作用下，相对位移响应已超过盖梁有效支撑长度（SF < 1.0），存在极高落梁垮塌风险！建议方案：1. 盖梁两侧增设拓宽牛腿或钢增设牛腿；2. 节点处安装高强防落梁拉挡块与连杆结构；3. 增设液压黏滞阻力减震器以控制地震位移响应。' 
                         : status === 'warning'
                         ? '⚠️ 结构预警：垮塌安全系数 1.0 ≤ SF < 1.5，罕遇地震下余量偏低。建议方案：1. 检查既有板式橡胶支座限位挡块完好度；2. 增设高拉力钢缆防落梁装置；3. 在盖梁侧面预留减隔震装置安装空间。'
                         : '✅ 结构安全：当前盖梁支撑长度与结构抗震参数满足 E2 罕遇地震防落梁要求（SF ≥ 1.5）。建议保持常规结构健康检测，定期复核支座限位件及纵向拉片锚固状态。'}
                     </p>
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

export default BridgeGirderAnalysis;
