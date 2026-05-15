import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, AreaChart, Area
} from 'recharts';
import { 
  Settings, Layers, CloudRain, AlertTriangle, Hammer, Rocket, Save, Trophy, Zap, ShieldCheck, Activity, Trash2, Edit3, Plus, ArrowRight, Info
} from 'lucide-react';
import { 
  DEFAULT_CONFIG, 
  compute_stability, 
  eval_all_combinations_matrix, 
  get_original_elevation 
} from '../lib/slopeCalculations';

import { Tab, InfrastructureState } from '../types';

const SlopeAnalysis: React.FC<{ activeInfrastructure?: InfrastructureState }> = ({ activeInfrastructure }) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [damageLevel, setDamageLevel] = useState<number>(0);
  const [crackDistance, setCrackDistance] = useState<number>(1.5); // 默认裂缝距边缘1.5m
  const [DAMAGE_MAP, setDamageMap] = useState<Record<number, any>>({
    0: { c_factor: 1.0, phi_factor: 1.0, crack_depth: 0, add_water_pressure: false, desc: "无损伤(设计态)" }
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const savedAtlas = localStorage.getItem('roadbedguard_slope_disease_matrix');
    if (savedAtlas) {
      try {
        const parsed = JSON.parse(savedAtlas);
        const newMap: Record<number, any> = {
          0: { c_factor: 1.0, phi_factor: 1.0, crack_depth: 0, add_water_pressure: false, desc: "无损伤(设计态)" }
        };
        parsed.forEach((p: any) => {
          newMap[p.level] = {
            c_factor: p.schema.c_factor,
            phi_factor: p.schema.phi_factor,
            crack_depth: p.schema.crack_depth,
            add_water_pressure: p.schema.add_water_pressure,
            desc: p.name
          };
        });
        setDamageMap(newMap);
      } catch(e) {
        console.error("加载病害图谱数据失败", e);
      }
    }
  }, []);
  const [hasOptimized, setHasOptimized] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'dashboard' | 'schemes'>('status');

  // Parameters State
  const [slopeParams, setSlopeParams] = useState({
    height: 10.0,
    angle: 45.0,
    soilLayers: [
      { thickness: 5.0, gamma: 18.0, c: 10.0, phi: 15.0 },
      { thickness: 5.0, gamma: 20.0, c: 25.0, phi: 22.0 },
      { thickness: 10.0, gamma: 22.0, c: 50.0, phi: 30.0 }
    ],
    rainfall: 50.0,
    groundwater: 4.0,
    seismicKh: 0.0
  });

  const [segments, setSegments] = useState([
    { 
      id: 'slope-1', 
      name: 'K105+300 右侧边坡',
      params: {
        height: 10.0,
        angle: 45.0,
        soilLayers: [
          { thickness: 5.0, gamma: 18.0, c: 10.0, phi: 15.0 },
          { thickness: 5.0, gamma: 20.0, c: 25.0, phi: 22.0 },
          { thickness: 10.0, gamma: 22.0, c: 50.0, phi: 30.0 }
        ],
        rainfall: 50.0,
        groundwater: 4.0,
        seismicKh: 0.0
      }
    }
  ]);
  const [activeSegmentId, setActiveSegmentId] = useState('slope-1');

  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editSegmentName, setEditSegmentName] = useState('');

  const updateParam = (key: string, value: any) => {
    setSlopeParams(prev => ({ ...prev, [key]: value }));
  };

  // 替换 SlopeAnalysis.tsx 中的这两个函数
  const addSegment = () => {
    const newId = `slope-${segments.length + 1}`;
    const newSegment = {
      id: newId,
      name: `新边坡分段 ${segments.length + 1}`,
      // 使用序列化进行深拷贝，彻底阻断不同边坡之间的状态污染
      params: JSON.parse(JSON.stringify(slopeParams)) 
    };
    setSegments(prev => [...prev, newSegment]);
    setActiveSegmentId(newId);
  };

  const deleteSegment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (segments.length === 1) {
      alert('工作区至少需要保留一个边坡分段！');
      return;
    }
    const newSegments = segments.filter(seg => seg.id !== id);
    setSegments(newSegments);
    if (activeSegmentId === id) {
      setActiveSegmentId(newSegments[0].id);
    }
  };

  const saveSegmentName = (id: string) => {
    if (editSegmentName.trim()) {
      setSegments(prev => prev.map(seg => seg.id === id ? { ...seg, name: editSegmentName } : seg));
    }
    setEditingSegmentId(null);
  };

  // 1. 替换 SlopeAnalysis.tsx 中的 saveCurrentParams 函数
  const saveCurrentParams = () => {
    // 保存到左侧的分段状态中
    setSegments(prev => prev.map(seg => 
      seg.id === activeSegmentId ? { ...seg, params: JSON.parse(JSON.stringify(slopeParams)) } : seg
    ));

    // 打包分析结果，归档至“历史训练库”
    const activeSeg = segments.find(s => s.id === activeSegmentId);
    const historyRecord = {
      id: `hist-${Date.now()}`,
      name: activeSeg ? activeSeg.name : '未命名边坡案例',
      date: new Date().toLocaleString(),
      notes: '暂无备注说明。',
      params: JSON.parse(JSON.stringify(slopeParams)),
      // 提取核心计算结果（如果已经计算过的话）
      results: results ? {
          FS0: results.FS0,
          gap: results.gap,
          circ0: results.circ0,
          // 如果做过正交推演，提取 Rank 1 的方案
          bestScheme: results.all_results?.length > 0 ? results.all_results[0] : null
      } : null
    };

    const existingHistory = JSON.parse(localStorage.getItem('roadbedguard_slope_history') || '[]');
    localStorage.setItem('roadbedguard_slope_history', JSON.stringify([historyRecord, ...existingHistory]));

    alert('案例及分析结果已成功归档至【边坡历史训练库】！');
  };

  // Load params when switching segments
  useEffect(() => {
    const activeSeg = segments.find(s => s.id === activeSegmentId);
    if (activeSeg) {
      setSlopeParams(activeSeg.params);
    }
  }, [activeSegmentId]);

  // 新增：监听跨组件的历史案例载入请求
  useEffect(() => {
    const pendingLoad = localStorage.getItem('roadbedguard_pending_slope_load');
    if (pendingLoad) {
      try {
        const loadedParams = JSON.parse(pendingLoad);
        const newId = `slope-loaded-${Date.now()}`;
        const newSegment = {
          id: newId,
          name: `[历史载入] ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`,
          params: loadedParams
        };
        // 1. 创建新草稿段落
        setSegments(prev => [...prev, newSegment]);
        // 2. 激活新段落
        setActiveSegmentId(newId);
        // 3. 覆盖当前表单参数
        setSlopeParams(loadedParams);
        // 4. 清除缓存，避免重复载入
        localStorage.removeItem('roadbedguard_pending_slope_load');
        // 5. 自动切回状态页并清除旧结果
        setResults(null); 
        setActiveTab('status');
      } catch(e) {
        console.error("历史数据载入失败", e);
      }
    }
  }, []); // 空依赖数组，仅在组件挂载(切换Tab)时触发一次

  const runStatusAnalysis = () => {
    setIsCalculating(true);
    setHasOptimized(false);
    setActiveTab('status');
    
    setTimeout(() => {
      const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      
      cfg.Geometry.H = slopeParams.height;
      cfg.Geometry.beta = slopeParams.angle;
      cfg.Seismic.k_h = slopeParams.seismicKh;
      cfg.Water.has_water = slopeParams.groundwater < slopeParams.height;
      cfg.Water.y_gwt = slopeParams.groundwater;

      let currentElev = slopeParams.height;
      cfg.Geotech.soil_layers = slopeParams.soilLayers.map((layer, idx) => {
        const top_elev = currentElev;
        currentElev -= layer.thickness;
        return {
          top_elev,
          gamma: layer.gamma,
          c: layer.c,
          phi: layer.phi,
          desc: `土层 ${idx + 1}`
        };
      });

      const geom = cfg.Geometry;
      const beta_rad = geom.beta * Math.PI / 180.0;
      const orig_geom = (x: number) => get_original_elevation(x, geom.H, beta_rad);
      
      // 注入从图谱获取的折减系数，以及用户自定义的裂缝水平位置
      cfg.Damage = { ...DAMAGE_MAP[damageLevel], crack_distance: crackDistance };
      const { min_FS: FS0, best_T: T0, best_R: R0, best_slip_depth: slip0, best_circle: circ0 } = compute_stability(orig_geom, geom.H, beta_rad, cfg);
      
      const gap = Math.max(0, cfg.Target.FS_target * T0 - R0);

      setResults({ 
        FS0, 
        T0, 
        R0, 
        gap,
        circ0, 
        slip0,
        all_results: [], 
        cfg 
      });
      setIsCalculating(false);
    }, 500);
  };

  const runOptimization = () => {
    if (!results) return;
    setIsOptimizing(true);
    
    setTimeout(() => {
      const { cfg, T0, R0, slip0, circ0 } = results;
      const geom = cfg.Geometry;
      
      // [新增联动] 动态读取加固措施库中用户自定义的经济工期指标
      const customEco = localStorage.getItem('roadbedguard_slope_economics');
      if (customEco) {
          try {
              cfg.Economics = { ...cfg.Economics, ...JSON.parse(customEco) };
          } catch(e) {
              console.error("读取经济参数失败", e);
          }
      }
      
      const all_results = eval_all_combinations_matrix(geom, cfg, cfg.Target.FS_target, T0, R0, slip0, circ0);

      setResults(prev => ({ ...prev, all_results }));
      setHasOptimized(true);
      setActiveTab('dashboard');
      setIsOptimizing(false);
    }, 800);
  };

  // 替换 SlopeAnalysis.tsx 中的 renderSlope2D 函数
  const renderSlope2D = (p_data: any, circle: [number, number, number], title: string, isOriginal = false, providedFS?: number) => {
    const cfg = results?.cfg || DEFAULT_CONFIG;
    const geom = cfg.Geometry;
    const beta_rad = geom.beta * Math.PI / 180.0;
    const L_slope = geom.H / Math.tan(beta_rad);
    
    // 扩大画布分辨率，提升清晰度
    const width = 600;
    const height = 350;
    const padding = 35; 
    
    const xMin = -5;
    const xMax = L_slope + 10;
    const yMin = -geom.H * 0.6; 
    const yMax = geom.H + 5;
    
    const scaleX = (width - 2 * padding) / (xMax - xMin);
    const scaleY = (height - 2 * padding) / (yMax - yMin);
    const scale = Math.min(scaleX, scaleY);
    
    const cx = (x: number) => padding + (x - xMin) * scale;
    const cy = (y: number) => height - padding - (y - yMin) * scale;

    const x_plot = Array.from({ length: 150 }, (_, i) => xMin + i * (xMax - xMin) / 149);
    const orig_geom = (x: number) => get_original_elevation(x, geom.H, beta_rad);
    
    let curr_surf = orig_geom;
    if (p_data && p_data.type === 'cut') {
      const beta_new = Math.atan(1.0 / p_data.ratio);
      curr_surf = (x: number) => Math.min(orig_geom(x), get_original_elevation(x, geom.H, beta_new));
    } else if (p_data && p_data.type === 'berm') {
      curr_surf = (x: number) => Math.max(orig_geom(x), x <= p_data.B ? p_data.H : Math.max(0, p_data.H - (x - p_data.B) * Math.tan(beta_rad)));
    }

    const origPoints = x_plot.map(x => `${cx(x)},${cy(orig_geom(x))}`).join(' ');
    const currPoints = x_plot.map(x => `${cx(x)},${cy(curr_surf(x))}`).join(' ');
    const clipPolygon = `${cx(xMin)},${cy(yMin)} ${cx(xMin)},${cy(curr_surf(xMin))} ${currPoints} ${cx(xMax)},${cy(curr_surf(xMax))} ${cx(xMax)},${cy(yMin)}`;

    const [Xc, Yc, R] = circle;
    const theta = Array.from({ length: 150 }, (_, i) => Math.PI + i * Math.PI / 149);
    // 提取底层传来的截断坐标 x_end (如果没有则默认一直画到坡顶最右侧)
    const x_end_limit = circle.length > 3 ? circle[3] : xMax;
    const circCoords = theta.map(t => ({ x: Xc + R * Math.cos(t), y: Yc + R * Math.sin(t) }))
                            .filter(p => p.y <= curr_surf(p.x) && p.x >= xMin && p.x <= x_end_limit);
    const circPoints = circCoords.map(p => `${cx(p.x)},${cy(p.y)}`).join(' ');

    const layerColors = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8']; // Cyber Greys
    
    // 尝试从多种途径获取正确的 FS 值进行显示
    let displayFS = providedFS;
    if (!displayFS && p_data?.FS) displayFS = p_data.FS;
    if (!displayFS && isOriginal) displayFS = results.FS0;

    return (
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 flex flex-col items-center w-full overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
        <div className="w-full bg-slate-900 border-b border-slate-800 py-3 px-5 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${displayFS && displayFS < cfg.Target.FS_target ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              <h4 className="font-bold text-slate-300 text-[10px] uppercase tracking-[0.2em]">{title}</h4>
            </div>
            {displayFS && (
                <div className="flex flex-col items-end">
                   <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Safety Factor</span>
                   <span className={`text-sm font-black font-mono ${displayFS < cfg.Target.FS_target ? 'text-red-400' : 'text-emerald-400'}`}>
                      {displayFS.toFixed(3)}
                   </span>
                </div>
            )}
        </div>
        
        <div className="p-4 w-full flex justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03]" />
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible" style={{maxHeight: '350px'}}>
            <defs>
                {/* 工程网格背景 */}
                <pattern id="grid-slope" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                </pattern>
                
                <linearGradient id="failureGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                </linearGradient>

                <filter id="glow-slope">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                <clipPath id={`slope-clip-${title.replace(/[^a-zA-Z0-9]/g, '')}`}>
                <polygon points={clipPolygon} />
                </clipPath>
            </defs>

            {/* 画网格 */}
            <rect width={width} height={height} fill="url(#grid-slope)" />

            {/* 1. 渲染多层土 & 注记 */}
            <g clipPath={`url(#slope-clip-${title.replace(/[^a-zA-Z0-9]/g, '')})`}>
                {cfg.Geotech.soil_layers.map((layer: any, idx: number) => {
                const bottomY = idx === cfg.Geotech.soil_layers.length - 1 ? yMin : cfg.Geotech.soil_layers[idx + 1].top_elev;
                const midY = (layer.top_elev + Math.max(bottomY, yMin)) / 2;
                return (
                    <g key={idx}>
                        <rect x={cx(xMin)} y={cy(layer.top_elev)} width={cx(xMax) - cx(xMin)} height={cy(bottomY) - cy(layer.top_elev)} fill={layerColors[idx % layerColors.length]} opacity="0.3" />
                        <line x1={cx(xMin)} y1={cy(layer.top_elev)} x2={cx(xMax)} y2={cy(layer.top_elev)} stroke="#1e293b" strokeWidth="1" />
                    </g>
                );
                })}
                
                {/* 2. 地下水位线 */}
                {cfg.Water.has_water && (
                <g>
                    <line x1={cx(xMin)} y1={cy(cfg.Water.y_gwt)} x2={cx(xMax)} y2={cy(cfg.Water.y_gwt)} stroke="#3b82f6" strokeWidth="1" strokeDasharray="10,5" opacity="0.5" />
                    <rect x={cx(xMin)} y={cy(cfg.Water.y_gwt)} width={cx(xMax)-cx(xMin)} height={cy(yMin)-cy(cfg.Water.y_gwt)} fill="#3b82f6" opacity="0.05" />
                </g>
                )}

                {/* 3. 滑动体高亮预警 */}
                {circCoords.length > 0 && (
                <polygon points={`${circPoints} ${currPoints.split(' ').reverse().join(' ')}`} fill="url(#failureGrad)" opacity="0.15" />
                )}
            </g>

            {/* 原地形虚线 */}
            {!isOriginal && <polyline points={origPoints} fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4,4" />}

            {/* 现地形实线边界 */}
            <polyline points={currPoints} fill="none" stroke="#94a3b8" strokeWidth="2" filter="url(#glow-slope)" />

            {/* 张裂缝与积水渲染 (应急模式) */}
            {cfg.Damage && cfg.Damage.crack_depth > 0 && (
              <g>
                <rect 
                  x={cx(L_slope + (cfg.Damage.crack_distance || 0)) - 1} 
                  y={cy(geom.H)} 
                  width="2" 
                  height={cy(geom.H - cfg.Damage.crack_depth) - cy(geom.H)}
                  fill="#ef4444"
                  className="animate-pulse"
                />
                {/* Energy Column / Glow for Crack */}
                <rect 
                  x={cx(L_slope + (cfg.Damage.crack_distance || 0)) - 4} 
                  y={cy(geom.H)} 
                  width="8" 
                  height={cy(geom.H - cfg.Damage.crack_depth) - cy(geom.H)}
                  fill="#ef4444"
                  opacity="0.1"
                />
              </g>
            )}

            {/* 最危险滑面红线 */}
            <polyline points={circPoints} fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="5,2" filter="url(#glow-slope)" className="animate-pulse" />
            
            </svg>

            {/* Floating Stats */}
            <div className="absolute bottom-6 right-6 flex space-x-4">
               <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-2 text-[8px] font-mono">
                  <div className="text-slate-500 uppercase mb-1">Slope Angle</div>
                  <div className="text-blue-400 font-black">{geom.beta}°</div>
               </div>
               <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-2 text-[8px] font-mono">
                  <div className="text-slate-500 uppercase mb-1">Height</div>
                  <div className="text-blue-400 font-black">{geom.H}m</div>
               </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full p-6 overflow-hidden bg-slate-950 text-slate-300">
      {/* LEFT: Parameter Sidebar */}
      <div className="lg:col-span-3 flex flex-col space-y-4 h-full overflow-hidden">
        {/* Slope Segment Management */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl shadow-2xl border border-slate-800 flex flex-col max-h-[35%] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-scan pointer-events-none" />
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
            <h3 className="font-bold text-blue-400 text-[10px] uppercase tracking-[0.2em] flex items-center">
              <Layers className="w-3.5 h-3.5 mr-2" /> 边坡分段数字孪生
            </h3>
            <button 
              onClick={addSegment}
              className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-all"
              title="新增测段"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar">
            {segments.map(seg => (
              <div 
                key={seg.id}
                onClick={() => {
                  if (editingSegmentId !== seg.id) setActiveSegmentId(seg.id);
                }}
                className={`group p-3 rounded-xl border transition-all relative overflow-hidden ${
                  activeSegmentId === seg.id 
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'bg-slate-800/20 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start z-10 relative">
                  <div className="flex-1 pr-2">
                    {editingSegmentId === seg.id ? (
                      <input
                        autoFocus
                        value={editSegmentName}
                        onChange={(e) => setEditSegmentName(e.target.value)}
                        onBlur={() => saveSegmentName(seg.id)}
                        onKeyDown={(e) => e.key === 'Enter' && saveSegmentName(seg.id)}
                        className="w-full text-xs font-bold text-blue-400 bg-slate-950/50 border border-blue-500/30 rounded px-2 py-1 focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${activeSegmentId === seg.id ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`} />
                        <span className="text-xs font-bold text-slate-300 truncate tracking-tight">{seg.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditSegmentName(seg.name);
                            setEditingSegmentId(seg.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-blue-400"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-[8px] text-slate-500 font-mono mt-1 uppercase opacity-60">REF_ID: {seg.id.split('-').pop()}</div>
                  </div>
                  <button 
                    onClick={(e) => deleteSegment(e, seg.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-600 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {activeSegmentId === seg.id && (
                  <div className="absolute top-0 right-0 p-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={saveCurrentParams}
              className="w-full py-2.5 text-[10px] font-black text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-xl shadow-lg transition-all flex justify-center items-center uppercase tracking-widest"
            >
              <Save className="w-3.5 h-3.5 mr-2" /> 归档至仿真历史库
            </button>
          </div>
        </div>

        {/* Parameter Configuration Form */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl shadow-2xl border border-slate-800 flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
            <h3 className="font-bold text-blue-400 text-[10px] uppercase tracking-[0.2em] flex items-center">
              <Settings className="w-3.5 h-3.5 mr-2" /> 求解器参数矩阵
            </h3>
          </div>
          <div className="p-4 space-y-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <Layers className="w-3.5 h-3.5 mr-2 text-blue-500" /> 几何边界条件
              </h4>
              <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">边坡高度 (m)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={slopeParams.height} onChange={e => updateParam('height', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">坡面夹角 (°)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={slopeParams.angle} onChange={e => updateParam('angle', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                  各向异性层位设定
                </h4>
                <button 
                  onClick={() => {
                    const newLayers = [...slopeParams.soilLayers, { thickness: 2, gamma: 18, c: 10, phi: 15 }];
                    updateParam('soilLayers', newLayers);
                  }}
                  className="p-1 text-blue-500 hover:bg-blue-500/10 rounded border border-blue-500/20 transition-all"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {slopeParams.soilLayers.map((layer, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 relative group transition-all hover:border-slate-600">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">LAYER_{idx + 1}</span>
                      {slopeParams.soilLayers.length > 1 && (
                        <button onClick={() => {
                          const newLayers = slopeParams.soilLayers.filter((_, i) => i !== idx);
                          updateParam('soilLayers', newLayers);
                        }} className="text-slate-600 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       {['thickness', 'gamma', 'c', 'phi'].map((key) => (
                         <div key={key}>
                           <label className="block text-[8px] text-slate-500 uppercase font-black mb-1">{key === 'thickness' ? '厚度' : key === 'gamma' ? '重度' : key === 'c' ? '粘聚力' : '内摩擦角'}</label>
                           <input 
                              type="number" className="w-full bg-slate-900/80 border border-slate-700 rounded p-1 text-[10px] text-blue-400 font-mono" 
                              value={(layer as any)[key]} 
                              onChange={e => {
                                const newLayers = [...slopeParams.soilLayers];
                                (newLayers[idx] as any)[key] = parseFloat(e.target.value);
                                updateParam('soilLayers', newLayers);
                              }} 
                           />
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <CloudRain className="w-3.5 h-3.5 mr-2 text-blue-500" /> 流体耦合工况
              </h4>
              <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">降雨强度 (mm)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={slopeParams.rainfall} onChange={e => updateParam('rainfall', parseFloat(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">水位线 Y (m)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-400 font-mono" value={slopeParams.groundwater} onChange={e => updateParam('groundwater', parseFloat(e.target.value))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase mb-1 font-bold">地震水平动 Kh</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-red-400 font-mono" value={slopeParams.seismicKh} onChange={e => updateParam('seismicKh', parseFloat(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="font-black text-orange-500 text-[10px] uppercase tracking-[0.2em] flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-2" /> 病害图谱注入
              </h4>
              <div className={`p-4 rounded-xl border transition-all ${damageLevel > 0 ? 'bg-orange-500/5 border-orange-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-orange-400 font-bold outline-none focus:border-orange-500 mb-3"
                  value={damageLevel}
                  onChange={e => setDamageLevel(Number(e.target.value))}
                >
                  <option value={0}>0级：设计态 (Nominal)</option>
                  <option value={1}>Ⅰ级：初级变形</option>
                  <option value={2}>Ⅱ级：结构损伤</option>
                  <option value={3}>Ⅲ级：贯通劣化</option>
                  <option value={4}>Ⅳ级：终态崩溃</option>
                </select>

                {damageLevel > 0 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-orange-500/70 border-t border-orange-500/20 pt-3">
                       <div>STRENGTH_LOSS: <span className="text-orange-400 font-bold">{Math.round((1-DAMAGE_MAP[damageLevel].c_factor)*100)}%</span></div>
                       <div>CRACK_DEPTH: <span className="text-orange-400 font-bold">{DAMAGE_MAP[damageLevel].crack_depth}m</span></div>
                    </div>
                    <div>
                      <label className="block text-[8px] text-orange-500/50 uppercase font-black mb-1">裂缝水平坐标控制 (m)</label>
                      <input 
                        type="number" step="0.5"
                        className="w-full bg-slate-900 border border-orange-500/30 rounded p-1.5 text-[10px] text-orange-400 font-mono" 
                        value={crackDistance} 
                        onChange={e => setCrackDistance(parseFloat(e.target.value))} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950/80 sticky bottom-0 z-10 backdrop-blur-sm">
            <button 
              onClick={runStatusAnalysis}
              disabled={isCalculating || isOptimizing}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform active:scale-95 disabled:opacity-50 flex justify-center items-center text-xs tracking-widest uppercase"
            >
              {isCalculating ? <Activity className="animate-spin mr-2 h-4 w-4" /> : 'Run LEM Solver CORE'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Main Content Area */}
      <div className="lg:col-span-9 flex flex-col h-full bg-slate-900/30 rounded-xl shadow-2xl border border-slate-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-scan pointer-events-none" />
        
        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-800 flex justify-between items-center z-10">
          <div className="flex items-center space-x-4">
             <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
             </div>
             <div>
                <h2 className="text-sm font-black text-slate-100 tracking-wider mb-0.5 uppercase">InfraGuard | 边坡稳定性极限平衡评估系统 V11.0</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase italic">Cyber-Physical Analysis & Optimization Suite</p>
             </div>
          </div>
          <div className="flex space-x-3">
            {results && !hasOptimized && (
              <button 
                onClick={runOptimization}
                disabled={isOptimizing}
                className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center text-[10px] uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              >
                {isOptimizing ? '矩阵推演中...' : '启动加固拓扑寻优'}
              </button>
            )}
            <button 
              onClick={runStatusAnalysis}
              disabled={isCalculating || isOptimizing}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center text-[10px] uppercase tracking-widest border border-slate-700"
            >
              {isCalculating ? '分析同步中' : '刷新实时状态'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20 custom-scrollbar">
          {!results ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
               <Activity className="w-16 h-16 text-slate-700 animate-pulse mb-4" />
               <p className="text-xs font-mono tracking-[0.3em] text-slate-600 uppercase">等待仿真脉冲注入...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              {/* Tabs */}
              <div className="flex space-x-8 border-b border-slate-800">
                <button 
                  onClick={() => setActiveTab('status')}
                  className={`pb-4 px-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all relative ${activeTab === 'status' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Status Core
                  {activeTab === 'status' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                </button>
                {hasOptimized && (
                  <>
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className={`pb-4 px-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all relative ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Security Dashboard
                      {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                    </button>
                    <button 
                      onClick={() => setActiveTab('schemes')}
                      className={`pb-4 px-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all relative ${activeTab === 'schemes' ? 'text-slate-300' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Scheme Matrix
                      {activeTab === 'schemes' && <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-300" />}
                    </button>
                  </>
                )}
              </div>

              {activeTab === 'status' && (
                <div className="space-y-8">
                  <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                       <Zap className="w-24 h-24 text-blue-500" />
                    </div>
                    
                    <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="font-black text-slate-100 text-lg tracking-widest uppercase mb-1">边坡极限平衡域仿真报告</h3>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">Stability Evaluation Core Output // Alpha v4</p>
                      </div>
                      {!hasOptimized && (
                        <button 
                          onClick={runOptimization}
                          disabled={isOptimizing}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-black transition-all flex items-center text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                        >
                          <Rocket className="w-3.5 h-3.5 mr-2" /> {isOptimizing ? '矩阵推演中...' : '启动寻优'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-10 items-start">
                      <div className="lg:col-span-8 w-full">
                        {renderSlope2D(null, results.circ0, `危急滑裂面空间分布 (FS=${results.FS0.toFixed(3)})`, true)}
                      </div>
                      <div className="lg:col-span-4 flex flex-col space-y-6 w-full">
                        {/* FS Gauge Dashboard */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
                           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Real-time Stability Gauge</div>
                           <div className="flex flex-col items-center">
                              <div className="relative w-40 h-40">
                                 <svg viewBox="0 0 100 50" className="w-full h-full">
                                    <path 
                                       d="M 10 45 A 40 40 0 0 1 90 45" 
                                       fill="none" 
                                       stroke="#1e293b" 
                                       strokeWidth="10" 
                                       strokeLinecap="round" 
                                    />
                                    <path 
                                       d="M 10 45 A 40 40 0 0 1 90 45" 
                                       fill="none" 
                                       stroke={`url(#gaugeGrad-${results.FS0 < results.cfg.Target.FS_target ? 'bad' : 'good'})`} 
                                       strokeWidth="10" 
                                       strokeLinecap="round" 
                                       strokeDasharray={`${Math.min(100, (results.FS0 / 2.5) * 100) * 1.25} 125`}
                                       className="transition-all duration-1000"
                                    />
                                    <defs>
                                       <linearGradient id="gaugeGrad-good" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor="#10b981" />
                                          <stop offset="100%" stopColor="#3b82f6" />
                                       </linearGradient>
                                       <linearGradient id="gaugeGrad-bad" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor="#ef4444" />
                                          <stop offset="100%" stopColor="#f59e0b" />
                                       </linearGradient>
                                    </defs>
                                 </svg>
                                 <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                                    <span className={`text-4xl font-black font-mono ${results.FS0 < results.cfg.Target.FS_target ? 'text-red-400' : 'text-emerald-400'} drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]`}>
                                       {results.FS0.toFixed(3)}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Factor of Safety</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Gap Analysis */}
                        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
                           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">下滑力缺口 Gap Analysis</div>
                           <div className="flex items-baseline justify-center space-x-2">
                              <span className={`text-4xl font-black font-mono ${results.gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                 {results.gap.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">kN/m</span>
                           </div>
                           <div className="mt-4 flex items-center space-x-2">
                              {results.gap > 0 ? (
                                <div className="flex items-center text-[10px] text-red-500 font-bold uppercase animate-pulse">
                                   <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Stability Deficit Detected
                                </div>
                              ) : (
                                <div className="flex items-center text-[10px] text-emerald-500 font-bold uppercase">
                                   <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Margin Secured
                                </div>
                              )}
                           </div>
                        </div>

                        {/* Conclusion Block */}
                        <div className={`p-6 rounded-2xl border backdrop-blur-sm ${results.FS0 < results.cfg.Target.FS_target ? 'bg-red-500/10 border-red-500/30 text-red-100' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'}`}>
                           <h4 className="text-sm font-black uppercase tracking-widest mb-2 flex items-center">
                              {results.FS0 < results.cfg.Target.FS_target ? <Zap className="w-4 h-4 mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                              诊断结论
                           </h4>
                           <p className="text-xs leading-relaxed opacity-70 font-mono uppercase tracking-tighter">
                             Condition: {results.FS0 < results.cfg.Target.FS_target ? 'CRITICAL_UNSTABLE' : 'OPERATIONAL_SAFE'}<br/>
                             Threshold: {results.cfg.Target.FS_target.toFixed(2)} [GB 50330-2013]
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!hasOptimized && (
                    <div className="flex justify-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      <button 
                        onClick={runOptimization}
                        disabled={isOptimizing}
                        className="group relative bg-emerald-600 hover:bg-emerald-500 text-white px-16 py-6 rounded-3xl font-black shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex flex-col items-center overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        <Rocket className="w-8 h-8 mb-2 animate-bounce" />
                        <span className="text-lg uppercase tracking-[0.3em]">启动全域加固拓扑深度推演</span>
                        <span className="text-[10px] font-mono opacity-60 mt-1 uppercase tracking-widest">Execute Full Scheme Matrix Search (Heuristic LEM-Matrix Solver)</span>
                        {isOptimizing && (
                          <div className="absolute inset-0 bg-emerald-600 rounded-3xl flex items-center justify-center">
                            <Activity className="animate-spin h-8 w-8 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Pre-analysis */}
                    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center">
                         <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 animate-pulse" />
                         Phase 1: Baseline Structural Condition
                      </div>
                      <div className="flex flex-col gap-6">
                        {renderSlope2D(null, results.circ0, `FS_BASE: ${results.FS0.toFixed(3)}`, true)}
                        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-2xl text-[10px] font-mono leading-relaxed">
                          <p className="font-black text-slate-400 mb-3 uppercase tracking-wider">Simulation Parameters</p>
                          <div className="grid grid-cols-2 gap-y-2 opacity-70">
                             <div>GEOM_H: {results.cfg.Geometry.H}m</div>
                             <div>GEOM_BETA: {results.cfg.Geometry.beta}°</div>
                             <div>LOAD_KH: {results.cfg.Seismic.k_h.toFixed(2)}</div>
                             <div className={results.FS0 < results.cfg.Target.FS_target ? "text-red-400 font-bold" : "text-emerald-400"}>
                                STATUS: {results.FS0 < results.cfg.Target.FS_target ? "UNSTABLE" : "SAFE"}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Best Scheme */}
                    {results.all_results.length > 0 && (
                      <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-8 rounded-3xl relative overflow-hidden border-emerald-500/30">
                        <div className="absolute top-0 right-0 p-4">
                           <Trophy className="w-8 h-8 text-emerald-500 opacity-20" />
                        </div>
                        <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
                           Phase 2: Optimized Topology Rank 1
                        </div>
                        <div className="flex flex-col gap-6">
                          {renderSlope2D(results.all_results[0].Plot_Data, results.all_results[0].Plot_Data.circle, `FS_OPT: ${results.all_results[0].FS.toFixed(3)}`, false, results.all_results[0].FS)}
                          <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl text-[10px] font-mono leading-relaxed">
                            <p className="font-black text-emerald-400/70 mb-3 uppercase tracking-wider underline">Optimization Report</p>
                            <p className="text-slate-100 font-black mb-2 uppercase tracking-widest">{results.all_results[0].Method.replace('\n', '')}</p>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                  <div className="text-slate-500 mb-1">COST_EST</div>
                                  <div className="text-lg font-black text-emerald-400 text-shadow-glow">¥{results.all_results[0].Cost_W.toFixed(1)}W</div>
                               </div>
                               <div>
                                  <div className="text-slate-500 mb-1">TIME_EST</div>
                                  <div className="text-lg font-black text-blue-400">{Math.ceil(results.all_results[0].Time_d)} Days</div>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Charts */}
                  {results.all_results.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-8 rounded-3xl h-[400px]">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Safety Factor Comparison Matrix</h3>
                        <ResponsiveContainer width="100%" height="80%">
                          <BarChart data={[{ Method: 'BASE', FS: results.FS0 }, ...results.all_results.map((r:any) => ({ Method: r.Method.split('+')[0], FS: r.FS }))]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="Method" tick={{fontSize: 9, fill: '#64748b'}} interval={0} height={40} />
                            <YAxis tick={{fontSize: 9, fill: '#64748b'}} domain={[0, 'auto']} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                            <Bar dataKey="FS">
                              {
                                [{ Method: 'BASE', FS: results.FS0 }, ...results.all_results].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#475569' : (index === 1 ? '#10b981' : '#3b82f6')} radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                                ))
                              }
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-8 rounded-3xl h-[400px]">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Economic Efficiency & Scheduling</h3>
                        <ResponsiveContainer width="100%" height="80%">
                          <BarChart data={results.all_results.slice(0, 5).map((r:any) => ({ Method: r.Method.split('+')[0], Cost: r.Cost_W, Time: Math.ceil(r.Time_d) }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="Method" tick={{fontSize: 9, fill: '#64748b'}} interval={0} height={40} />
                            <YAxis yAxisId="left" orientation="left" stroke="#ef4444" tick={{fontSize: 9}} />
                            <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{fontSize: 9}} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                            <Bar yAxisId="left" dataKey="Cost" name="Cost (W)" fill="#ef4444" radius={[4, 4, 0, 0]} fillOpacity={0.6} />
                            <Bar yAxisId="right" dataKey="Time" name="Time (D)" fill="#8b5cf6" radius={[4, 4, 0, 0]} fillOpacity={0.6} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schemes' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/20 animate-scan pointer-events-none" />
                    <div className="p-6 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Activity className="w-3.5 h-3.5 mr-2" /> 多演化路径方案矩阵汇编
                      </h3>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                         <span>TOTAL_SOLUTIONS:</span>
                         <span className="text-blue-400 font-bold">{results.all_results.length}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-950/50 text-slate-500 uppercase tracking-tighter text-[9px] font-black border-b border-slate-800">
                            <th className="p-4">Rank</th>
                            <th className="p-4">Topology Method</th>
                            <th className="p-4">Stability (FS)</th>
                            <th className="p-4">Capex (¥)</th>
                            <th className="p-4">Duration</th>
                            <th className="p-4">Detailed Matrix</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.all_results.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-800/50 hover:bg-blue-500/5 transition-colors group">
                              <td className="p-4 font-black font-mono text-slate-600 group-hover:text-blue-400 tracking-tighter">#{idx + 1}</td>
                              <td className="p-4 font-bold text-slate-300">{row.Method.replace('\n', '')}</td>
                              <td className="p-4">
                                <span className={`font-mono font-black ${row.FS < results.cfg.Target.FS_target ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {row.FS.toFixed(3)}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-bold text-orange-400">¥{row.Cost_W.toFixed(1)}W</td>
                              <td className="p-4 font-mono text-blue-400">{Math.ceil(row.Time_d)}D</td>
                              <td className="p-4 text-slate-500 font-mono text-[10px] italic">{row.Param.replace('\n', ' | ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-800">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 text-center italic">Spatial Evolution & Slip Surface Transition Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {results.all_results.map((row: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group overflow-hidden">
                          <div className="mb-4 flex justify-between items-center px-1">
                             <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-500/30 px-2 py-0.5 rounded-full">Rank_{idx + 1}</span>
                             <span className="text-[10px] font-mono text-slate-500">FS: {row.FS.toFixed(3)}</span>
                          </div>
                          {renderSlope2D(row.Plot_Data, row.Plot_Data.circle, row.Method.replace('\n', ''), false, row.FS)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlopeAnalysis;
