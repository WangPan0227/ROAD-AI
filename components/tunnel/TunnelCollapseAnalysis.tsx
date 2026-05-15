import React, { useState } from 'react';
import { ShieldAlert, Activity, Settings, AlertTriangle, Rocket, Box } from 'lucide-react';
import { calculate_tunnel_collapse } from '../../lib/tunnelCalculations';

const TunnelCollapseAnalysis: React.FC = () => {
  const [params, setParams] = useState(() => {
    const pendingLoad = typeof window !== 'undefined' ? localStorage.getItem('roadbedguard_pending_tunnel_collapse_load') : null;
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('roadbedguard_pending_tunnel_collapse_load');
        }
        return loadedParams;
      } catch (e) {
        console.error("历史数据载入失败", e);
      }
    }
    return {
      B: 10.0,
      Ht: 7.0,
      f: 0.8,
      collapse_length: 15.0
    };
  });
  const [results, setResults] = useState<any>(() => calculate_tunnel_collapse(params));
  const [isCalculating, setIsCalculating] = useState(false);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const res = calculate_tunnel_collapse(params);
      setResults(res);
      setIsCalculating(false);
    }, 600);
  };

  /*
  const getStatusColor = (ratio: number) => {
    if (ratio > 70) return 'text-red-500';
    if (ratio > 30) return 'text-orange-500';
    return 'text-emerald-500';
  };

  const getIntensityText = (ratio: number) => {
    if (ratio > 80) return 'CRITICAL_MAX_BLOCK';
    if (ratio > 30) return 'MEDIUM_OBSTRUCTION';
    return 'LOW_IMPACT_FRAG';
  };
  */

  return (
    <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧侧边栏 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden relative shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2 text-red-600" /> 坍塌规模仿真配置
            </h3>
          </div>
          
          <div className="flex-1 p-5 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Parameters */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest flex items-center">
                地质与几何参数
              </h4>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 relative overflow-hidden group">
                  <label className="block text-[10px] text-gray-500 uppercase mb-2 font-bold">普氏坚固系数 f</label>
                  <input type="number" step="0.1" className="w-full bg-white border border-gray-200 rounded-sm p-2.5 text-lg font-bold font-mono text-red-600 outline-none focus:border-red-500" value={params.f} onChange={e => updateParam('f', parseFloat(e.target.value))} />
                  <p className="mt-2 text-[8px] text-gray-400 leading-tight font-medium italic">极软弱(0.5) / 中等(1.0) / 坚硬(2.0+)</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                  <label className="block text-[10px] text-gray-500 uppercase mb-2 font-bold">隧道开挖宽度 B (m)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-sm font-medium text-gray-800" value={params.B} onChange={e => updateParam('B', parseFloat(e.target.value))} />
                </div>

                <div className="bg-gray-50 p-4 rounded-sm border border-gray-200">
                  <label className="block text-[10px] text-gray-500 uppercase mb-2 font-bold">纵向坍塌长度 (m)</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-sm p-2 text-sm font-medium text-gray-800" value={params.collapse_length} onChange={e => updateParam('collapse_length', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={runAnalysis} disabled={isCalculating}
              className={`w-full py-3 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-sm ${isCalculating ? 'bg-gray-200 text-gray-500' : 'bg-red-600 hover:bg-red-700 text-white'}`}
            >
              {isCalculating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>SIMULATING...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-3" />
                  <span>执行坍塌动态推演</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧主视口 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="h-14 border-b border-gray-200 px-8 flex items-center justify-between bg-white relative z-20 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-50 rounded-sm border border-red-100">
                <Box className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 tracking-tight uppercase">隧道冒顶、坍塌与封堵灾毁评估系统</h2>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PROTODYAKONOV ARCH THEORY // V3.2</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar relative z-10">
            {!results ? null : (
              <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Result Dash Cards */}
                <div className="grid grid-cols-4 gap-6 font-mono">
                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">普氏拱高度 hq</div>
                    <div className="flex items-baseline space-x-2">
                       <div className="text-3xl font-bold text-red-600 tracking-tighter">{results.hq.toFixed(2)}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase">M</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">坍塌总体积</div>
                    <div className="flex items-baseline space-x-2">
                       <div className="text-3xl font-bold text-gray-900 tracking-tighter">{Math.round(results.volume).toLocaleString()}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase">m³</div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-sm border border-gray-200 shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">断面封堵率</div>
                    <div className="flex items-baseline space-x-2">
                       <div className={`text-3xl font-bold tracking-tighter ${results.blockage_ratio > 70 ? 'text-red-600' : 'text-blue-700'}`}>
                          {results.blockage_ratio.toFixed(1)}%
                       </div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase">EFF</div>
                    </div>
                  </div>

                  <div className={`p-5 rounded-sm border flex flex-col justify-center shadow-sm ${results.blockage_ratio > 70 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200'}`}>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">灾害分级 (Tier)</div>
                    <div className={`text-xl font-bold tracking-tight italic ${results.blockage_ratio > 70 ? 'text-red-600' : 'text-orange-600'}`}>
                       {results.blockage_ratio > 70 ? 'CRITICAL_BLOCKAGE' : 'PARTIAL_COLLAPSE'}
                    </div>
                  </div>
                </div>

                <div className={`p-8 rounded-sm border relative overflow-hidden shadow-sm transition-all ${results.blockage_ratio > 50 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="relative z-10 flex items-start space-x-6">
                       <div className={`p-4 rounded-sm shadow-sm ${results.blockage_ratio > 50 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                          <AlertTriangle className={`w-10 h-10 ${results.blockage_ratio > 80 ? 'animate-bounce' : ''}`} />
                       </div>
                       <div className="flex-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 block ${results.blockage_ratio > 50 ? 'text-red-700' : 'text-orange-700'}`}>通行中断与灾毁级别实时判定 (Real-time Alert)</span>
                          <h3 className={`text-xl font-bold tracking-tight leading-snug uppercase italic ${results.blockage_ratio > 50 ? 'text-red-900 border-l-4 border-red-500 pl-4' : 'text-orange-900 border-l-4 border-orange-500 pl-4'}`}>
                            {results.blockage_ratio > 80 
                              ? '已监测到特大坍塌，断面完全封堵，结构整体失稳 // 红色等级' 
                              : (results?.blockage_ratio ?? 0) > 30 
                                ? '局部冒顶已侵入建筑限界，通行受阻 // 橙色等级' 
                                : '低强度掉块，普氏拱尚未成型 // 黄色等级'}
                          </h3>
                       </div>
                       <div className="flex flex-col items-center bg-white p-4 rounded-sm border border-gray-200 shadow-sm w-32">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">安全指数</span>
                          <div className={`text-3xl font-bold font-mono ${results.blockage_ratio > 70 ? 'text-red-600' : 'text-emerald-600'}`}>
                             {Math.max(0, 100 - (results?.blockage_ratio ?? 0)).toFixed(1)}
                          </div>
                       </div>
                    </div>
                </div>

                {/* Physics Visualization */}
                <div className="bg-white rounded-sm border border-gray-200 p-10 shadow-sm flex flex-col items-center justify-center relative overflow-hidden min-h-[440px]">
                   <div className="absolute top-6 left-10 flex items-center space-x-2">
                       <div className="w-2 h-2 bg-red-600 rounded-full" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">普氏拱坍落与断面封堵仿真 (Physics View)</span>
                   </div>

                   <div className="relative w-full max-w-lg h-72 bg-gray-50 rounded-sm shadow-inner overflow-hidden flex items-end justify-center border border-gray-200">
                      {/* Scale Grid Layers */}
                      <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                      
                      {/* Tunnel Arch Outline - Realistic */}
                      <div className="absolute w-[300px] h-[150px] border-2 border-gray-300 rounded-t-full bottom-0 left-1/2 -translate-x-1/2 bg-gray-100 z-0">
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-200/50 to-transparent" />
                      </div>
                      
                      {/* Debris Pile (Realistic textures) */}
                      <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full z-10 pointer-events-none">
                         <defs>
                            <pattern id="debrisPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                               <path d="M 0 15 L 15 0 L 30 15 L 15 30 Z" fill="#94a3b8" opacity="0.4" />
                               <path d="M 5 5 L 10 0 L 15 5 Z" fill="#64748b" opacity="0.6" />
                            </pattern>
                         </defs>
                         <path 
                           d={`M ${250 - 150} 300 Q 250 ${300 - (results.blockage_ratio/100 * 200)} ${250 + 150} 300`} 
                           transform="translate(150, 0)"
                           fill="url(#debrisPattern)"
                           stroke="#475569"
                           strokeWidth="1"
                           className="transition-all duration-1000"
                         />
                      </svg>
                      
                      {/* Protodyakonov's Arch Trace */}
                      <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full z-5 pointer-events-none">
                         <path 
                           d={`M ${250 - 150} 288 Q 250 ${288 - (results.hq * 20) - 150} ${250 + 150} 288`} 
                           transform="translate(150, 0)"
                           fill="none"
                           stroke="#ef4444"
                           strokeWidth="2"
                           strokeDasharray="6 4"
                           opacity="0.6"
                           className="transition-all duration-1000"
                         />
                      </svg>
                   </div>
                   
                   <div className="mt-8 flex justify-between items-center w-full max-w-lg bg-gray-50 p-4 border border-gray-100 rounded-sm">
                      <div className="flex items-center space-x-3 text-red-600">
                         <div className="w-2 h-2 bg-red-600 rounded-full" />
                         <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Simulation Params: f={params.f} // B={params.B}m</p>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Arch_Height: <span className="text-gray-900">{results.hq.toFixed(2)}m</span>
                      </div>
                   </div>
                </div>

                {/* Expert Recovery SOP */}
                <div className="space-y-4">
                   <div className="flex items-center space-x-2 pl-2 border-l-4 border-blue-600">
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">应急处治与灾损修复决策 (Recovery SOP Matrix)</h3>
                   </div>
                   <div className="grid grid-cols-3 gap-6 font-sans">
                      <div className="bg-white border border-gray-200 p-5 rounded-sm shadow-sm relative group hover:border-blue-500 transition-all">
                         <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center">
                            <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mr-2 text-[10px]">01</span> PHASE: STABILIZE
                         </div>
                         <p className="text-xs leading-relaxed text-gray-600 font-medium tracking-tight">
                           立即启动“超前大管棚”预支护，向塌体顶部注入改性水泥浆，形成人工拱圈，隔离松散岩体。
                         </p>
                      </div>
                      <div className="bg-white border border-gray-200 p-5 rounded-sm shadow-sm relative group hover:border-orange-500 transition-all">
                         <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center">
                            <span className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center mr-2 text-[10px]">02</span> PHASE: REMOVE
                         </div>
                         <p className="text-xs leading-relaxed text-gray-600 font-medium tracking-tight">
                           在预支护保护下，遵循“短进尺、弱爆破”原则，分步清理塌方物质，实时监测二衬偏心增量。
                         </p>
                      </div>
                      <div className="bg-white border border-gray-200 p-5 rounded-sm shadow-sm relative group hover:border-emerald-500 transition-all">
                         <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center">
                            <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center mr-2 text-[10px]">03</span> PHASE: RESTORE
                         </div>
                         <p className="text-xs leading-relaxed text-gray-600 font-medium tracking-tight">
                            针对坍塌区段，增加I22b型钢拱架进行永久加固，并配合压力回填注浆，确保衬砌与围岩密贴。
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

export default TunnelCollapseAnalysis;
